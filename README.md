# MySearch — Personal Federated Search Platform

**Version 4.0** | Private · No Tracking · Zero Ads · Open Source

A personal, self-hosted search platform built with FastAPI + SQLite + vanilla HTML/CSS/JS. Queries your own SearXNG instance, enriched with personal knowledge vault, ECE engineering calculators, quick bang shortcuts, and data portability.

---

## 🚀 Quick Start

### Option A: Double-click Launcher
Run **`scratch\run_mysearch.bat`** — starts both servers and opens the browser automatically.

### Option B: Manual (PowerShell)
```powershell
# 1. Start the backend API (FastAPI)
& "C:\Users\autid\AppData\Local\Programs\Python\Python313\python.exe" `
  -m uvicorn app.main:app `
  --app-dir "C:\Users\autid\AppData\Local\Temp\mysearch_backend" `
  --host 127.0.0.1 --port 8000

# 2. Start the frontend server (in a separate terminal)
& "C:\Users\autid\AppData\Local\Programs\Python\Python313\python.exe" `
  -m http.server 5500 `
  --directory "path\to\mysearch\frontend"

# 3. Open http://127.0.0.1:5500 in your browser
```

---

## 🌐 Live URLs

| Service | URL |
|---|---|
| **Frontend (UI)** | http://127.0.0.1:5500 |
| **Backend API** | http://127.0.0.1:8000 |
| **API Docs (Swagger)** | http://127.0.0.1:8000/docs |
| **SearXNG Instance** | https://my-searxng-gf7s.onrender.com |

---

## ✨ Features

### 🔍 Federated Search
- Queries your private SearXNG instance on Render — no Google tracking
- Supports: Web, Images, News, Videos, Notes & Docs categories
- Domain Boosting & Spam Filtering: prioritize authoritative sources
- Blended Personal Vault results shown above web results

### ⚡ Quick Bang Shortcuts
Type a bang prefix in the search box to instantly redirect to external sites:

| Bang | Target |
|---|---|
| `!gh <query>` | GitHub Search |
| `!yt <query>` | YouTube Search |
| `!w <query>` | Wikipedia |
| `!arxiv <query>` | ArXiv Papers |
| `!so <query>` | Stack Overflow |
| `!r <query>` | Reddit Search |
| `!g <query>` | Google |
| `!maps <query>` | Google Maps |
| `!mdn <query>` | MDN Web Docs |
| `!pypi <query>` | PyPI Package Search |
| `!v <query>` | Personal Vault |
| `!ddg <query>` | DuckDuckGo |
| `!ece <query>` | ECE Calculator |

**Real-time autocomplete** as you type `!` — arrow keys to navigate, Enter to select.

### 🧮 ECE Engineering Workstation (Click "ECE Tools" in topbar)
Interactive calculators, no SearXNG required:

- **⚡ Ohm's Law & Power** — enter any 2 of V, I, R, P — solves the rest live
- **🎨 Resistor Color Bands** — enter resistance value → see 4-band color visualization
- **〰️ RC Filter** — enter R and C → fc and τ computed instantly
- **🔊 Decibels (dB/dBm)** — voltage/power gain ratios
- **🔢 Base Converter** — Decimal ↔ Hex ↔ Binary ↔ Octal (real-time, 4-way sync)

### 🃏 Instant Answer Cards
Detected automatically from search queries:
- `resistor 4.7k` → color band diagram
- `rc 10k 100n` → cutoff frequency + time constant
- `hex FF` / `0xFF` → base conversions
- `v=12 r=100` → Ohm's law solve
- `30dbm` → power in mW
- `sqrt(144)` / `25 * 4` → math calculator

### 📚 Personal Knowledge Vault (SQLite FTS5)
- Create notes with Markdown content
- Upload PDF / .txt / .md / .py / .c files for full-text indexing
- FTS5 search with highlighted snippets
- Blended vault results shown alongside web results

### ⭐ Saved Bookmarks Library
- Save any search result with one click
- Tag-based filtering
- Persistent SQLite storage

### 🏠 Personal Speed Dials
Homepage quick-access links (GitHub, YouTube, ArXiv, Stack Overflow etc.)
- Add your own with "Add Link" button
- Persisted in `localStorage` — survives page refreshes

### 🔒 Data Portability & Backup
In **Rankings → Personal Data Portability**:
- **Export** → downloads `mysearch_backup_<date>.json` (bookmarks, history, notes, rules, bangs)
- **Restore** → import a previous JSON backup to merge data

---

## 📁 Project Structure

```
mysearch/
├── backend/
│   └── app/
│       ├── main.py          # FastAPI v0.7.0 — all API routes
│       ├── database.py      # SQLite schema, queries, migrations
│       ├── ece_tools.py     # ECE calculators + instant answer engine
│       └── __init__.py
├── frontend/
│   ├── index.html           # HTML v4.0 — full UI with all modals
│   ├── style.css            # Stylesheet v4.0 — Nature-Obsidian palette
│   └── app.js               # JavaScript v4.0 — all client logic
└── requirements.txt
```

---

## 🔄 Syncing Changes to Your Workspace

After edits in the `scratch/` directory, run:
```powershell
# One-click sync of all files
powershell -ExecutionPolicy Bypass -File "scratch\sync_all.ps1"
# OR double-click:
scratch\sync_all.bat
```

---

## 🧩 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health + SearXNG status |
| `GET` | `/api/search?q=...&category=...` | Federated search |
| `GET` | `/api/history` | Search history |
| `DELETE` | `/api/history/{id}` | Delete a history entry |
| `GET` | `/api/bookmarks` | List bookmarks |
| `POST` | `/api/bookmarks` | Save a bookmark |
| `DELETE` | `/api/bookmarks/{id}` | Delete a bookmark |
| `GET` | `/api/preferences/domains` | Domain rules list |
| `POST` | `/api/preferences/domains` | Add a domain rule |
| `DELETE` | `/api/preferences/domains/{id}` | Delete a domain rule |
| `GET` | `/api/local/documents` | List vault documents |
| `POST` | `/api/local/notes` | Create a note |
| `POST` | `/api/local/upload` | Upload PDF/text file |
| `DELETE` | `/api/local/documents/{id}` | Delete vault document |
| `GET` | `/api/local/search?q=...` | Full-text vault search |
| `GET` | `/api/bangs` | List bang shortcuts |
| `POST` | `/api/bangs` | Add custom bang |
| `DELETE` | `/api/bangs/{id}` | Delete custom bang |
| `GET` | `/api/export` | Export all user data as JSON |
| `POST` | `/api/import` | Import/restore from JSON backup |
| `GET` | `/api/tools/ece?q=...` | ECE/Math instant calculator |

---

## 🎨 Design System

**Nature-Obsidian Palette** — earthy forest greens + deep obsidian:

| Token | Light | Dark |
|---|---|---|
| Background | `#f7f9f6` | `#0a110d` |
| Surface | `#ffffff` | `#121d16` |
| Accent | `#1e5631` | `#52b788` |
| Text Primary | `#121c15` | `#f0f6f2` |

Fonts: **Plus Jakarta Sans** (UI) + **JetBrains Mono** (code/badges)

---

## 🛡️ Privacy

- **Zero external tracking** — SearXNG strips all search tracking
- **No cookies** — theme + speed dials stored in `localStorage` only
- **Local SQLite** — all personal data (bookmarks, vault, history) stays on your machine
- **No third-party analytics** — completely self-contained

---

*Built with FastAPI · SQLite FTS5 · Vanilla JS · SearXNG · No frameworks*
