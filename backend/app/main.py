import os

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="MySearch API",
    version="0.1.0",
    description="Personal search engine backend",
)

SEARXNG_URL = os.getenv(
    "SEARXNG_URL",
    "https://my-searxng-gf7s.onrender.com",
).rstrip("/")


# Allow the local frontend to communicate with the API.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "mysearch-api",
    }


@app.get("/api/search")
async def search(
    q: str = Query(..., min_length=1, max_length=200),
    category: str = Query("general"),
):
    """
    Search through the SearXNG backend.
    """

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
        "q": q.strip(),
        "format": "json",
        "categories": allowed_categories[category],
    }

    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(15.0)
        ) as client:
            response = await client.get(
                f"{SEARXNG_URL}/search",
                params=params,
            )

        response.raise_for_status()

        data = response.json()

        return {
            "query": q.strip(),
            "category": category,
            "results": data.get("results", []),
        }

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Search service timed out.",
        )

    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "Search service returned "
                f"HTTP {exc.response.status_code}."
            ),
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Unable to reach the search service.",
        )

    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="Search service returned invalid JSON.",
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unexpected search error.",
        )