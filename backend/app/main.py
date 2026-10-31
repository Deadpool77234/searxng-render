import io
import os
from typing import Any
from urllib.parse import quote_plus, urlparse

import httpx
import pypdf
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .database import (
    add_bookmark,
    add_custom_bang,
    add_domain_rule,
    add_local_document,
    add_search_history,
    delete_bookmark,
    delete_bookmark_by_url,
    delete_custom_bang,
    delete_domain_rule,
    delete_local_document,
    delete_search_history,
    export_all_user_data,
    get_all_bangs,
    get_all_bookmark_urls,
    get_bookmarks,
    get_domain_rule_maps,
    get_domain_rules,
    get_local_document_by_id,
    get_local_documents,
    get_search_history,
    import_user_data,
    init_database,
    search_local_documents,
)
from .ece_tools import detect_instant_answer

app = FastAPI(
    title="MySearch API",
    version="0.7.0",
    description="Personal federated search platform with history, bookmarks, domain reranking, local FTS5 vault, quick bangs, and ECE engineering tools",
)

# Initialize database schema and default domain rules on startup
init_database()

SEARXNG_URL = os.getenv(
    "SEARXNG_URL",
    "https://my-searxng-gf7s.onrender.com",
).rstrip("/")

# CORS configuration supporting localhost, LAN IP (mobile), Netlify, Render & custom domains
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BookmarkCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    url: str = Field(..., min_length=1, max_length=2000)
    snippet: str = Field("", max_length=3000)
    category: str = Field("general", max_length=50)
    tags: str = Field("", max_length=200)


class DomainRuleCreate(BaseModel):
    domain: str = Field(..., min_length=2, max_length=200)
    rule_type: str = Field("boost", pattern="^(boost|block)$")
    weight: float = Field(2.0, ge=1.1, le=10.0)
    notes: str = Field("", max_length=200)


class LocalNoteCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    content: str = Field(..., min_length=1)
    category: str = Field("notes", max_length=50)


class CustomBangCreate(BaseModel):
    prefix: str = Field(..., min_length=2, max_length=20)
    name: str = Field(..., min_length=1, max_length=100)
    url_template: str = Field(..., min_length=3, max_length=500)
    category: str = Field("custom", max_length=50)


def extract_text_from_bytes(filename: str, file_bytes: bytes) -> str:
    """Extract readable text from uploaded PDF, Markdown, or text documents."""
    clean_ext = filename.split(".")[-1].lower() if "." in filename else ""

    if clean_ext == "pdf":
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            extracted: list[str] = []
            for idx, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    extracted.append(f"--- Page {idx + 1} ---\n{text}")
            return "\n\n".join(extracted).strip()
        except Exception as exc:
            raise ValueError(f"Failed to extract text from PDF: {exc}")

    # Plain text / Markdown / Source files
    try:
        return file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return file_bytes.decode("latin-1", errors="replace")


# ─── DOMAIN RERANKING & SPAM FILTER PIPELINE ─────────────────────────────────

def extract_domain(url: str) -> str:
    """Extract clean domain without www prefix for rule matching."""
    try:
        netloc = urlparse(url).netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc
    except Exception:
        return ""


def rerank_and_filter_results(
    results: list[dict[str, Any]],
    boost_map: dict[str, float],
    block_set: set[str],
) -> list[dict[str, Any]]:
    """
    Rerank search results based on domain weights and remove spam domains.
    Uses Reciprocal Rank scoring with domain preference multipliers.
    """
    scored_items: list[tuple[float, dict[str, Any]]] = []

    for index, item in enumerate(results):
        url = item.get("url", "")
        hostname = extract_domain(url)

        # 1. Block Filter (drop spam/scrapers)
        is_blocked = False
        for blocked in block_set:
            if hostname == blocked or hostname.endswith(f".{blocked}"):
                is_blocked = True
                break
        if is_blocked:
            continue

        # 2. Base Reciprocal Rank Score
        base_score = 1.0 / (index + 1)

        # 3. Domain Multiplier
        multiplier = 1.0
        boosted = False
        for boosted_domain, weight in boost_map.items():
            if hostname == boosted_domain or hostname.endswith(f".{boosted_domain}"):
                multiplier = weight
                boosted = True
                break

        final_score = base_score * multiplier

        # Enrich item with metadata for frontend badges
        enriched = dict(item)
        if boosted:
            enriched["boosted"] = True
            enriched["boost_weight"] = multiplier

        scored_items.append((final_score, enriched))

    # Sort descending by final relevance score
    scored_items.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored_items]


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "mysearch-api",
        "version": "0.7.0",
    }


# ─── SEARCH ENDPOINT ─────────────────────────────────────────────────────────

