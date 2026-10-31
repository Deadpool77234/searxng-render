from datetime import datetime
import os
from pathlib import Path
import re
import sqlite3
from typing import Any

BASE_DIR = Path(__file__).resolve().parent.parent
db_env = os.getenv("MYSEARCH_DB_PATH")
DATABASE_PATH = Path(db_env) if db_env else BASE_DIR / "mysearch.db"


def get_connection() -> sqlite3.Connection:
    """Create a SQLite connection with row access."""
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_database() -> None:
    """Create required tables for history, bookmarks, and domain rules if they do not exist."""
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS search_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'general',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS bookmarks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                url TEXT NOT NULL UNIQUE,
                snippet TEXT DEFAULT '',
                category TEXT NOT NULL DEFAULT 'general',
                tags TEXT DEFAULT '',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS domain_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain TEXT NOT NULL UNIQUE,
                rule_type TEXT NOT NULL, -- 'boost' or 'block'
                weight REAL NOT NULL DEFAULT 2.0,
                notes TEXT DEFAULT '',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        # Seed initial engineering boost & spam block rules if empty
        existing_rules = connection.execute("SELECT COUNT(*) as count FROM domain_rules").fetchone()["count"]
        if existing_rules == 0:
            default_rules = [
                ("github.com", "boost", 2.5, "Primary Code & Open Source"),
                ("stackoverflow.com", "boost", 2.0, "Developer Q&A"),
                ("docs.python.org", "boost", 2.5, "Official Python Documentation"),
                ("arxiv.org", "boost", 2.2, "Academic & Research Papers"),
                ("wikipedia.org", "boost", 1.8, "Encyclopedic Overview"),
                ("allaboutcircuits.com", "boost", 2.0, "Electronics Engineering Reference"),
                ("hackaday.com", "boost", 2.0, "Hardware & Embedded Projects"),
                ("pinterest.com", "block", 0.0, "Image clickbait & spam"),
            ]
            connection.executemany(
                """
                INSERT OR IGNORE INTO domain_rules (domain, rule_type, weight, notes)
                VALUES (?, ?, ?, ?)
                """,
                default_rules,
            )

        # ── LOCAL DOCUMENTS & FTS5 FULL TEXT SEARCH ──
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS local_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                filename TEXT NOT NULL,
                file_path TEXT DEFAULT '',
                file_type TEXT NOT NULL, -- 'pdf', 'md', 'txt', 'note'
                category TEXT NOT NULL DEFAULT 'notes',
                content TEXT NOT NULL,
                file_size INTEGER DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        connection.execute(
            """
            CREATE VIRTUAL TABLE IF NOT EXISTS local_documents_fts USING fts5(
                title,
                content,
                content='local_documents',
                content_rowid='id',
                tokenize='porter unicode61'
            )
            """
        )

        # FTS sync triggers
        connection.execute(
            """
            CREATE TRIGGER IF NOT EXISTS local_docs_ai AFTER INSERT ON local_documents BEGIN
                INSERT INTO local_documents_fts(rowid, title, content)
                VALUES (new.id, new.title, new.content);
            END
            """
        )

        connection.execute(
            """
            CREATE TRIGGER IF NOT EXISTS local_docs_ad AFTER DELETE ON local_documents BEGIN
                INSERT INTO local_documents_fts(local_documents_fts, rowid, title, content)
                VALUES ('delete', old.id, old.title, old.content);
            END
            """
        )

        connection.execute(
            """
            CREATE TRIGGER IF NOT EXISTS local_docs_au AFTER UPDATE ON local_documents BEGIN
                INSERT INTO local_documents_fts(local_documents_fts, rowid, title, content)
                VALUES ('delete', old.id, old.title, old.content);
                INSERT INTO local_documents_fts(rowid, title, content)
                VALUES (new.id, new.title, new.content);
            END
            """
        )

        # Seed sample engineering & student notes if empty
        existing_docs = connection.execute("SELECT COUNT(*) as count FROM local_documents").fetchone()["count"]
        if existing_docs == 0:
            sample_docs = [
                (
                    "FastAPI Architecture & Async Endpoints Cheatsheet",
                    "fastapi_architecture.md",
                    "",
                    "md",
                    "cheatsheets",
                    """# FastAPI Architecture Cheatsheet
FastAPI is a high-performance ASGI web framework built on Starlette and Pydantic.
Key highlights:
- Native asynchronous request handling via `async def` and event loop concurrency.
- Built-in data validation and serialization using Pydantic BaseModel schemas.
- Interactive API documentation auto-generated at `/docs` (Swagger UI) and `/redoc`.
- Dependency Injection system with `Depends()` for database sessions, auth, and config.
- High-concurrency client calls using HTTPX `AsyncClient`.""",
                    1024,
                ),
                (
                    "ECE Signals & Systems: Fourier and Laplace Transforms",
                    "signals_and_systems.md",
                    "",
                    "md",
                    "notes",
                    """# Signals and Systems Quick Reference
Electronics and Computer Engineering Core Concepts:
- Continuous-Time Fourier Transform (CTFT): Transforms a continuous time-domain signal x(t) into continuous frequency domain X(jω).
- Discrete Fourier Transform (DFT): Efficiently computed using FFT algorithms (O(N log N)).
- Laplace Transform: Extends Fourier analysis to unstable and transient systems via complex s-plane.
- Region of Convergence (ROC): If the ROC includes the jω axis, the LTI system is bounded-input bounded-output (BIBO) stable.
- Convolution: y(t) = x(t) * h(t), where h(t) is the system impulse response.""",
                    1450,
                ),
                (
                    "Docker & Containerization for Embedded & Backend Systems",
                    "docker_guide.md",
                    "",
                    "md",
                    "notes",
                    """# Docker Containerization Guide
Containerization essentials for backend engineers and embedded Linux developers:
- Dockerfile instructions: FROM, RUN, COPY, WORKDIR, EXPOSE, and CMD.
- Multi-stage builds: Dramatically reduce final production image size by separating build tools from the runtime container.
- Networking & Port Forwarding: `-p 8000:8000` maps host port 8000 to the container port.
- Volumes: `-v /host/path:/container/path` persists container data across restarts.
- SearXNG Docker integration: Runs SearXNG official image with isolated redis and settings volume.""",
                    1180,
                ),
                (
                    "Digital Electronics & CMOS Logic Design Summary",
                    "digital_electronics.md",
                    "",
                    "md",
                    "notes",
                    """# Digital Logic Design & CMOS Notes
- CMOS Logic: Uses complementary pairs of pMOS (pull-up network) and nMOS (pull-down network) transistors.
- Combinational Circuits: Optimized using Karnaugh Maps (K-maps), Boolean algebra, and Quine-McCluskey minimization.
- Sequential Circuits: Memory elements including edge-triggered D flip-flops, JK flip-flops, and shift registers.
- Timing Parameters: Setup time (t_setup), hold time (t_hold), and propagation delay (t_pd).
- Metastability: Occurs when setup/hold times are violated during asynchronous signal capture.""",
                    1290,
                ),
            ]
            for doc in sample_docs:
                cursor = connection.execute(
                    """
                    INSERT INTO local_documents (title, filename, file_path, file_type, category, content, file_size)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    doc,
                )
                new_id = cursor.lastrowid
                connection.execute(
                    """
                    INSERT INTO local_documents_fts (rowid, title, content)
                    VALUES (?, ?, ?)
                    """,
                    (new_id, doc[0], doc[5]),
                )

        # ── QUICK BANGS TABLE & SEEDS ──
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS custom_bangs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prefix TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                url_template TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'general',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        existing_bangs = connection.execute("SELECT COUNT(*) as count FROM custom_bangs").fetchone()["count"]
        if existing_bangs == 0:
            default_bangs = [
                ("!gh", "GitHub", "https://github.com/search?q={q}", "developer"),
                ("!yt", "YouTube", "https://www.youtube.com/results?search_query={q}", "media"),
                ("!w", "Wikipedia", "https://en.wikipedia.org/wiki/Special:Search?search={q}", "reference"),
                ("!arxiv", "arXiv Papers", "https://arxiv.org/search/?query={q}&searchtype=all", "academic"),
                ("!so", "Stack Overflow", "https://stackoverflow.com/search?q={q}", "developer"),
                ("!r", "Reddit", "https://www.reddit.com/search/?q={q}", "community"),
                ("!g", "Google", "https://www.google.com/search?q={q}", "general"),
                ("!maps", "Google Maps", "https://www.google.com/maps/search/{q}", "tools"),
                ("!ddg", "DuckDuckGo", "https://duckduckgo.com/?q={q}", "general"),
                ("!mdn", "MDN Web Docs", "https://developer.mozilla.org/en-US/search?q={q}", "developer"),
                ("!pypi", "PyPI Python", "https://pypi.org/search/?q={q}", "developer"),
                ("!v", "Knowledge Vault", "#local", "personal"),
                ("!ece", "ECE Tools", "#ece", "tools"),
            ]
            connection.executemany(
                """
                INSERT OR IGNORE INTO custom_bangs (prefix, name, url_template, category)
                VALUES (?, ?, ?, ?)
                """,
                default_bangs,
            )

        connection.commit()


# ─── SEARCH HISTORY ──────────────────────────────────────────────────────────

def add_search_history(query: str, category: str) -> int:
    """Save a search and return its database ID."""
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO search_history (query, category)
            VALUES (?, ?)
            """,
            (query, category),
        )
        connection.commit()
        return int(cursor.lastrowid)


def get_search_history(limit: int = 20) -> list[dict[str, Any]]:
    """Return the most recent searches, newest first."""
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, query, category, created_at
            FROM search_history
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    return [dict(row) for row in rows]


def delete_search_history(history_id: int) -> bool:
    """Delete one history entry."""
    with get_connection() as connection:
        cursor = connection.execute(
            """
            DELETE FROM search_history
            WHERE id = ?
            """,
            (history_id,),
        )
        connection.commit()
        return cursor.rowcount > 0


# ─── BOOKMARKS & SAVED KNOWLEDGE ─────────────────────────────────────────────

def add_bookmark(title: str, url: str, snippet: str = "", category: str = "general", tags: str = "") -> int:
    """Save or update a bookmarked result and return its database ID."""
    clean_url = url.strip()
    clean_title = title.strip() or clean_url

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO bookmarks (title, url, snippet, category, tags)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(url) DO UPDATE SET
                title = excluded.title,
                snippet = excluded.snippet,
                category = excluded.category,
                tags = excluded.tags
            """,
            (clean_title, clean_url, snippet.strip(), category, tags.strip()),
        )
        connection.commit()
        return int(cursor.lastrowid)


def get_bookmarks(limit: int = 100, tag: str | None = None) -> list[dict[str, Any]]:
    """Return stored bookmarks ordered by newest first, optionally filtered by tag."""
    with get_connection() as connection:
        if tag and tag.strip():
            rows = connection.execute(
                """
                SELECT id, title, url, snippet, category, tags, created_at
                FROM bookmarks
                WHERE tags LIKE ?
                ORDER BY id DESC
                LIMIT ?
                """,
                (f"%{tag.strip()}%", limit),
            ).fetchall()
        else:
            rows = connection.execute(
                """
                SELECT id, title, url, snippet, category, tags, created_at
                FROM bookmarks
                ORDER BY id DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

    return [dict(row) for row in rows]