@app.get("/api/search")
async def search(
    q: str = Query(..., min_length=1, max_length=200),
    category: str = Query("general"),
):
    """Search through federated SearXNG instances, local FTS5 vault, quick bangs, and ECE instant answers."""
    clean_query = q.strip()

    # 1. Detect Quick Bang prefix (e.g. !gh, !yt, !w, !arxiv, !v, !so)
    tokens = clean_query.split(maxsplit=1)
    if tokens and tokens[0].startswith("!"):
        prefix = tokens[0].lower()
        remainder = tokens[1].strip() if len(tokens) > 1 else ""
        try:
            all_bangs = get_all_bangs()
            bang_map = {b["prefix"].lower(): b for b in all_bangs}
            if prefix in bang_map:
                matched = bang_map[prefix]
                template = matched["url_template"]
                if template == "#local":
                    category = "local"
                    clean_query = remainder or ""
                elif template == "#ece":
                    category = "ece"
                    clean_query = remainder or ""
                else:
                    target_url = template.replace("{q}", quote_plus(remainder))
                    try:
                        add_search_history(query=clean_query, category="bang")
                    except Exception:
                        pass
                    return {
                        "query": clean_query,
                        "category": category,
                        "redirect_url": target_url,
                        "bang": matched["prefix"],
                        "bang_redirect": {
                            "prefix": matched["prefix"],
                            "name": matched["name"],
                            "target_url": target_url,
                            "remainder": remainder,
                        },
                        "results": [],
                        "total_results": 0,
                    }
        except Exception:
            pass

    # 2. Detect ECE & Math Instant Answers
    instant_answer = detect_instant_answer(clean_query)

    # 3. SPECIAL CASE: Dedicated Local Documents FTS5 Search
    if category == "local":
        local_matches = search_local_documents(clean_query, limit=25)
        try:
            add_search_history(query=clean_query, category="local")
        except Exception:
            pass

        formatted_local = [
            {
                "title": doc["title"],
                "url": f"#local-{doc['id']}",
                "content": doc.get("snippet") or "",
                "engine": "local_fts5",
                "category": doc.get("category", "notes"),
                "file_type": doc.get("file_type", "note"),
                "publishedDate": doc.get("created_at"),
                "is_local": True,
                "doc_id": doc["id"],
                "filename": doc.get("filename"),
            }
            for doc in local_matches
        ]
        return {
            "query": clean_query,
            "category": "local",
            "results": formatted_local,
            "total_results": len(formatted_local),
            "local_results": local_matches,
            "instant_answer": instant_answer,
        }

    # 4. WEB / FEDERATED CATEGORIES
    allowed_categories = {
        "general": "general",
        "images": "images",
        "videos": "videos",
        "news": "news",
    }

    if category not in allowed_categories:
        raise HTTPException(
            status_code=400,
            detail="Unsupported search category.",
        )

    params = {
        "q": clean_query,
        "format": "json",
        "categories": allowed_categories[category],
    }

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(18.0)) as client:
            response = await client.get(
                f"{SEARXNG_URL}/search",
                params=params,
            )
        response.raise_for_status()
        data = response.json()

    except (httpx.TimeoutException, httpx.HTTPStatusError, httpx.RequestError, ValueError) as exc:
        if instant_answer or local_matches:
            try:
                add_search_history(query=clean_query, category=category)
            except Exception:
                pass
            return {
                "query": clean_query,
                "category": category,
                "results": [],
                "total_results": 0,
                "instant_answer": instant_answer,
                "local_results": local_matches,
                "note": "Delivered instant calculation and vault results.",
            }
        if isinstance(exc, httpx.TimeoutException):
            raise HTTPException(
                status_code=504,
                detail="Search service timed out. SearXNG instance may be waking up.",
            )
        elif isinstance(exc, httpx.HTTPStatusError):
            raise HTTPException(
                status_code=502,
                detail=f"Search service returned HTTP {exc.response.status_code}.",
            )
        else:
            raise HTTPException(
                status_code=502,
                detail="Unable to reach the search service.",
            )
    except Exception:
        if instant_answer or local_matches:
            return {
                "query": clean_query,
                "category": category,
                "results": [],
                "total_results": 0,
                "instant_answer": instant_answer,
                "local_results": local_matches,
            }
        raise HTTPException(
            status_code=500,
            detail="Unexpected search error.",
        )

    raw_results = data.get("results", [])

    # Apply domain boosting and spam filtering pipeline
    try:
        boost_map, block_set = get_domain_rule_maps()
        processed_results = rerank_and_filter_results(raw_results, boost_map, block_set)
    except Exception:
        processed_results = raw_results

    # Search local FTS5 knowledge vault in parallel for blended personal intelligence
    local_matches: list[dict[str, Any]] = []
    try:
        local_matches = search_local_documents(clean_query, limit=3)
    except Exception:
        local_matches = []

    # History logging (non-critical; DB errors must not fail the search request)
    try:
        add_search_history(
            query=clean_query,
            category=category,
        )
    except Exception:
        pass

    return {
        "query": clean_query,
        "category": category,
        "results": processed_results,
        "total_results": len(processed_results),
        "local_results": local_matches,
        "instant_answer": instant_answer,
    }