def get_all_bookmark_urls() -> list[str]:
    """Return a flat list of all bookmarked URLs for quick UI lookup."""
    with get_connection() as connection:
        rows = connection.execute("SELECT url FROM bookmarks").fetchall()
    return [row["url"] for row in rows]


def delete_bookmark(bookmark_id: int) -> bool:
    """Delete one bookmark by database ID."""
    with get_connection() as connection:
        cursor = connection.execute(
            """
            DELETE FROM bookmarks
            WHERE id = ?
            """,
            (bookmark_id,),
        )
        connection.commit()
        return cursor.rowcount > 0


def delete_bookmark_by_url(url: str) -> bool:
    """Delete a bookmark by URL (used when un-starring a search result)."""
    with get_connection() as connection:
        cursor = connection.execute(
            """
            DELETE FROM bookmarks
            WHERE url = ?
            """,
            (url.strip(),),
        )
        connection.commit()
        return cursor.rowcount > 0


# ─── DOMAIN BOOST & SPAM BLOCK RULES ─────────────────────────────────────────

def get_domain_rules() -> list[dict[str, Any]]:
    """Return all configured domain boost and block rules."""
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, domain, rule_type, weight, notes, created_at
            FROM domain_rules
            ORDER BY rule_type ASC, weight DESC, domain ASC
            """
        ).fetchall()
    return [dict(row) for row in rows]


def add_domain_rule(domain: str, rule_type: str, weight: float = 2.0, notes: str = "") -> int:
    """Add or update a domain rule ('boost' or 'block')."""
    clean_domain = domain.lower().strip().replace("http://", "").replace("https://", "").split("/")[0].replace("www.", "")
    if not clean_domain:
        raise ValueError("Invalid domain format")

    valid_type = "block" if rule_type.lower() == "block" else "boost"
    final_weight = 0.0 if valid_type == "block" else max(1.1, float(weight))

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO domain_rules (domain, rule_type, weight, notes)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(domain) DO UPDATE SET
                rule_type = excluded.rule_type,
                weight = excluded.weight,
                notes = excluded.notes
            """,
            (clean_domain, valid_type, final_weight, notes.strip()),
        )
        connection.commit()
        return int(cursor.lastrowid)


def delete_domain_rule(rule_id: int) -> bool:
    """Delete a domain rule by ID."""
    with get_connection() as connection:
        cursor = connection.execute(
            """
            DELETE FROM domain_rules
            WHERE id = ?
            """,
            (rule_id,),
        )
        connection.commit()
        return cursor.rowcount > 0


def delete_domain_rule_by_name(domain: str) -> bool:
    """Delete a domain rule by domain name."""
    clean_domain = domain.lower().strip().replace("www.", "")
    with get_connection() as connection:
        cursor = connection.execute(
            """
            DELETE FROM domain_rules
            WHERE domain = ?
            """,
            (clean_domain,),
        )
        connection.commit()
        return cursor.rowcount > 0


def get_domain_rule_maps() -> tuple[dict[str, float], set[str]]:
    """Return ({boosted_domain: weight}, {blocked_domains}) for fast in-memory reranking."""
    with get_connection() as connection:
        rows = connection.execute("SELECT domain, rule_type, weight FROM domain_rules").fetchall()

    boost_map: dict[str, float] = {}
    block_set: set[str] = set()

    for row in rows:
        d = row["domain"].lower()
        if row["rule_type"] == "block":
            block_set.add(d)
        elif row["rule_type"] == "boost":
            boost_map[d] = float(row["weight"])

    return boost_map, block_set


# ─── LOCAL DOCUMENTS & FTS5 FULL-TEXT SEARCH ─────────────────────────────────

def sanitize_fts_query(query: str) -> str:
    """Sanitize user search query for safe SQLite FTS5 prefix matching."""
    tokens = re.findall(r"[\w-]+", query)
    if not tokens:
        return ""
    return " ".join([f'"{tok}"*' for tok in tokens])


def add_local_document(
    title: str,
    filename: str,
    file_type: str,
    content: str,
    category: str = "notes",
    file_path: str = "",
    file_size: int = 0,
) -> int:
    """Add a new local document or note to SQLite (auto-indexed into FTS5 via trigger)."""
    clean_title = title.strip() or filename.strip() or "Untitled Document"
    clean_type = file_type.lower().strip().replace(".", "")
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO local_documents (title, filename, file_path, file_type, category, content, file_size)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                clean_title,
                filename.strip(),
                file_path.strip(),
                clean_type,
                category.strip().lower() or "notes",
                content.strip(),
                file_size,
            ),
        )
        connection.commit()
        return int(cursor.lastrowid)