# ─── SEARCH HISTORY ENDPOINTS ────────────────────────────────────────────────

@app.get("/api/history")
async def history(
    limit: int = Query(25, ge=1, le=100),
):
    """Return recent search history."""
    try:
        return {
            "history": get_search_history(limit),
        }
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to read search history.",
        )


@app.delete("/api/history/{history_id}")
async def delete_history(history_id: int):
    """Delete one history entry."""
    try:
        deleted = delete_search_history(history_id)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to delete search history.",
        )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="History entry not found.",
        )

    return {
        "status": "deleted",
        "id": history_id,
    }


# ─── BOOKMARKS & SAVED KNOWLEDGE ENDPOINTS ───────────────────────────────────

@app.post("/api/bookmarks")
async def create_bookmark(item: BookmarkCreate):
    """Save or update a bookmarked search result."""
    try:
        bookmark_id = add_bookmark(
            title=item.title,
            url=item.url,
            snippet=item.snippet,
            category=item.category,
            tags=item.tags,
        )
        return {
            "status": "saved",
            "id": bookmark_id,
            "url": item.url,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to save bookmark: {exc}",
        )


@app.get("/api/bookmarks")
async def list_bookmarks(
    limit: int = Query(100, ge=1, le=500),
    tag: str | None = Query(None),
):
    """Return stored bookmarks, optionally filtered by tag."""
    try:
        bookmarks = get_bookmarks(limit=limit, tag=tag)
        return {
            "bookmarks": bookmarks,
            "count": len(bookmarks),
        }
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve bookmarks.",
        )


@app.get("/api/bookmarks/urls")
async def list_bookmark_urls():
    """Return all bookmarked URLs for instantaneous frontend lookup."""
    try:
        urls = get_all_bookmark_urls()
        return {
            "urls": urls,
            "count": len(urls),
        }
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve bookmark URLs.",
        )


@app.delete("/api/bookmarks/by-url")
async def remove_bookmark_by_url(url: str = Query(..., min_length=1)):
    """Delete a bookmark by URL (used when un-starring a search result)."""
    try:
        deleted = delete_bookmark_by_url(url)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to delete bookmark.",
        )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Bookmark for specified URL not found.",
        )

    return {
        "status": "deleted",
        "url": url,
    }


@app.delete("/api/bookmarks/{bookmark_id}")
async def remove_bookmark(bookmark_id: int):
    """Delete a bookmark by database ID."""
    try:
        deleted = delete_bookmark(bookmark_id)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to delete bookmark.",
        )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Bookmark not found.",
        )

    return {
        "status": "deleted",
        "id": bookmark_id,
    }


# ─── DOMAIN BOOST & SPAM RULES ENDPOINTS ─────────────────────────────────────

@app.get("/api/preferences/domains")
async def list_domain_rules():
    """List all domain boosting and blocking rules."""
    try:
        rules = get_domain_rules()
        return {
            "rules": rules,
            "count": len(rules),
        }
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve domain preferences.",
        )


@app.post("/api/preferences/domains")
async def create_domain_rule(rule: DomainRuleCreate):
    """Add or update a domain boost/block rule."""
    try:
        rule_id = add_domain_rule(
            domain=rule.domain,
            rule_type=rule.rule_type,
            weight=rule.weight,
            notes=rule.notes,
        )
        return {
            "status": "saved",
            "id": rule_id,
            "domain": rule.domain,
            "rule_type": rule.rule_type,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to save domain rule: {exc}")


@app.delete("/api/preferences/domains/{rule_id}")
async def remove_domain_rule(rule_id: int):
    """Delete a domain rule by ID."""
    try:
        deleted = delete_domain_rule(rule_id)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to delete domain rule.",
        )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Domain rule not found.",
        )

    return {
        "status": "deleted",
        "id": rule_id,
    }


# ─── LOCAL DOCUMENTS & FTS5 KNOWLEDGE VAULT ENDPOINTS ────────────────────────

@app.get("/api/local/documents")
async def list_local_documents(
    limit: int = Query(50, ge=1, le=200),
    category: str | None = Query(None),
):
    """List indexed local documents, notes, and PDFs."""
    try:
        docs = get_local_documents(limit=limit, category=category)
        return {
            "documents": docs,
            "count": len(docs),
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to retrieve local documents: {exc}",
        )