def get_local_documents(limit: int = 50, category: str | None = None) -> list[dict[str, Any]]:
    """Return recent local documents."""
    query = """
        SELECT id, title, filename, file_path, file_type, category, file_size, created_at,
               substr(content, 1, 240) as preview
        FROM local_documents
    """
    params: list[Any] = []
    if category:
        query += " WHERE category = ?"
        params.append(category.strip().lower())

    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    with get_connection() as connection:
        rows = connection.execute(query, params).fetchall()

    return [dict(row) for row in rows]


def get_local_document_by_id(doc_id: int) -> dict[str, Any] | None:
    """Fetch complete local document content by ID."""
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT id, title, filename, file_path, file_type, category, content, file_size, created_at
            FROM local_documents
            WHERE id = ?
            """,
            (doc_id,),
        ).fetchone()

    return dict(row) if row else None


def delete_local_document(doc_id: int) -> bool:
    """Delete a local document by ID (FTS5 trigger automatically cleans up index)."""
    with get_connection() as connection:
        cursor = connection.execute(
            """
            DELETE FROM local_documents
            WHERE id = ?
            """,
            (doc_id,),
        )
        connection.commit()
        return cursor.rowcount > 0


def search_local_documents(query: str, limit: int = 10) -> list[dict[str, Any]]:
    """
    Full-text search across local notes and PDFs using SQLite FTS5.
    Returns BM25 ranked matches with contextual snippet highlighting.
    """
    fts_query = sanitize_fts_query(query)
    if not fts_query:
        return []

    sql = """
        SELECT 
            d.id,
            d.title,
            d.filename,
            d.file_type,
            d.category,
            d.file_size,
            d.created_at,
            snippet(local_documents_fts, 1, '<mark class="fts-highlight">', '</mark>', '...', 28) AS snippet,
            bm25(local_documents_fts) AS rank
        FROM local_documents_fts
        JOIN local_documents d ON d.id = local_documents_fts.rowid
        WHERE local_documents_fts MATCH ?
        ORDER BY rank
        LIMIT ?
    """

    with get_connection() as connection:
        try:
            rows = connection.execute(sql, (fts_query, limit)).fetchall()
        except sqlite3.OperationalError:
            # Fallback if FTS syntax error
            return []

    return [dict(row) for row in rows]


# ─── QUICK BANGS MANAGEMENT ──────────────────────────────────────────────────

def get_all_bangs() -> list[dict[str, Any]]:
    """Return all available search bangs sorted by prefix."""
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT id, prefix, name, url_template, category, created_at FROM custom_bangs ORDER BY prefix ASC"
        ).fetchall()
    return [dict(row) for row in rows]


def add_custom_bang(prefix: str, name: str, url_template: str, category: str = "custom") -> int:
    """Add or update a custom bang shortcut."""
    clean_prefix = prefix.strip().lower()
    if not clean_prefix.startswith("!"):
        clean_prefix = "!" + clean_prefix

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO custom_bangs (prefix, name, url_template, category)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(prefix) DO UPDATE SET
                name = excluded.name,
                url_template = excluded.url_template,
                category = excluded.category
            """,
            (clean_prefix, name.strip(), url_template.strip(), category.strip().lower()),
        )
        connection.commit()
        return int(cursor.lastrowid)


def delete_custom_bang(bang_id: int) -> bool:
    """Delete a custom bang by ID."""
    with get_connection() as connection:
        cursor = connection.execute("DELETE FROM custom_bangs WHERE id = ?", (bang_id,))
        connection.commit()
        return cursor.rowcount > 0


# ─── DATA PORTABILITY (EXPORT & IMPORT JSON) ─────────────────────────────────