@app.get("/api/local/documents/{doc_id}")
async def get_document(doc_id: int):
    """Fetch complete content of a local document by ID."""
    doc = get_local_document_by_id(doc_id)
    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Local document not found.",
        )
    return doc


@app.post("/api/local/notes")
async def create_note(note: LocalNoteCreate):
    """Create a new personal text/markdown note in the knowledge vault."""
    try:
        doc_id = add_local_document(
            title=note.title,
            filename=f"{note.title.lower().replace(' ', '_')[:30]}.md",
            file_type="note",
            content=note.content,
            category=note.category,
            file_size=len(note.content.encode("utf-8")),
        )
        return {
            "status": "created",
            "id": doc_id,
            "title": note.title,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to create note: {exc}",
        )


@app.post("/api/local/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(None),
    category: str = Form("notes"),
):
    """Upload and index a PDF, Markdown, or text file into the SQLite FTS5 index."""
    try:
        content_bytes = await file.read()
        if not content_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        extracted_text = extract_text_from_bytes(file.filename or "upload.txt", content_bytes)
        if not extracted_text:
            raise HTTPException(status_code=400, detail="Could not extract readable text from file.")

        clean_ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else "txt"
        doc_title = title.strip() if title else (file.filename or "Uploaded Document")

        doc_id = add_local_document(
            title=doc_title,
            filename=file.filename or "upload",
            file_type=clean_ext,
            content=extracted_text,
            category=category,
            file_size=len(content_bytes),
        )

        return {
            "status": "indexed",
            "id": doc_id,
            "title": doc_title,
            "filename": file.filename,
            "file_type": clean_ext,
            "characters_indexed": len(extracted_text),
        }
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process document upload: {exc}",
        )


@app.delete("/api/local/documents/{doc_id}")
async def remove_local_document(doc_id: int):
    """Delete an indexed document from SQLite and FTS5."""
    try:
        deleted = delete_local_document(doc_id)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to delete document: {exc}",
        )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Local document not found.",
        )

    return {
        "status": "deleted",
        "id": doc_id,
    }


@app.get("/api/local/search")
async def search_vault(
    q: str = Query(..., min_length=1),
    limit: int = Query(15, ge=1, le=50),
):
    """Dedicated endpoint to search across the local FTS5 knowledge vault."""
    try:
        matches = search_local_documents(q, limit=limit)
        return {
            "query": q,
            "results": matches,
            "count": len(matches),
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute local search: {exc}",
        )


# ─── QUICK BANGS ENDPOINTS ───────────────────────────────────────────────────

@app.get("/api/bangs")
async def list_bangs():
    """Return all available quick search bangs (e.g. !gh, !yt, !w, !v)."""
    try:
        bangs = get_all_bangs()
        return {
            "bangs": bangs,
            "count": len(bangs),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve bangs: {exc}")


@app.post("/api/bangs")
async def create_bang(bang: CustomBangCreate):
    """Add a new custom bang shortcut."""
    try:
        bang_id = add_custom_bang(
            prefix=bang.prefix,
            name=bang.name,
            url_template=bang.url_template,
            category=bang.category,
        )
        return {
            "status": "saved",
            "id": bang_id,
            "prefix": bang.prefix,
            "name": bang.name,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save bang: {exc}")


@app.delete("/api/bangs/{bang_id}")
async def remove_bang(bang_id: int):
    """Delete a custom bang by ID."""
    try:
        deleted = delete_custom_bang(bang_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to delete bang: {exc}")

    if not deleted:
        raise HTTPException(status_code=404, detail="Bang not found.")

    return {"status": "deleted", "id": bang_id}


# ─── DATA PORTABILITY (EXPORT & IMPORT JSON) ─────────────────────────────────

@app.get("/api/export")
async def export_data():
    """Export complete personal search platform state as JSON."""
    try:
        return export_all_user_data()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to export user data: {exc}")


@app.post("/api/import")
async def import_data(payload: dict[str, Any]):
    """Import and merge user data from a previously exported JSON backup."""
    try:
        result = import_user_data(payload)
        return {
            "status": "success",
            "message": "User data successfully merged into SQLite database.",
            "imported_counts": result,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to import data: {exc}")


# ─── ECE ENGINEERING & MATH CALCULATION ENDPOINT ─────────────────────────────

@app.get("/api/tools/ece")
async def calculate_ece(q: str = Query(..., min_length=1)):
    """Evaluate an ECE or Math expression and return a structured calculation result."""
    res = detect_instant_answer(q)
    if not res:
        raise HTTPException(
            status_code=400,
            detail=f"Could not calculate formula or match expression for: '{q}'. Try queries like 'ohm 12v 100', 'rc 10k 100nf', 'resistor 4.7k', 'hex 255', '30dbm', or 'sqrt(144)'.",
        )
    return res