def export_all_user_data() -> dict[str, Any]:
    """Export all search history, bookmarks, domain rules, bangs, and notes as portable JSON."""
    with get_connection() as connection:
        history = [dict(r) for r in connection.execute("SELECT id, query, category, created_at FROM search_history ORDER BY id DESC").fetchall()]
        bookmarks = [dict(r) for r in connection.execute("SELECT id, title, url, snippet, category, tags, created_at FROM bookmarks ORDER BY id DESC").fetchall()]
        rules = [dict(r) for r in connection.execute("SELECT id, domain, rule_type, weight, notes, created_at FROM domain_rules ORDER BY id DESC").fetchall()]
        bangs = [dict(r) for r in connection.execute("SELECT id, prefix, name, url_template, category, created_at FROM custom_bangs ORDER BY id ASC").fetchall()]
        docs = [dict(r) for r in connection.execute("SELECT id, title, filename, file_type, category, content, file_size, created_at FROM local_documents ORDER BY id DESC").fetchall()]

    return {
        "version": "1.4.0",
        "exported_from": "MySearch Personal Search Platform",
        "timestamp": datetime.now().isoformat(),
        "counts": {
            "history": len(history),
            "bookmarks": len(bookmarks),
            "rules": len(rules),
            "bangs": len(bangs),
            "documents": len(docs),
        },
        "data": {
            "search_history": history,
            "bookmarks": bookmarks,
            "domain_rules": rules,
            "custom_bangs": bangs,
            "local_documents": docs,
        },
    }


def import_user_data(payload: dict[str, Any]) -> dict[str, int]:
    """Import and merge user data from a portable JSON backup."""
    imported_counts = {"history": 0, "bookmarks": 0, "rules": 0, "bangs": 0, "documents": 0}
    data = payload.get("data", payload)

    with get_connection() as connection:
        # 1. Bookmarks
        for b in data.get("bookmarks", []):
            if "url" in b and "title" in b:
                res = connection.execute(
                    """
                    INSERT OR IGNORE INTO bookmarks (title, url, snippet, category, tags)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (b["title"], b["url"], b.get("snippet", ""), b.get("category", "general"), b.get("tags", "")),
                )
                if res.rowcount > 0:
                    imported_counts["bookmarks"] += 1

        # 2. Domain Rules
        for r in data.get("domain_rules", []):
            if "domain" in r and "rule_type" in r:
                res = connection.execute(
                    """
                    INSERT OR IGNORE INTO domain_rules (domain, rule_type, weight, notes)
                    VALUES (?, ?, ?, ?)
                    """,
                    (r["domain"], r["rule_type"], float(r.get("weight", 2.0)), r.get("notes", "")),
                )
                if res.rowcount > 0:
                    imported_counts["rules"] += 1

        # 3. Custom Bangs
        for bg in data.get("custom_bangs", []):
            if "prefix" in bg and "url_template" in bg:
                res = connection.execute(
                    """
                    INSERT OR IGNORE INTO custom_bangs (prefix, name, url_template, category)
                    VALUES (?, ?, ?, ?)
                    """,
                    (bg["prefix"], bg.get("name", bg["prefix"]), bg["url_template"], bg.get("category", "custom")),
                )
                if res.rowcount > 0:
                    imported_counts["bangs"] += 1

        # 4. Local Documents
        for d in data.get("local_documents", []):
            if "title" in d and "content" in d:
                cursor = connection.execute(
                    """
                    INSERT INTO local_documents (title, filename, file_type, category, content, file_size)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        d["title"],
                        d.get("filename", "note.md"),
                        d.get("file_type", "note"),
                        d.get("category", "notes"),
                        d["content"],
                        len(d["content"].encode("utf-8")),
                    ),
                )
                new_id = cursor.lastrowid
                connection.execute(
                    "INSERT INTO local_documents_fts (rowid, title, content) VALUES (?, ?, ?)",
                    (new_id, d["title"], d["content"]),
                )
                imported_counts["documents"] += 1

        connection.commit()

    return imported_counts
