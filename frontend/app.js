/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   MYSEARCH â€” FRONTEND APPLICATION SCRIPT
   Version: 3.1 (Federated Search + Knowledge Bookmarks)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

// Register PWA Service Worker for mobile caching & offline resilience
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch((err) => {
            console.debug("Service Worker skipped:", err);
        });
    });
}

// Dynamic API Base Resolver: Auto-detects Localhost, LAN Wi-Fi IP, Cloud Render, or Custom Domain
function resolveApiBase() {
    const saved = localStorage.getItem("mysearch_api_base");
    if (saved && saved.trim()) return saved.trim().replace(/\/$/, "");

    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get("api");
    if (param && param.trim()) {
        const clean = param.trim().replace(/\/$/, "");
        localStorage.setItem("mysearch_api_base", clean);
        return clean;
    }

    const host = window.location.hostname;
    // When accessing from mobile on local Wi-Fi (e.g. 192.168.x.x, 10.x.x.x)
    if (host && host !== "localhost" && host !== "127.0.0.1") {
        if (!host.endsWith(".netlify.app") && !host.endsWith(".pages.dev") && !host.endsWith(".vercel.app")) {
            return `${window.location.protocol}//${host}:8000`;
        }
        // Hosted on Netlify / Cloudflare Pages / Vercel
        return "https://mysearch-api.onrender.com";
    }

    return "http://127.0.0.1:8000";
}

let API_BASE = resolveApiBase();

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   DOM ELEMENTS SELECTORS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const clearButton = document.getElementById("clearButton");
const categories = document.querySelectorAll(".category");

const hero = document.getElementById("hero");
const brandLink = document.getElementById("brandLink");
const searchSection = document.getElementById("searchSection");
const resultsStage = document.getElementById("resultsStage");

const resultsContainer = document.getElementById("results");
const state = document.getElementById("state");
const searchMeta = document.getElementById("searchMeta");
const metaText = document.getElementById("metaText");
const metaCategoryBadge = document.getElementById("metaCategoryBadge");

const historySection = document.getElementById("historySection");
const historyList = document.getElementById("historyList");
const historyCount = document.getElementById("historyCount");
const clearHistoryButton = document.getElementById("clearHistoryButton");

const themeToggle = document.getElementById("themeToggle");
const themeLabelText = document.getElementById("themeLabelText");
const suggestionChips = document.getElementById("suggestionChips");
const toastContainer = document.getElementById("toastContainer");

// Bookmarks DOM elements
const bookmarksToggleBtn = document.getElementById("bookmarksToggleBtn");
const bookmarksCountBadge = document.getElementById("bookmarksCountBadge");
const bookmarksSection = document.getElementById("bookmarksSection");
const bookmarksList = document.getElementById("bookmarksList");
const bookmarksTagFilters = document.getElementById("bookmarksTagFilters");
const backToSearchBtn = document.getElementById("backToSearchBtn");

// Domain Preferences & Ranking Rules DOM elements
const preferencesToggleBtn = document.getElementById("preferencesToggleBtn");
const rulesCountBadge = document.getElementById("rulesCountBadge");
const preferencesModal = document.getElementById("preferencesModal");
const closePreferencesBtn = document.getElementById("closePreferencesBtn");
const addRuleForm = document.getElementById("addRuleForm");
const newRuleDomain = document.getElementById("newRuleDomain");
const newRuleType = document.getElementById("newRuleType");
const newRuleWeight = document.getElementById("newRuleWeight");
const weightGroup = document.getElementById("weightGroup");
const newRuleNotes = document.getElementById("newRuleNotes");
const rulesListContainer = document.getElementById("rulesListContainer");
const allRulesCount = document.getElementById("allRulesCount");
const boostRulesCount = document.getElementById("boostRulesCount");
const blockRulesCount = document.getElementById("blockRulesCount");

// Local Knowledge Vault DOM elements
const vaultToggleBtn = document.getElementById("vaultToggleBtn");
const vaultCountBadge = document.getElementById("vaultCountBadge");
const vaultSection = document.getElementById("vaultSection");
const vaultList = document.getElementById("vaultList");
const vaultAllFilterCount = document.getElementById("vaultAllFilterCount");
const openNoteModalBtn = document.getElementById("openNoteModalBtn");
const uploadFileTriggerBtn = document.getElementById("uploadFileTriggerBtn");
const vaultFileInput = document.getElementById("vaultFileInput");
const backToSearchFromVaultBtn = document.getElementById("backToSearchFromVaultBtn");
const vaultCategoryFilters = document.getElementById("vaultCategoryFilters");

const vaultBlendedCard = document.getElementById("vaultBlendedCard");
const vaultMatchesCountBadge = document.getElementById("vaultMatchesCountBadge");
const vaultBlendedItems = document.getElementById("vaultBlendedItems");

// Note Creation Modal DOM elements
const noteModal = document.getElementById("noteModal");
const closeNoteModalBtn = document.getElementById("closeNoteModalBtn");
const cancelNoteBtn = document.getElementById("cancelNoteBtn");
const createNoteForm = document.getElementById("createNoteForm");
const noteTitleInput = document.getElementById("noteTitleInput");
const noteCategorySelect = document.getElementById("noteCategorySelect");
const noteContentInput = document.getElementById("noteContentInput");

// Document Viewer Modal DOM elements
const docViewerModal = document.getElementById("docViewerModal");
const closeDocViewerBtn = document.getElementById("closeDocViewerBtn");
const docViewerTitle = document.getElementById("docViewerTitle");
const docViewerMeta = document.getElementById("docViewerMeta");
const docViewerContent = document.getElementById("docViewerContent");
const docViewerCopyBtn = document.getElementById("docViewerCopyBtn");

// â”€â”€ ECE Tools & Engineering Workstation Selectors â”€â”€
const eceToggleBtn = document.getElementById("eceToggleBtn");
const eceModal = document.getElementById("eceModal");
const closeEceModalBtn = document.getElementById("closeEceModalBtn");
const eceTabBar = document.getElementById("eceTabBar");
const eceToolStage = document.getElementById("eceToolStage");

// â”€â”€ Quick Bangs Selectors â”€â”€
const bangsToggleBtn = document.getElementById("bangsToggleBtn");
const bangsModal = document.getElementById("bangsModal");
const closeBangsModalBtn = document.getElementById("closeBangsModalBtn");
const addBangForm = document.getElementById("addBangForm");
const newBangPrefix = document.getElementById("newBangPrefix");
const newBangName = document.getElementById("newBangName");
const newBangUrl = document.getElementById("newBangUrl");
const bangsSearchFilter = document.getElementById("bangsSearchFilter");
const bangsListContainer = document.getElementById("bangsListContainer");
const bangsDropdown = document.getElementById("bangsDropdown");

// â”€â”€ Personal Speed Dials Selectors â”€â”€
const speedDialsBar = document.getElementById("speedDialsBar");
const speedDialsRow = document.getElementById("speedDialsRow");
const speedDialModal = document.getElementById("speedDialModal");
const closeSpeedDialModalBtn = document.getElementById("closeSpeedDialModalBtn");
const cancelSpeedDialBtn = document.getElementById("cancelSpeedDialBtn");
const speedDialForm = document.getElementById("speedDialForm");
const speedDialTitleInput = document.getElementById("speedDialTitleInput");
const speedDialUrlInput = document.getElementById("speedDialUrlInput");

// â”€â”€ Instant Answer & Backup Selectors â”€â”€
const instantAnswerCard = document.getElementById("instantAnswerCard");
const exportDataBtn = document.getElementById("exportDataBtn");
const importDataTriggerBtn = document.getElementById("importDataTriggerBtn");
const importFileInput = document.getElementById("importFileInput");
const apiEndpointInput = document.getElementById("apiEndpointInput");
const saveApiEndpointBtn = document.getElementById("saveApiEndpointBtn");
const autoDetectApiBtn = document.getElementById("autoDetectApiBtn");
const apiStatusMessage = document.getElementById("apiStatusMessage");
const aiAnswerCard = document.getElementById("aiAnswerCard");
const aiAnswerText = document.getElementById("aiAnswerText");
const aiSourcesCount = document.getElementById("aiSourcesCount");
const aiSourcesPills = document.getElementById("aiSourcesPills");
const aiCopyBtn = document.getElementById("aiCopyBtn");

let cachedBangs = [];
let activeEceTab = "ohm";
let selectedBangDropdownIndex = -1;

let activeCategory = "general";
let lastSearchQuery = "";
let isBookmarksViewActive = false;
let isVaultViewActive = false;
let bookmarkedUrls = new Set();
let activeBookmarkTag = "";
let cachedDomainRules = [];
let activeRulesFilter = "all";
let cachedVaultDocs = [];
let activeVaultCategoryFilter = "";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   THEME MANAGER (LIGHT / DARK) â€” BULLETPROOF IMPLEMENTATION
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function applyTheme(theme) {
    const isDark = theme === "dark";

    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.className = isDark ? "dark" : "light";

    if (document.body) {
        document.body.className = isDark ? "dark-theme" : "light-theme";
    }

    if (themeLabelText) {
        themeLabelText.textContent = isDark ? "Light" : "Dark";
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        metaTheme.setAttribute("content", isDark ? "#0a110d" : "#1b4332");
    }

    try {
        localStorage.setItem("mysearch_theme", theme);
    } catch {
        // storage disabled
    }
}

function initTheme() {
    let saved = null;
    try {
        saved = localStorage.getItem("mysearch_theme");
    } catch {
        // ignore
    }

    if (saved === "dark" || saved === "light") {
        applyTheme(saved);
        return;
    }

    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(systemDark ? "dark" : "light");
}

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "light";
        const target = current === "dark" ? "light" : "dark";

        applyTheme(target);
        showToast(target === "dark" ? "Dark mode active" : "Light mode active");
    });
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   TOAST NOTIFICATION COMPONENT
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function showToast(message) {
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = "toast-pill";
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        toast.style.transition = "all 0.22s ease";
        setTimeout(() => toast.remove(), 220);
    }, 2200);
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   UTILITY & STRING SANITIZERS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}

function sanitizeUrl(rawUrl) {
    try {
        const parsed = new URL(rawUrl || "");
        if (parsed.protocol === "https:" || parsed.protocol === "http:") {
            return parsed.href;
        }
    } catch {
        // invalid
    }
    return "#";
}

function getHostname(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return "";
    }
}

function categoryLabel(cat) {
    const labels = {
        general: "Web",
        images: "Images",
        news: "News",
        videos: "Videos",
        local: "Vault / Docs",
    };
    return labels[cat] || "Web";
}

function cleanEngineName(name) {
    const cleaned = String(name || "Web")
        .replace(/\.(videos|news|images)$/i, "")
        .replace(/_/g, " ");

    return cleaned
        .split(" ")
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   STATE HANDLERS & SKELETON LOADERS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function hideState() {
    state.classList.add("hidden");
}

function setState(type, title, message, showRetry = false) {
    state.className = `state-card ${type || ""}`;

    const iconSvg = type === "error"
        ? `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <circle cx="12" cy="12" r="10"></circle>
             <line x1="12" y1="8" x2="12" y2="12"></line>
             <line x1="12" y1="16" x2="12.01" y2="16"></line>
           </svg>`
        : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <circle cx="11" cy="11" r="8"></circle>
             <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
           </svg>`;

    let retryHtml = "";
    if (showRetry && lastSearchQuery) {
        retryHtml = `
            <button type="button" class="state-retry-btn" id="retryButton">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
                <span>Try Again</span>
            </button>`;
    }

    state.innerHTML = `
        <div class="state-icon-circle">${iconSvg}</div>
        <h2 class="state-title">${escapeHtml(title)}</h2>
        <p class="state-desc">${escapeHtml(message)}</p>
        ${retryHtml}
    `;

    state.classList.remove("hidden");

    const retryEl = document.getElementById("retryButton");
    if (retryEl) {
        retryEl.addEventListener("click", () => performSearch(lastSearchQuery));
    }
}

function showSkeletonLoading() {
    hideState();
    resultsContainer.innerHTML = "";
    resultsContainer.className = "results-container";

    const stack = document.createElement("div");
    stack.className = "skeleton-stack";

    for (let i = 0; i < 3; i++) {
        const box = document.createElement("div");
        box.className = "skeleton-box";
        box.innerHTML = `
            <div class="shimmer-bar shimmer-meta"></div>
            <div class="shimmer-bar shimmer-head"></div>
            <div class="shimmer-bar shimmer-body"></div>
            <div class="shimmer-bar shimmer-body-short"></div>
        `;
        stack.appendChild(box);
    }

    resultsContainer.appendChild(stack);
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   BOOKMARKS SYSTEM (CLIENT CACHE & TOGGLE)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

async function refreshBookmarksData() {
    try {
        const res = await fetch(`${API_BASE}/api/bookmarks/urls`);
        if (!res.ok) return;

        const data = await res.json();
        bookmarkedUrls = new Set(Array.isArray(data.urls) ? data.urls : []);

        if (bookmarksCountBadge) {
            bookmarksCountBadge.textContent = bookmarkedUrls.size;
        }
    } catch (err) {
        console.error("Could not fetch bookmark URLs:", err);
    }
}

async function toggleBookmark(result, buttonEl) {
    const rawUrl = result.url || "";
    if (!rawUrl) return;

    const isCurrentlySaved = bookmarkedUrls.has(rawUrl);

    if (isCurrentlySaved) {
        // Un-bookmark
        buttonEl.disabled = true;
        try {
            const res = await fetch(`${API_BASE}/api/bookmarks/by-url?url=${encodeURIComponent(rawUrl)}`, {
                method: "DELETE"
            });
            if (res.ok) {
                bookmarkedUrls.delete(rawUrl);
                buttonEl.classList.remove("saved");
                buttonEl.querySelector("span").textContent = "Save";
                showToast("Removed from bookmarks");
                if (bookmarksCountBadge) bookmarksCountBadge.textContent = bookmarkedUrls.size;
            }
        } catch {
            showToast("Failed to remove bookmark");
        } finally {
            buttonEl.disabled = false;
        }
    } else {
        // Save bookmark
        buttonEl.disabled = true;
        try {
            const body = {
                title: result.title || getHostname(rawUrl) || "Bookmark",
                url: rawUrl,
                snippet: result.content || "",
                category: activeCategory || "general",
                tags: activeCategory !== "general" ? activeCategory : ""
            };

            const res = await fetch(`${API_BASE}/api/bookmarks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                bookmarkedUrls.add(rawUrl);
                buttonEl.classList.add("saved");
                buttonEl.querySelector("span").textContent = "Saved";
                showToast("Saved to Bookmarks Library");
                if (bookmarksCountBadge) bookmarksCountBadge.textContent = bookmarkedUrls.size;
            }
        } catch {
            showToast("Failed to save bookmark");
        } finally {
            buttonEl.disabled = false;
        }
    }
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   BOOKMARKS & KNOWLEDGE VAULT VIEWS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function switchToBookmarksView() {
    isBookmarksViewActive = true;
    isVaultViewActive = false;

    hero.classList.add("hidden");
    searchSection.classList.add("hidden");
    historySection.classList.add("hidden");
    resultsStage.classList.add("hidden");

    if (vaultSection) vaultSection.classList.add("hidden");
    if (vaultToggleBtn) vaultToggleBtn.classList.remove("active");

    bookmarksSection.classList.remove("hidden");
    bookmarksToggleBtn.classList.add("active");

    loadBookmarksView(activeBookmarkTag);
}

function switchToVaultView() {
    isVaultViewActive = true;
    isBookmarksViewActive = false;

    hero.classList.add("hidden");
    searchSection.classList.add("hidden");
    historySection.classList.add("hidden");
    resultsStage.classList.add("hidden");

    if (bookmarksSection) bookmarksSection.classList.add("hidden");
    if (bookmarksToggleBtn) bookmarksToggleBtn.classList.remove("active");

    if (vaultSection) vaultSection.classList.remove("hidden");
    if (vaultToggleBtn) vaultToggleBtn.classList.add("active");

    loadVaultDocuments();
}

function switchToSearchView() {
    isBookmarksViewActive = false;
    isVaultViewActive = false;

    if (bookmarksSection) bookmarksSection.classList.add("hidden");
    if (bookmarksToggleBtn) bookmarksToggleBtn.classList.remove("active");
    if (vaultSection) vaultSection.classList.add("hidden");
    if (vaultToggleBtn) vaultToggleBtn.classList.remove("active");

    searchSection.classList.remove("hidden");
    resultsStage.classList.remove("hidden");

    if (!lastSearchQuery) {
        hero.classList.remove("hidden");
        hero.classList.remove("compact");
    } else {
        hero.classList.add("compact");
    }

    loadHistory();
}

if (vaultToggleBtn) {
    vaultToggleBtn.addEventListener("click", () => {
        if (isVaultViewActive) {
            switchToSearchView();
        } else {
            switchToVaultView();
        }
    });
}

if (backToSearchFromVaultBtn) {
    backToSearchFromVaultBtn.addEventListener("click", switchToSearchView);
}

if (bookmarksToggleBtn) {
    bookmarksToggleBtn.addEventListener("click", () => {
        if (isBookmarksViewActive) {
            switchToSearchView();
        } else {
            switchToBookmarksView();
        }
    });
}

if (backToSearchBtn) {
    backToSearchBtn.addEventListener("click", switchToSearchView);
}

async function loadBookmarksView(tagFilter = "") {
    if (!bookmarksList) return;

    bookmarksList.innerHTML = `
        <div class="state-card">
            <div class="shimmer-bar" style="width: 200px; height: 16px; margin: 0 auto 12px;"></div>
            <p class="state-desc">Loading your saved knowledge...</p>
        </div>`;

    try {
        const url = tagFilter ? `${API_BASE}/api/bookmarks?tag=${encodeURIComponent(tagFilter)}` : `${API_BASE}/api/bookmarks`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load bookmarks");

        const data = await res.json();
        const items = Array.isArray(data.bookmarks) ? data.bookmarks : [];

        renderBookmarksList(items, tagFilter);
    } catch (err) {
        bookmarksList.innerHTML = `
            <div class="state-card error">
                <h2 class="state-title">Could not load bookmarks</h2>
                <p class="state-desc">${escapeHtml(err.message)}</p>
            </div>`;
    }
}

function renderBookmarksList(bookmarks, currentTag) {
    if (!bookmarksList) return;

    // 1. Render Dynamic Tag Filter Bar
    if (bookmarksTagFilters) {
        const allTags = new Set();
        bookmarks.forEach(b => {
            if (b.tags) {
                b.tags.split(",").map(t => t.trim()).filter(Boolean).forEach(t => allTags.add(t));
            }
        });

        let tagsHtml = `<button type="button" class="tag-filter-chip ${!currentTag ? "active" : ""}" data-tag="">All (${bookmarks.length})</button>`;
        allTags.forEach(tag => {
            tagsHtml += `<button type="button" class="tag-filter-chip ${currentTag === tag ? "active" : ""}" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`;
        });
        bookmarksTagFilters.innerHTML = tagsHtml;

        bookmarksTagFilters.querySelectorAll(".tag-filter-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                activeBookmarkTag = chip.dataset.tag || "";
                loadBookmarksView(activeBookmarkTag);
            });
        });
    }

    // 2. Empty state
    if (bookmarks.length === 0) {
        bookmarksList.innerHTML = `
            <div class="state-card">
                <div class="bookmarks-badge-icon" style="margin-bottom: 14px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                </div>
                <h2 class="state-title">Your library is empty</h2>
                <p class="state-desc">Click the star button on any search result to save research findings, articles, and documentation here.</p>
                <button type="button" class="state-retry-btn" style="margin-top: 18px;" onclick="switchToSearchView()">
                    <span>Start Searching</span>
                </button>
            </div>`;
        return;
    }

    // 3. Render Cards
    bookmarksList.innerHTML = "";
    const fragment = document.createDocumentFragment();

    bookmarks.forEach(b => {
        const card = document.createElement("article");
        card.className = "bookmark-card";
        const domain = getHostname(b.url);
        const safeUrl = sanitizeUrl(b.url);

        const tagsHtml = b.tags
            ? b.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => `<span class="bookmark-tag-pill">#${escapeHtml(t)}</span>`).join(" ")
            : `<span class="bookmark-tag-pill">${escapeHtml(b.category || "web")}</span>`;

        card.innerHTML = `
            <div class="bookmark-card-top">
                <div class="source-breadcrumb">
                    <div class="favicon-frame">
                        <img class="favicon-img" src="${domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32` : ""}" alt="" onerror="this.remove()">
                    </div>
                    <span class="domain-label">${escapeHtml(domain)}</span>
                    ${tagsHtml}
                </div>
                <div class="bookmark-actions-group">
                    <button type="button" class="bookmark-del-btn" title="Remove from bookmarks" data-id="${b.id}" data-url="${escapeHtml(b.url)}">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        <span>Remove</span>
                    </button>
                </div>
            </div>
            <h3 class="card-title" style="font-size: 18px;">
                <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">
                    ${escapeHtml(b.title || "Untitled Bookmark")}
                    <svg class="external-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>
            </h3>
            <p class="card-snippet" style="font-size: 13.5px;">${escapeHtml(b.snippet || "No description provided.")}</p>
        `;

        const delBtn = card.querySelector(".bookmark-del-btn");
        delBtn.addEventListener("click", async () => {
            delBtn.disabled = true;
            try {
                const res = await fetch(`${API_BASE}/api/bookmarks/${b.id}`, { method: "DELETE" });
                if (res.ok) {
                    bookmarkedUrls.delete(b.url);
                    if (bookmarksCountBadge) bookmarksCountBadge.textContent = bookmarkedUrls.size;
                    card.style.opacity = "0";
                    card.style.transform = "scale(0.97)";
                    card.style.transition = "all 0.2s ease";
                    setTimeout(() => card.remove(), 200);
                    showToast("Bookmark removed");
                }
            } catch {
                showToast("Could not delete bookmark");
            } finally {
                delBtn.disabled = false;
            }
        });

        fragment.appendChild(card);
    });

    bookmarksList.appendChild(fragment);
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   RESULT CARDS CREATION (WITH STAR BOOKMARK ACTION)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function createResultCard(result) {
    const safeUrl = sanitizeUrl(result.url);
    const domain = getHostname(result.url);
    const engine = cleanEngineName(result.engine);
    const thumbnail = result.thumbnail || result.img_src || result.iframe_src || "";
    const isSaved = bookmarkedUrls.has(result.url);

    // 0. LOCAL KNOWLEDGE VAULT DOCUMENT (SQLITE FTS5)
    if (result.is_local) {
        const card = document.createElement("article");
        card.className = "result-card";
        card.style.borderLeft = "3.5px solid #3b82f6";

        const body = document.createElement("div");
        body.className = "card-body";

        const topRow = document.createElement("div");
        topRow.className = "card-top";

        const breadcrumb = document.createElement("div");
        breadcrumb.className = "source-breadcrumb";
        breadcrumb.innerHTML = `
            <span class="file-type-badge ${(result.file_type || "note").toLowerCase()}">${(result.file_type || "note").toUpperCase()}</span>
            <span class="domain-label">Vault &middot; ${escapeHtml(result.category || "notes")}</span>
        `;

        const enginePill = document.createElement("span");
        enginePill.className = "engine-pill";
        enginePill.textContent = "SQLite FTS5";

        topRow.appendChild(breadcrumb);
        topRow.appendChild(enginePill);
        body.appendChild(topRow);

        const title = document.createElement("h2");
        title.className = "card-title";
        title.innerHTML = `
            <a href="javascript:void(0)" class="local-doc-click">
                ${escapeHtml(result.title || "Untitled Note")}
            </a>
        `;
        body.appendChild(title);

        const snippet = document.createElement("p");
        snippet.className = "card-snippet";
        snippet.innerHTML = result.content || "No snippet available.";
        body.appendChild(snippet);

        const bottomRow = document.createElement("div");
        bottomRow.className = "card-bottom";

        const dateSpan = document.createElement("span");
        dateSpan.className = "pub-date";
        dateSpan.textContent = result.filename || "Local Document";

        const readBtn = document.createElement("button");
        readBtn.type = "button";
        readBtn.className = "vault-view-btn";
        readBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Open Note</span>
        `;
        readBtn.addEventListener("click", () => openDocumentViewer(result.doc_id));

        title.querySelector(".local-doc-click").addEventListener("click", () => openDocumentViewer(result.doc_id));

        bottomRow.appendChild(dateSpan);
        bottomRow.appendChild(readBtn);
        body.appendChild(bottomRow);

        card.appendChild(body);
        return card;
    }

    // 1. IMAGE SEARCH SPECIFIC GRID CARD
    if (activeCategory === "images" && thumbnail) {
        const card = document.createElement("a");
        card.className = "photo-card";
        card.href = safeUrl;
        card.target = "_blank";
        card.rel = "noopener noreferrer";

        const img = document.createElement("img");
        img.className = "photo-img";
        img.src = thumbnail;
        img.alt = result.title || "Image result";
        img.loading = "lazy";
        img.onerror = () => card.remove();

        const caption = document.createElement("div");
        caption.className = "photo-caption";
        caption.innerHTML = `
            <div class="photo-title">${escapeHtml(result.title || "Untitled")}</div>
            <div class="photo-source">${escapeHtml(domain || engine)}</div>
        `;

        card.appendChild(img);
        card.appendChild(caption);
        return card;
    }

    // 2. VIDEO SEARCH RESULT CARD
    if (activeCategory === "videos" && thumbnail) {
        const card = document.createElement("article");
        card.className = "result-card video-result-layout";

        const poster = document.createElement("div");
        poster.className = "video-poster-box";
        poster.innerHTML = `
            <img class="video-poster-img" src="${escapeHtml(thumbnail)}" alt="" loading="lazy" onerror="this.parentElement.remove()">
            <div class="play-symbol" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
            </div>
        `;

        const body = document.createElement("div");
        body.className = "card-body";
        body.innerHTML = `
            <div class="card-top">
                <div class="source-breadcrumb">
                    <span class="domain-label">${escapeHtml(domain)}</span>
                </div>
                <span class="engine-pill">${escapeHtml(engine)}</span>
            </div>
            <h2 class="card-title">
                <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">
                    ${escapeHtml(result.title || "Untitled Video")}
                    <svg class="external-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>
            </h2>
            <p class="card-snippet">${escapeHtml(result.content || "No description provided.")}</p>
        `;

        card.appendChild(poster);
        card.appendChild(body);
        return card;
    }

    // 3. GENERAL WEB & NEWS CARD
    const card = document.createElement("article");
    card.className = "result-card";
    if (result.boosted) {
        card.classList.add("boosted-card");
    }

    const body = document.createElement("div");
    body.className = "card-body";

    // Top metadata row: Favicon + Domain + Engine Pill + Boost Badge
    const topRow = document.createElement("div");
    topRow.className = "card-top";

    const breadcrumb = document.createElement("div");
    breadcrumb.className = "source-breadcrumb";

    const favFrame = document.createElement("div");
    favFrame.className = "favicon-frame";

    const favImg = document.createElement("img");
    favImg.className = "favicon-img";
    favImg.src = domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32` : "";
    favImg.alt = "";
    favImg.loading = "lazy";
    favImg.onerror = () => {
        favFrame.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>`;
    };
    favFrame.appendChild(favImg);

    const domainLabel = document.createElement("span");
    domainLabel.className = "domain-label";
    domainLabel.textContent = domain || "Web";

    breadcrumb.appendChild(favFrame);
    breadcrumb.appendChild(domainLabel);

    // If boosted, show personalized rank boost indicator
    if (result.boosted) {
        const boostBadge = document.createElement("span");
        boostBadge.className = "boost-badge";
        const weightLabel = result.boost_weight ? `${result.boost_weight}x` : "Boosted";
        boostBadge.title = `Promoted by personal ranking preferences (${weightLabel})`;
        boostBadge.innerHTML = `âš¡ ${weightLabel} Boost`;
        breadcrumb.appendChild(boostBadge);
    }

    const enginePill = document.createElement("span");
    enginePill.className = "engine-pill";
    enginePill.textContent = engine;

    topRow.appendChild(breadcrumb);
    topRow.appendChild(enginePill);
    body.appendChild(topRow);

    // Title Link
    const title = document.createElement("h2");
    title.className = "card-title";

    const link = document.createElement("a");
    link.href = safeUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.innerHTML = `
        ${escapeHtml(result.title || "Untitled result")}
        <svg class="external-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
    `;
    title.appendChild(link);
    body.appendChild(title);

    // Snippet
    const snippet = document.createElement("p");
    snippet.className = "card-snippet";
    snippet.textContent = result.content || "No description provided.";
    body.appendChild(snippet);

    // Bottom row: Date & Bookmark Star & Block & Copy Action
    const bottomRow = document.createElement("div");
    bottomRow.className = "card-bottom";

    const dateSpan = document.createElement("span");
    dateSpan.className = "pub-date";
    if (result.publishedDate) {
        try {
            const d = new Date(result.publishedDate);
            if (!isNaN(d.getTime())) {
                dateSpan.textContent = d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
            }
        } catch { /* ignore */ }
    }

    const actionsGroup = document.createElement("div");
    actionsGroup.style.display = "flex";
    actionsGroup.style.gap = "6px";
    actionsGroup.style.alignItems = "center";

    // Star Bookmark Button
    const bookmarkBtn = document.createElement("button");
    bookmarkBtn.type = "button";
    bookmarkBtn.className = `bookmark-btn ${isSaved ? "saved" : ""}`;
    bookmarkBtn.title = isSaved ? "Remove from bookmarks" : "Save to bookmarks";
    bookmarkBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="${isSaved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span>${isSaved ? "Saved" : "Save"}</span>
    `;
    bookmarkBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleBookmark(result, bookmarkBtn);
    });

    // 1-Click Block Domain Button
    if (domain) {
        const blockBtn = document.createElement("button");
        blockBtn.type = "button";
        blockBtn.className = "block-domain-btn";
        blockBtn.title = `Block ${domain} from future searches`;
        blockBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
            </svg>
            <span>Block</span>
        `;
        blockBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            blockDomainFromCard(domain, card);
        });
        actionsGroup.appendChild(blockBtn);
    }

    // Copy Link Button
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "copy-btn";
    copyBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
    `;
    copyBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(result.url || "");
            showToast("Copied link to clipboard");
        } catch {
            showToast("Failed to copy link");
        }
    });

    actionsGroup.appendChild(bookmarkBtn);
    actionsGroup.appendChild(copyBtn);

    bottomRow.appendChild(dateSpan);
    bottomRow.appendChild(actionsGroup);
    body.appendChild(bottomRow);

    card.appendChild(body);
    return card;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   HISTORY MANAGEMENT (SQLITE API)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE}/api/history?limit=25`);
        if (!response.ok) return;

        const data = await response.json();
        const history = Array.isArray(data.history) ? data.history : [];
        renderHistory(history);
    } catch (err) {
        console.error("History fetch error:", err);
    }
}

function renderHistory(history) {
    if (!historySection || !historyList) return;

    historyList.innerHTML = "";

    if (historyCount) {
        historyCount.textContent = history.length;
    }

    if (history.length === 0) {
        historySection.classList.add("hidden");
        return;
    }

    historySection.classList.remove("hidden");
    const fragment = document.createDocumentFragment();

    history.forEach(item => {
        const chip = document.createElement("div");
        chip.className = "history-chip";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "history-query-btn";
        btn.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span class="history-query-text" title="${escapeHtml(item.query)}">${escapeHtml(item.query)}</span>
            <span class="history-cat-tag">${escapeHtml(categoryLabel(item.category))}</span>
        `;

        btn.addEventListener("click", () => {
            searchInput.value = item.query;
            clearButton.classList.remove("hidden");
            activeCategory = item.category || "general";

            categories.forEach(b => {
                b.classList.toggle("active", b.dataset.category === activeCategory);
            });

            performSearch(item.query);
        });

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "history-delete-btn";
        delBtn.setAttribute("aria-label", `Delete search ${item.query}`);
        delBtn.title = "Delete";
        delBtn.innerHTML = "&times;";

        delBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            delBtn.disabled = true;
            try {
                await fetch(`${API_BASE}/api/history/${item.id}`, { method: "DELETE" });
                await loadHistory();
            } finally {
                delBtn.disabled = false;
            }
        });

        chip.appendChild(btn);
        chip.appendChild(delBtn);
        fragment.appendChild(chip);
    });

    historyList.appendChild(fragment);
}

if (clearHistoryButton) {
    clearHistoryButton.addEventListener("click", async () => {
        if (!confirm("Clear all search history?")) return;

        try {
            const res = await fetch(`${API_BASE}/api/history`);
            if (!res.ok) return;
            const data = await res.json();
            const list = Array.isArray(data.history) ? data.history : [];

            clearHistoryButton.disabled = true;
            for (const item of list) {
                await fetch(`${API_BASE}/api/history/${item.id}`, { method: "DELETE" });
            }
            await loadHistory();
            showToast("Search history cleared");
        } finally {
            clearHistoryButton.disabled = false;
        }
    });
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   MAIN SEARCH ENGINE
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */


/* ── Perplexity-Style AI Answer Synthesis Engine ── */
function renderAiSynthesis(query, results) {
    if (!aiAnswerCard || !aiAnswerText) return;

    const topSources = results.filter(r => (r.content || r.snippet)).slice(0, 5);
    if (topSources.length === 0) {
        aiAnswerCard.classList.add("hidden");
        return;
    }

    const queryTerms = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const candidateSentences = [];

    topSources.forEach((src, srcIdx) => {
        const text = (src.content || src.snippet || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
        const rawSentences = text.split(/(?<=[.!?])\s+/);
        rawSentences.forEach(s => {
            const clean = s.trim();
            if (clean.length < 25 || clean.length > 260) return;
            if (/cookie|privacy policy|terms of service|sign in|log in|subscribe/i.test(clean)) return;

            const lower = clean.toLowerCase();
            let score = 0;
            queryTerms.forEach(term => {
                if (lower.includes(term)) score += 2;
            });
            if (score > 0) {
                candidateSentences.push({
                    text: clean,
                    score: score + (5 - srcIdx),
                    sourceIdx: srcIdx + 1,
                    source: src
                });
            }
        });
    });

    candidateSentences.sort((a, b) => b.score - a.score);

    const chosen = [];
    for (const item of candidateSentences) {
        if (chosen.length >= 3) break;
        const isDuplicate = chosen.some(c => {
            const wordsA = new Set(c.text.toLowerCase().split(/\s+/));
            const wordsB = new Set(item.text.toLowerCase().split(/\s+/));
            const intersection = [...wordsA].filter(x => wordsB.has(x));
            return (intersection.length / Math.min(wordsA.size, wordsB.size)) > 0.65;
        });
        if (!isDuplicate) chosen.push(item);
    }

    let summaryHtml = "";
    if (chosen.length > 0) {
        summaryHtml = chosen.map(item => {
            const cite = `<a class="ai-citation-tag" href="${item.source.url}" target="_blank" rel="noopener noreferrer" title="${item.source.title}">[${item.sourceIdx}]</a>`;
            return `<p>${escapeHtml(item.text)} ${cite}</p>`;
        }).join("");
    } else {
        summaryHtml = topSources.slice(0, 2).map((src, i) => {
            const snippet = (src.content || src.snippet || "").replace(/<[^>]+>/g, "").slice(0, 200).trim();
            const cite = `<a class="ai-citation-tag" href="${src.url}" target="_blank" rel="noopener noreferrer" title="${src.title}">[${i + 1}]</a>`;
            return `<p>${escapeHtml(snippet)}... ${cite}</p>`;
        }).join("");
    }

    aiAnswerText.innerHTML = summaryHtml;

    if (aiSourcesPills) {
        aiSourcesPills.innerHTML = topSources.map((src, i) => {
            let domain = "";
            try { domain = new URL(src.url).hostname.replace(/^www\./, ""); } catch(e) { domain = "source"; }
            const cleanTitle = (src.title || domain).replace(/<[^>]+>/g, "");
            return `<a class="ai-source-pill" href="${src.url}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(cleanTitle)}">
                <span class="pill-num">${i + 1}</span>
                <span>${escapeHtml(domain)}</span>
            </a>`;
        }).join("");
    }

    if (aiSourcesCount) {
        aiSourcesCount.textContent = `Synthesized across ${topSources.length} verified sources`;
    }

    if (aiCopyBtn) {
        aiCopyBtn.onclick = () => {
            const plain = aiAnswerText.innerText.replace(/\[\d+\]/g, "");
            navigator.clipboard.writeText(plain.trim()).then(() => {
                showToast("AI answer copied to clipboard!");
            }).catch(() => {
                showToast("Failed to copy answer");
            });
        };
    }

    aiAnswerCard.classList.remove("hidden");
}

async function performSearch(query) {
    if (isBookmarksViewActive || isVaultViewActive) {
        switchToSearchView();
    }

    const cleanQuery = query.trim();

    if (!cleanQuery) {
        hero.classList.remove("compact");
        setState("", "Search across the web", "Enter any query or select an exploration chip above to search websites, images, news, and videos.");
        resultsContainer.innerHTML = "";
        searchMeta.classList.add("hidden");
        if (vaultBlendedCard) vaultBlendedCard.classList.add("hidden");
        if (aiAnswerCard) aiAnswerCard.classList.add("hidden");
        if (instantAnswerCard) instantAnswerCard.classList.add("hidden");
        await loadHistory();
        return;
    }

    lastSearchQuery = cleanQuery;
    hero.classList.add("compact");
    showSkeletonLoading();
    searchMeta.classList.add("hidden");
    if (vaultBlendedCard) vaultBlendedCard.classList.add("hidden");

    try {
        const params = new URLSearchParams({
            q: cleanQuery,
            category: activeCategory
        });

        const startTime = performance.now();
        const response = await fetch(`${API_BASE}/api/search?${params.toString()}`);
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error("Invalid response received from backend.");
        }

        if (!response.ok) {
            throw new Error(data.detail || `Search returned HTTP ${response.status}`);
        }

        // Check if query was intercepted by a Quick Bang redirect
        if (data.redirect_url) {
            showToast(`Redirecting via ${data.bang || "bang"} shortcut...`);
            window.location.href = data.redirect_url;
            return;
        }

        // Render ECE / Math Instant Answer Card if present
        if (data.instant_answer && instantAnswerCard) {
            renderInstantAnswer(data.instant_answer);
            instantAnswerCard.classList.remove("hidden");
        } else if (instantAnswerCard) {
            instantAnswerCard.classList.add("hidden");
            instantAnswerCard.innerHTML = "";
        }

        const results = Array.isArray(data.results) ? data.results : [];
        resultsContainer.innerHTML = "";

        if (activeCategory === "images") {
            resultsContainer.className = "results-container image-grid";
        } else {
            resultsContainer.className = "results-container";
        }

        if (results.length === 0) {
            if (data.instant_answer) {
                if (state) state.classList.add("hidden");
                if (metaText && metaCategoryBadge) {
                    metaText.textContent = `Instant calculator answer (${elapsed}s)`;
                    metaCategoryBadge.textContent = "Instant Answer";
                    searchMeta.classList.remove("hidden");

        // Perplexity-Style AI Answer Synthesis
        if (aiAnswerCard && results.length >= 2 && !data.instant_answer) {
            renderAiSynthesis(cleanQuery, results);
        } else if (aiAnswerCard) {
            aiAnswerCard.classList.add("hidden");
        }

        // Update URL query parameter for browser history and bookmarking
        try {
            const searchUrl = new URL(window.location.href);
            searchUrl.searchParams.set("q", cleanQuery);
            window.history.pushState({ query: cleanQuery }, "", searchUrl.toString());
        } catch(e) {}
                }
                await loadHistory();
                return;
            }
            setState("", "No results found", `No matches found for "${cleanQuery}". Try another keyword or switch category.`);
            await loadHistory();
            return;
        }

        // Update statistics
        if (metaText && metaCategoryBadge) {
            metaText.textContent = `${results.length} results found (${elapsed}s)`;
            metaCategoryBadge.textContent = categoryLabel(activeCategory);
        }
        searchMeta.classList.remove("hidden");

        // Blended Personal Knowledge Vault Intelligence Card
        if (vaultBlendedCard && vaultBlendedItems) {
            const localMatches = Array.isArray(data.local_results) ? data.local_results : [];
            if (localMatches.length > 0 && activeCategory !== "local") {
                renderBlendedVaultMatches(localMatches);
                vaultBlendedCard.classList.remove("hidden");
            } else {
                vaultBlendedCard.classList.add("hidden");
            }
        }

        const fragment = document.createDocumentFragment();
        results.forEach(res => {
            const card = createResultCard(res);
            if (card) fragment.appendChild(card);
        });

        resultsContainer.appendChild(fragment);

        document.querySelector(".results-stage").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        await loadHistory();

    } catch (err) {
        console.error("Search error:", err);
        if (vaultBlendedCard) vaultBlendedCard.classList.add("hidden");
        resultsContainer.innerHTML = "";
        const isTimeout = String(err.message).toLowerCase().includes("timed out") || String(err.message).includes("504");
        const title = isTimeout ? "Search service timed out" : "Search unavailable";
        const message = isTimeout
            ? "Your SearXNG service on Render is waking up from idle. Please click 'Try Again' in a moment."
            : (err.message || "Could not reach the search service.");

        setState("error", title, message, true);
    }
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   EVENT LISTENERS & SHORTCUTS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    performSearch(searchInput.value);
});

searchInput.addEventListener("input", () => {
    clearButton.classList.toggle("hidden", searchInput.value.length === 0);
});

clearButton.addEventListener("click", () => {
    searchInput.value = "";
    clearButton.classList.add("hidden");
    searchInput.focus();
    hero.classList.remove("compact");
    resultsContainer.innerHTML = "";
    searchMeta.classList.add("hidden");
    setState("", "Search across the web", "Enter any query or select an exploration chip above to search websites, images, news, and videos.");
    loadHistory();
});

brandLink.addEventListener("click", (e) => {
    e.preventDefault();
    switchToSearchView();
    searchInput.value = "";
    clearButton.classList.add("hidden");
    hero.classList.remove("compact");
    resultsContainer.innerHTML = "";
    searchMeta.classList.add("hidden");
    setState("", "Search across the web", "Enter any query or select an exploration chip above to search websites, images, news, and videos.");
    loadHistory();
    searchInput.focus();
});

categories.forEach(btn => {
    btn.addEventListener("click", () => {
        categories.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeCategory = btn.dataset.category;

        if (searchInput.value.trim()) {
            performSearch(searchInput.value);
        }
    });
});

if (suggestionChips) {
    suggestionChips.addEventListener("click", (e) => {
        const pill = e.target.closest(".prompt-pill");
        if (!pill) return;

        const term = pill.dataset.search || pill.textContent;
        searchInput.value = term;
        clearButton.classList.remove("hidden");
        performSearch(term);
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (noteModal && !noteModal.classList.contains("hidden")) {
            closeNoteModal();
            return;
        }
        if (docViewerModal && !docViewerModal.classList.contains("hidden")) {
            closeDocumentViewer();
            return;
        }
        if (preferencesModal && !preferencesModal.classList.contains("hidden")) {
            closePreferencesModal();
            return;
        }
        if (document.activeElement === searchInput) {
            if (searchInput.value) {
                searchInput.value = "";
                clearButton.classList.add("hidden");
            } else {
                searchInput.blur();
            }
        }
    } else if (
        e.key === "/" &&
        document.activeElement !== searchInput &&
        (!preferencesModal || preferencesModal.classList.contains("hidden")) &&
        (!noteModal || noteModal.classList.contains("hidden")) &&
        (!docViewerModal || docViewerModal.classList.contains("hidden"))
    ) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
    }
});

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   DOMAIN PREFERENCES & RANKING RULES PIPELINE (v1.2)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

async function loadDomainRules() {
    try {
        const res = await fetch(`${API_BASE}/api/preferences/domains`);
        if (!res.ok) return;

        const data = await res.json();
        cachedDomainRules = Array.isArray(data.rules) ? data.rules : [];

        // Update badge counts in UI
        if (rulesCountBadge) rulesCountBadge.textContent = cachedDomainRules.length;
        if (allRulesCount) allRulesCount.textContent = cachedDomainRules.length;

        const boostCount = cachedDomainRules.filter(r => r.rule_type === "boost").length;
        const blockCount = cachedDomainRules.filter(r => r.rule_type === "block").length;

        if (boostRulesCount) boostRulesCount.textContent = boostCount;
        if (blockRulesCount) blockRulesCount.textContent = blockCount;

        renderRulesList();
    } catch {
        // backend might still be initializing
    }
}

function renderRulesList() {
    if (!rulesListContainer) return;

    let filtered = cachedDomainRules;
    if (activeRulesFilter === "boost") {
        filtered = cachedDomainRules.filter(r => r.rule_type === "boost");
    } else if (activeRulesFilter === "block") {
        filtered = cachedDomainRules.filter(r => r.rule_type === "block");
    }

    if (filtered.length === 0) {
        rulesListContainer.innerHTML = `
            <div style="text-align: center; padding: 24px 10px; color: var(--text-muted); font-size: 13px;">
                No ${activeRulesFilter !== "all" ? activeRulesFilter : ""} rules configured yet.
            </div>`;
        return;
    }

    rulesListContainer.innerHTML = "";

    filtered.forEach(rule => {
        const item = document.createElement("div");
        item.className = "rule-item-card";

        const left = document.createElement("div");
        left.className = "rule-item-left";

        const favImg = document.createElement("img");
        favImg.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(rule.domain)}&sz=32`;
        favImg.alt = "";
        favImg.style.width = "16px";
        favImg.style.height = "16px";
        favImg.style.borderRadius = "3px";
        favImg.loading = "lazy";
        favImg.onerror = () => { favImg.style.display = "none"; };

        const info = document.createElement("div");
        info.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="rule-domain-title">${escapeHtml(rule.domain)}</span>
                ${rule.rule_type === "boost" 
                    ? `<span class="rule-badge-boost">âš¡ ${rule.weight}x</span>` 
                    : `<span class="rule-badge-block">ðŸš« Blocked</span>`}
            </div>
            ${rule.notes ? `<div class="rule-note-text" title="${escapeHtml(rule.notes)}">${escapeHtml(rule.notes)}</div>` : ""}
        `;

        left.appendChild(favImg);
        left.appendChild(info);

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "rule-del-btn";
        delBtn.title = `Delete rule for ${rule.domain}`;
        delBtn.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
        `;
        delBtn.addEventListener("click", () => deleteDomainRule(rule.id, rule.domain));

        item.appendChild(left);
        item.appendChild(delBtn);
        rulesListContainer.appendChild(item);
    });
}

async function deleteDomainRule(id, domain) {
    try {
        const res = await fetch(`${API_BASE}/api/preferences/domains/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete rule");
        showToast(`Removed rule for ${domain}`);
        await loadDomainRules();
    } catch (err) {
        showToast(err.message);
    }
}

async function blockDomainFromCard(domain, cardElement) {
    const cleanDomain = domain.toLowerCase().replace("www.", "").trim();
    const confirmed = confirm(`Do you want to permanently block "${cleanDomain}" from all future search results?`);
    if (!confirmed) return;

    try {
        const res = await fetch(`${API_BASE}/api/preferences/domains`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                domain: cleanDomain,
                rule_type: "block",
                weight: 0.0,
                notes: "Blocked directly from search results",
            }),
        });

        if (!res.ok) throw new Error("Failed to save block rule");

        // Immediately fade out and remove any cards matching this domain
        document.querySelectorAll(".result-card").forEach(c => {
            if (c.textContent.toLowerCase().includes(cleanDomain)) {
                c.style.transition = "all 0.28s ease";
                c.style.opacity = "0";
                c.style.transform = "scale(0.96)";
                setTimeout(() => c.remove(), 280);
            }
        });

        showToast(`ðŸš« Blocked ${cleanDomain} from future results`);
        await loadDomainRules();
    } catch (err) {
        showToast(`Error blocking domain: ${err.message}`);
    }
}

function openPreferencesModal() {
    if (!preferencesModal) return;
    preferencesModal.classList.remove("hidden");
    loadDomainRules();
    if (newRuleDomain) newRuleDomain.focus();
}

function closePreferencesModal() {
    if (!preferencesModal) return;
    preferencesModal.classList.add("hidden");
}

if (preferencesToggleBtn) {
    preferencesToggleBtn.addEventListener("click", openPreferencesModal);
}

if (closePreferencesBtn) {
    closePreferencesBtn.addEventListener("click", closePreferencesModal);
}

if (preferencesModal) {
    preferencesModal.addEventListener("click", (e) => {
        if (e.target === preferencesModal) {
            closePreferencesModal();
        }
    });
}

if (newRuleType) {
    newRuleType.addEventListener("change", () => {
        if (weightGroup) {
            weightGroup.style.display = newRuleType.value === "block" ? "none" : "flex";
        }
    });
}

const rulesFilterButtons = document.querySelectorAll(".rules-filter-tab");
rulesFilterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        rulesFilterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeRulesFilter = btn.dataset.filter || "all";
        renderRulesList();
    });
});

if (addRuleForm) {
    addRuleForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const rawDomain = newRuleDomain.value.trim();
        const ruleType = newRuleType.value;
        const weight = ruleType === "block" ? 0.0 : parseFloat(newRuleWeight.value);
        const notes = newRuleNotes.value.trim();

        if (!rawDomain) return;

        try {
            const res = await fetch(`${API_BASE}/api/preferences/domains`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    domain: rawDomain,
                    rule_type: ruleType,
                    weight: weight,
                    notes: notes,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to create rule");
            }

            showToast(`Rule saved for ${rawDomain}`);
            newRuleDomain.value = "";
            newRuleNotes.value = "";
            await loadDomainRules();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    });
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   LOCAL KNOWLEDGE VAULT & SQLITE FTS5 SEARCH PIPELINE (v1.3)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function renderBlendedVaultMatches(matches) {
    if (!vaultBlendedItems) return;
    if (vaultMatchesCountBadge) {
        vaultMatchesCountBadge.textContent = `${matches.length} ${matches.length === 1 ? "match" : "matches"}`;
    }
    vaultBlendedItems.innerHTML = "";
    matches.forEach(doc => {
        const item = document.createElement("div");
        item.className = "vault-blended-item";
        item.innerHTML = `
            <div class="vault-blended-item-left">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="file-type-badge ${(doc.file_type || "note").toLowerCase()}">${(doc.file_type || "note").toUpperCase()}</span>
                    <span class="vault-blended-item-title">${escapeHtml(doc.title)}</span>
                </div>
                <div class="vault-blended-item-snippet">${doc.snippet || doc.preview || "Matching document content found."}</div>
            </div>
            <button type="button" class="vault-view-btn">
                <span>View Note</span>
            </button>
        `;
        item.addEventListener("click", () => openDocumentViewer(doc.id));
        vaultBlendedItems.appendChild(item);
    });
}

async function loadVaultDocuments() {
    try {
        const res = await fetch(`${API_BASE}/api/local/documents`);
        if (!res.ok) return;

        const data = await res.json();
        cachedVaultDocs = Array.isArray(data.documents) ? data.documents : [];

        if (vaultCountBadge) vaultCountBadge.textContent = cachedVaultDocs.length;
        if (vaultAllFilterCount) vaultAllFilterCount.textContent = cachedVaultDocs.length;

        renderVaultList();
    } catch {
        // backend might still be initializing
    }
}

function renderVaultList() {
    if (!vaultList) return;

    let filtered = cachedVaultDocs;
    if (activeVaultCategoryFilter) {
        if (activeVaultCategoryFilter === "pdf") {
            filtered = cachedVaultDocs.filter(d => (d.file_type || "").toLowerCase() === "pdf");
        } else {
            filtered = cachedVaultDocs.filter(d => (d.category || "").toLowerCase() === activeVaultCategoryFilter);
        }
    }

    if (filtered.length === 0) {
        vaultList.innerHTML = `
            <div class="state-card" style="grid-column: 1 / -1;">
                <div class="vault-badge-icon" style="margin: 0 auto 12px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                </div>
                <h3 class="state-title">No documents in this category</h3>
                <p class="state-desc">Create a new note or upload a PDF / markdown document to index it into your SQLite FTS5 vault.</p>
            </div>
        `;
        return;
    }

    vaultList.innerHTML = "";

    filtered.forEach(doc => {
        const card = document.createElement("div");
        card.className = "vault-card";

        const type = (doc.file_type || "note").toLowerCase();
        const sizeFormatted = doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : "Text note";

        let dateStr = "";
        if (doc.created_at) {
            try {
                const d = new Date(doc.created_at);
                if (!isNaN(d.getTime())) {
                    dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
                }
            } catch { /* ignore */ }
        }

        card.innerHTML = `
            <div>
                <div class="vault-card-top">
                    <span class="file-type-badge ${type}">${type.toUpperCase()}</span>
                    <span class="bookmark-tag-pill">#${escapeHtml(doc.category || "notes")}</span>
                </div>
                <h3 class="vault-card-title">${escapeHtml(doc.title)}</h3>
                <p class="vault-card-preview">${escapeHtml(doc.preview || "No preview available.")}</p>
            </div>
            <div class="vault-card-bottom">
                <span>${sizeFormatted} &bull; ${dateStr}</span>
                <div class="vault-card-actions">
                    <button type="button" class="vault-view-btn" data-id="${doc.id}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span>Read</span>
                    </button>
                    <button type="button" class="vault-del-btn" title="Delete from vault" data-id="${doc.id}">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        card.querySelector(".vault-view-btn").addEventListener("click", () => openDocumentViewer(doc.id));
        card.querySelector(".vault-del-btn").addEventListener("click", () => deleteDocument(doc.id, doc.title));

        vaultList.appendChild(card);
    });
}

async function openDocumentViewer(docId) {
    if (!docViewerModal) return;
    try {
        const res = await fetch(`${API_BASE}/api/local/documents/${docId}`);
        if (!res.ok) throw new Error("Document not found");
        const doc = await res.json();

        if (docViewerTitle) docViewerTitle.textContent = doc.title || "Document Viewer";
        if (docViewerMeta) {
            const sizeStr = doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : "";
            docViewerMeta.textContent = `${(doc.file_type || "note").toUpperCase()} &bull; ${doc.category || "notes"} &bull; ${sizeStr} &bull; ${doc.created_at || ""}`;
        }
        if (docViewerContent) {
            docViewerContent.textContent = doc.content || "Empty document.";
        }

        docViewerModal.classList.remove("hidden");
    } catch (err) {
        showToast(err.message);
    }
}

function closeDocumentViewer() {
    if (!docViewerModal) return;
    docViewerModal.classList.add("hidden");
}

if (closeDocViewerBtn) {
    closeDocViewerBtn.addEventListener("click", closeDocumentViewer);
}

if (docViewerModal) {
    docViewerModal.addEventListener("click", (e) => {
        if (e.target === docViewerModal) closeDocumentViewer();
    });
}

if (docViewerCopyBtn) {
    docViewerCopyBtn.addEventListener("click", async () => {
        if (!docViewerContent) return;
        try {
            await navigator.clipboard.writeText(docViewerContent.textContent || "");
            showToast("Document text copied to clipboard");
        } catch {
            showToast("Failed to copy text");
        }
    });
}

async function deleteDocument(docId, title) {
    const confirmed = confirm(`Delete "${title}" from your personal knowledge vault?`);
    if (!confirmed) return;

    try {
        const res = await fetch(`${API_BASE}/api/local/documents/${docId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete document");
        showToast(`Deleted "${title}"`);
        await loadVaultDocuments();
    } catch (err) {
        showToast(err.message);
    }
}

function openNoteModal() {
    if (!noteModal) return;
    noteModal.classList.remove("hidden");
    if (noteTitleInput) noteTitleInput.focus();
}

function closeNoteModal() {
    if (!noteModal) return;
    noteModal.classList.add("hidden");
}

if (openNoteModalBtn) {
    openNoteModalBtn.addEventListener("click", openNoteModal);
}

if (closeNoteModalBtn) {
    closeNoteModalBtn.addEventListener("click", closeNoteModal);
}

if (cancelNoteBtn) {
    cancelNoteBtn.addEventListener("click", closeNoteModal);
}

if (noteModal) {
    noteModal.addEventListener("click", (e) => {
        if (e.target === noteModal) closeNoteModal();
    });
}

if (createNoteForm) {
    createNoteForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = noteTitleInput ? noteTitleInput.value.trim() : "";
        const category = noteCategorySelect ? noteCategorySelect.value : "notes";
        const content = noteContentInput ? noteContentInput.value.trim() : "";

        if (!title || !content) return;

        try {
            const res = await fetch(`${API_BASE}/api/local/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, category, content }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to create note");
            }

            showToast(`Note "${title}" saved to vault`);
            if (noteTitleInput) noteTitleInput.value = "";
            if (noteContentInput) noteContentInput.value = "";
            closeNoteModal();
            await loadVaultDocuments();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    });
}

// Upload file button trigger and change listener
if (uploadFileTriggerBtn && vaultFileInput) {
    uploadFileTriggerBtn.addEventListener("click", () => {
        vaultFileInput.click();
    });

    vaultFileInput.addEventListener("change", async () => {
        const file = vaultFileInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name);
        formData.append("category", file.name.endsWith(".pdf") ? "pdf" : "notes");

        showToast(`Indexing ${file.name}...`);

        try {
            const res = await fetch(`${API_BASE}/api/local/upload`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to upload and index document");
            }

            const data = await res.json();
            showToast(`Indexed ${data.title} (${data.characters_indexed || 0} chars)`);
            vaultFileInput.value = "";
            await loadVaultDocuments();
        } catch (err) {
            showToast(`Upload failed: ${err.message}`);
        }
    });
}

// Vault category filters
if (vaultCategoryFilters) {
    vaultCategoryFilters.querySelectorAll(".tag-filter-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            vaultCategoryFilters.querySelectorAll(".tag-filter-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            activeVaultCategoryFilter = chip.dataset.category || "";
            renderVaultList();
        });
    });
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   INSTANT ANSWER CARD RENDERER
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function renderInstantAnswer(ans) {
    if (!instantAnswerCard || !ans) return;

    let html = "";

    if (ans.type === "ohm" || ans.type === "ohms_law") {
        html = `
            <div class="ia-header">
                <div class="ia-title-group">
                    <div class="ia-icon-badge">âš¡</div>
                    <div>
                        <h3 class="ia-title">${escapeHtml(ans.title || "Ohm's Law & Power")}</h3>
                        <div class="ia-subtitle">V = I &times; R &bull; P = V &times; I</div>
                    </div>
                </div>
                <span class="ia-badge">ECE Formula</span>
            </div>
            <div class="metric-cards-grid">
                <div class="metric-stat-card ${ans.v !== null ? 'highlight' : ''}">
                    <span class="metric-stat-label">Voltage (V)</span>
                    <span class="metric-stat-value">${ans.voltage || "N/A"}</span>
                </div>
                <div class="metric-stat-card ${ans.i !== null ? 'highlight' : ''}">
                    <span class="metric-stat-label">Current (I)</span>
                    <span class="metric-stat-value">${ans.current || "N/A"}</span>
                </div>
                <div class="metric-stat-card ${ans.r !== null ? 'highlight' : ''}">
                    <span class="metric-stat-label">Resistance (R)</span>
                    <span class="metric-stat-value">${ans.resistance || "N/A"}</span>
                </div>
                <div class="metric-stat-card ${ans.p !== null ? 'highlight' : ''}">
                    <span class="metric-stat-label">Power (P)</span>
                    <span class="metric-stat-value">${ans.power || "N/A"}</span>
                </div>
            </div>
            <div class="metric-formula-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span>${escapeHtml(ans.formula || "V = I Ã— R | P = V Ã— I")}</span>
            </div>
        `;
    } else if (ans.type === "resistor_color") {
        const bands = ans.bands_4 || [];
        const colorHexMap = ans.color_hex || {
            black: "#000000", brown: "#8b4513", red: "#ef4444", orange: "#f97316",
            yellow: "#eab308", green: "#22c55e", blue: "#3b82f6", violet: "#a855f7",
            gray: "#9ca3af", white: "#ffffff", gold: "#d4af37", silver: "#c0c0c0"
        };

        const bandsHtml = bands.map(b => `
            <div class="color-band" style="background-color: ${colorHexMap[b] || b};" title="${b}"></div>
        `).join("");

        const tagsHtml = bands.map((b, i) => `
            <span class="band-chip">
                <span class="band-dot" style="background-color: ${colorHexMap[b] || b};"></span>
                <span>Band ${i + 1}: ${b}</span>
            </span>
        `).join("");

        html = `
            <div class="ia-header">
                <div class="ia-title-group">
                    <div class="ia-icon-badge">ðŸŽ¨</div>
                    <div>
                        <h3 class="ia-title">${escapeHtml(ans.title || "Resistor Color Bands")}</h3>
                        <div class="ia-subtitle">4-Band Standard &bull; Tolerance: ${escapeHtml(ans.tolerance || "Â±5%")}</div>
                    </div>
                </div>
                <span class="ia-badge">${escapeHtml(ans.resistance || "")}</span>
            </div>
            <div class="resistor-display-box">
                <div class="resistor-graphic">
                    <div class="resistor-lead"></div>
                    <div class="resistor-body">
                        ${bandsHtml}
                    </div>
                    <div class="resistor-lead"></div>
                </div>
                <div class="band-tags-row">
                    ${tagsHtml}
                </div>
            </div>
        `;
    } else if (ans.type === "rc_filter") {
        html = `
            <div class="ia-header">
                <div class="ia-title-group">
                    <div class="ia-icon-badge">ã€°ï¸</div>
                    <div>
                        <h3 class="ia-title">${escapeHtml(ans.title || "RC Filter Calculator")}</h3>
                        <div class="ia-subtitle">Cutoff Frequency (f<sub>c</sub>) & Time Constant (&tau;)</div>
                    </div>
                </div>
                <span class="ia-badge">f<sub>c</sub> = 1/(2&pi;RC)</span>
            </div>
            <div class="metric-cards-grid">
                <div class="metric-stat-card highlight">
                    <span class="metric-stat-label">Cutoff Freq (fc)</span>
                    <span class="metric-stat-value">${ans.cutoff_frequency || "N/A"}</span>
                </div>
                <div class="metric-stat-card highlight">
                    <span class="metric-stat-label">Time Constant (&tau;)</span>
                    <span class="metric-stat-value">${ans.time_constant || "N/A"}</span>
                </div>
                <div class="metric-stat-card">
                    <span class="metric-stat-label">Resistance (R)</span>
                    <span class="metric-stat-value">${ans.resistance || "N/A"}</span>
                </div>
                <div class="metric-stat-card">
                    <span class="metric-stat-label">Capacitance (C)</span>
                    <span class="metric-stat-value">${ans.capacitance || "N/A"}</span>
                </div>
            </div>
        `;
    } else if (ans.type === "decibel") {
        html = `
            <div class="ia-header">
                <div class="ia-title-group">
                    <div class="ia-icon-badge">ðŸ”Š</div>
                    <div>
                        <h3 class="ia-title">${escapeHtml(ans.title || "Decibel & Power Ratios")}</h3>
                        <div class="ia-subtitle">dB &bull; dBm &bull; Power/Voltage Ratios</div>
                    </div>
                </div>
                <span class="ia-badge">Logarithmic Scale</span>
            </div>
            <div class="metric-cards-grid">
                <div class="metric-stat-card highlight">
                    <span class="metric-stat-label">Decibels</span>
                    <span class="metric-stat-value">${ans.db_value || "N/A"}</span>
                </div>
                <div class="metric-stat-card highlight">
                    <span class="metric-stat-label">Power (dBm)</span>
                    <span class="metric-stat-value">${ans.power_mw || ans.power_watts || "N/A"}</span>
                </div>
                <div class="metric-stat-card">
                    <span class="metric-stat-label">Power Ratio</span>
                    <span class="metric-stat-value">${ans.power_ratio || "N/A"}</span>
                </div>
                <div class="metric-stat-card">
                    <span class="metric-stat-label">Voltage Ratio</span>
                    <span class="metric-stat-value">${ans.voltage_ratio || "N/A"}</span>
                </div>
            </div>
        `;
    } else if (ans.type === "base_converter") {
        html = `
            <div class="ia-header">
                <div class="ia-title-group">
                    <div class="ia-icon-badge">ðŸ”¢</div>
                    <div>
                        <h3 class="ia-title">${escapeHtml(ans.title || "Programmer Base Converter")}</h3>
                        <div class="ia-subtitle">${escapeHtml(ans.formula || "Dec Â· Hex Â· Bin Â· Oct")}</div>
                    </div>
                </div>
                <span class="ia-badge">Hex / Bin / Oct</span>
            </div>
            <div class="base-converter-grid">
                <div class="base-stat-box">
                    <div class="base-box-header">
                        <span class="base-stat-label">Decimal (10)</span>
                        <button type="button" class="copy-mini-btn" data-copy="${ans.decimal}" title="Copy">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                    </div>
                    <div class="base-stat-value">${ans.decimal}</div>
                </div>
                <div class="base-stat-box">
                    <div class="base-box-header">
                        <span class="base-stat-label">Hexadecimal (16)</span>
                        <button type="button" class="copy-mini-btn" data-copy="${ans.hexadecimal}" title="Copy">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                    </div>
                    <div class="base-stat-value">${ans.hexadecimal}</div>
                </div>
                <div class="base-stat-box">
                    <div class="base-box-header">
                        <span class="base-stat-label">Binary (2)</span>
                        <button type="button" class="copy-mini-btn" data-copy="${ans.binary}" title="Copy">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                    </div>
                    <div class="base-stat-value" style="font-size: 13px;">${ans.binary}</div>
                </div>
                <div class="base-stat-box">
                    <div class="base-box-header">
                        <span class="base-stat-label">Octal (8)</span>
                        <button type="button" class="copy-mini-btn" data-copy="${ans.octal}" title="Copy">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                    </div>
                    <div class="base-stat-value">${ans.octal}</div>
                </div>
            </div>
        `;
    } else if (ans.type === "math") {
        html = `
            <div class="ia-header">
                <div class="ia-title-group">
                    <div class="ia-icon-badge">ðŸ§®</div>
                    <div>
                        <h3 class="ia-title">${escapeHtml(ans.title || "Calculator")}</h3>
                        <div class="ia-subtitle">${escapeHtml(ans.formula || ans.expression || "")}</div>
                    </div>
                </div>
                <span class="ia-badge">Math</span>
            </div>
            <div class="math-eval-box">
                <span class="math-expr-title">${escapeHtml(ans.expression || "")} =</span>
                <span class="math-result-large">${escapeHtml(ans.result || "")}</span>
            </div>
        `;
    }

    instantAnswerCard.innerHTML = html;

    // Mini copy buttons in instant answer card
    instantAnswerCard.querySelectorAll(".copy-mini-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const val = btn.dataset.copy;
            if (val) {
                navigator.clipboard.writeText(val).then(() => {
                    showToast(`Copied ${val} to clipboard`);
                });
            }
        });
    });
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   PERSONAL SPEED DIALS / QUICK ACCESS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const DEFAULT_SPEED_DIALS = [
    { id: "sd1", title: "GitHub", url: "https://github.com" },
    { id: "sd2", title: "YouTube", url: "https://youtube.com" },
    { id: "sd3", title: "ArXiv", url: "https://arxiv.org" },
    { id: "sd4", title: "Stack Overflow", url: "https://stackoverflow.com" },
    { id: "sd5", title: "Wikipedia", url: "https://en.wikipedia.org" },
    { id: "sd6", title: "DigiKey", url: "https://www.digikey.com" }
];

function getSpeedDials() {
    try {
        const raw = localStorage.getItem("mysearch_speed_dials");
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch { /* ignore */ }
    return DEFAULT_SPEED_DIALS;
}

function saveSpeedDials(dials) {
    try {
        localStorage.setItem("mysearch_speed_dials", JSON.stringify(dials));
    } catch { /* ignore */ }
}

function renderSpeedDials() {
    if (!speedDialsRow) return;

    const dials = getSpeedDials();
    speedDialsRow.innerHTML = "";

    dials.forEach(dial => {
        const chip = document.createElement("a");
        chip.className = "speed-dial-chip";
        chip.href = dial.url;
        chip.target = "_blank";
        chip.rel = "noopener noreferrer";

        let domain = "";
        try { domain = new URL(dial.url).hostname; } catch { domain = ""; }
        const favUrl = domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32` : "";
        const initial = dial.title.charAt(0).toUpperCase();

        chip.innerHTML = `
            <img class="speed-dial-fav" src="${favUrl}" alt="${initial}" onerror="this.outerHTML='<span class=\'speed-dial-fav\'>${initial}</span>'">
            <span class="speed-dial-title">${escapeHtml(dial.title)}</span>
            <button type="button" class="speed-dial-del-btn" data-id="${dial.id}" title="Remove link">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        `;

        const delBtn = chip.querySelector(".speed-dial-del-btn");
        if (delBtn) {
            delBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteSpeedDial(dial.id);
            });
        }

        speedDialsRow.appendChild(chip);
    });

    // Add Link button
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "speed-dial-add-btn";
    addBtn.id = "openSpeedDialModalBtn";
    addBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>Add Link</span>
    `;
    addBtn.addEventListener("click", openSpeedDialModal);
    speedDialsRow.appendChild(addBtn);
}

function addSpeedDial(title, url) {
    const dials = getSpeedDials();
    const newId = "sd_" + Date.now();
    dials.push({ id: newId, title: title.trim(), url: url.trim() });
    saveSpeedDials(dials);
    renderSpeedDials();
    showToast(`Added "${title}" to speed dials`);
}

function deleteSpeedDial(id) {
    let dials = getSpeedDials();
    dials = dials.filter(d => d.id !== id);
    saveSpeedDials(dials);
    renderSpeedDials();
    showToast("Removed speed dial");
}

function openSpeedDialModal() {
    if (!speedDialModal) return;
    speedDialModal.classList.remove("hidden");
    if (speedDialTitleInput) {
        speedDialTitleInput.value = "";
        speedDialTitleInput.focus();
    }
    if (speedDialUrlInput) speedDialUrlInput.value = "";
}

function closeSpeedDialModal() {
    if (!speedDialModal) return;
    speedDialModal.classList.add("hidden");
}

if (closeSpeedDialModalBtn) closeSpeedDialModalBtn.addEventListener("click", closeSpeedDialModal);
if (cancelSpeedDialBtn) cancelSpeedDialBtn.addEventListener("click", closeSpeedDialModal);
if (speedDialModal) {
    speedDialModal.addEventListener("click", (e) => {
        if (e.target === speedDialModal) closeSpeedDialModal();
    });
}

if (speedDialForm) {
    speedDialForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const title = speedDialTitleInput ? speedDialTitleInput.value.trim() : "";
        const url = speedDialUrlInput ? speedDialUrlInput.value.trim() : "";
        if (!title || !url) return;
        addSpeedDial(title, url);
        closeSpeedDialModal();
    });
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   QUICK BANGS SHORTCUTS & AUTOCOMPLETE
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

async function loadBangs() {
    try {
        const res = await fetch(`${API_BASE}/api/bangs`);
        if (!res.ok) return;
        const data = await res.json();
        cachedBangs = Array.isArray(data.bangs) ? data.bangs : [];
        renderBangsList();
    } catch { /* ignore */ }
}

function renderBangsList(filterText = "") {
    if (!bangsListContainer) return;

    const term = filterText.toLowerCase().trim();
    const list = term
        ? cachedBangs.filter(b => b.prefix.toLowerCase().includes(term) || b.name.toLowerCase().includes(term) || (b.category || "").toLowerCase().includes(term))
        : cachedBangs;

    if (list.length === 0) {
        bangsListContainer.innerHTML = `
            <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">
                No bang shortcuts match "${escapeHtml(filterText)}"
            </div>
        `;
        return;
    }

    bangsListContainer.innerHTML = "";
    list.forEach(b => {
        const row = document.createElement("div");
        row.className = "bang-card-row";
        row.innerHTML = `
            <div class="bang-card-left">
                <span class="bang-item-prefix">${escapeHtml(b.prefix)}</span>
                <div>
                    <div style="font-weight: 600; font-size: 13px; color: var(--text-primary);">${escapeHtml(b.name)}</div>
                    <div class="bang-item-url">${escapeHtml(b.url_template)}</div>
                </div>
            </div>
            <div class="bang-card-right">
                <span class="bookmark-tag-pill">#${escapeHtml(b.category || "web")}</span>
                ${b.is_custom ? `
                    <button type="button" class="bang-card-del-btn" data-id="${b.id}" title="Delete custom bang">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                ` : ''}
            </div>
        `;

        const delBtn = row.querySelector(".bang-card-del-btn");
        if (delBtn) {
            delBtn.addEventListener("click", () => deleteCustomBang(b.id, b.name));
        }

        bangsListContainer.appendChild(row);
    });
}

async function deleteCustomBang(id, name) {
    if (!confirm(`Delete custom shortcut "${name}"?`)) return;
    try {
        const res = await fetch(`${API_BASE}/api/bangs/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete bang");
        showToast(`Deleted ${name}`);
        await loadBangs();
    } catch (err) {
        showToast(err.message);
    }
}

function openBangsModal() {
    if (!bangsModal) return;
    bangsModal.classList.remove("hidden");
    if (bangsSearchFilter) {
        bangsSearchFilter.value = "";
        bangsSearchFilter.focus();
    }
    renderBangsList();
}

function closeBangsModal() {
    if (!bangsModal) return;
    bangsModal.classList.add("hidden");
}

if (bangsToggleBtn) bangsToggleBtn.addEventListener("click", openBangsModal);
if (closeBangsModalBtn) closeBangsModalBtn.addEventListener("click", closeBangsModal);
if (bangsModal) {
    bangsModal.addEventListener("click", (e) => {
        if (e.target === bangsModal) closeBangsModal();
    });
}

if (bangsSearchFilter) {
    bangsSearchFilter.addEventListener("input", () => {
        renderBangsList(bangsSearchFilter.value);
    });
}

if (addBangForm) {
    addBangForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const prefix = newBangPrefix ? newBangPrefix.value.trim() : "";
        const name = newBangName ? newBangName.value.trim() : "";
        const url_template = newBangUrl ? newBangUrl.value.trim() : "";

        if (!prefix || !name || !url_template) return;

        try {
            const res = await fetch(`${API_BASE}/api/bangs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prefix, name, url_template, category: "custom" })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Failed to add bang");
            }

            showToast(`Added bang "${prefix}" for ${name}`);
            if (newBangPrefix) newBangPrefix.value = "";
            if (newBangName) newBangName.value = "";
            if (newBangUrl) newBangUrl.value = "";
            await loadBangs();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        }
    });
}

// Real-Time Bangs Autocomplete Dropdown Logic
function initBangsAutocomplete() {
    if (!searchInput || !bangsDropdown) return;

    searchInput.addEventListener("input", () => {
        const val = searchInput.value;
        if (val.startsWith("!")) {
            const prefixTerm = val.split(" ")[0].toLowerCase();
            const matches = cachedBangs.filter(b => b.prefix.toLowerCase().startsWith(prefixTerm) || b.name.toLowerCase().includes(prefixTerm.replace("!", "")));

            if (matches.length > 0) {
                selectedBangDropdownIndex = -1;
                bangsDropdown.innerHTML = "";
                matches.slice(0, 7).forEach((b, idx) => {
                    const item = document.createElement("div");
                    item.className = "bang-item";
                    item.dataset.index = idx;
                    item.innerHTML = `
                        <span class="bang-item-prefix">${escapeHtml(b.prefix)}</span>
                        <span class="bang-item-name">${escapeHtml(b.name)}</span>
                        <span class="bang-item-url">${escapeHtml(b.url_template)}</span>
                    `;
                    item.addEventListener("click", () => {
                        selectBangAutocomplete(b.prefix);
                    });
                    bangsDropdown.appendChild(item);
                });
                bangsDropdown.classList.remove("hidden");
                return;
            }
        }
        bangsDropdown.classList.add("hidden");
    });

    searchInput.addEventListener("keydown", (e) => {
        if (bangsDropdown.classList.contains("hidden")) return;

        const items = bangsDropdown.querySelectorAll(".bang-item");
        if (items.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedBangDropdownIndex = (selectedBangDropdownIndex + 1) % items.length;
            updateBangDropdownHighlight(items);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedBangDropdownIndex = (selectedBangDropdownIndex - 1 + items.length) % items.length;
            updateBangDropdownHighlight(items);
        } else if (e.key === "Enter" && selectedBangDropdownIndex >= 0) {
            e.preventDefault();
            const chosen = items[selectedBangDropdownIndex];
            const prefix = chosen.querySelector(".bang-item-prefix").textContent.trim();
            selectBangAutocomplete(prefix);
        } else if (e.key === "Escape") {
            bangsDropdown.classList.add("hidden");
        }
    });

    document.addEventListener("click", (e) => {
        if (!searchForm.contains(e.target)) {
            bangsDropdown.classList.add("hidden");
        }
    });
}

function updateBangDropdownHighlight(items) {
    items.forEach((item, idx) => {
        item.classList.toggle("selected", idx === selectedBangDropdownIndex);
        if (idx === selectedBangDropdownIndex) item.scrollIntoView({ block: "nearest" });
    });
}

function selectBangAutocomplete(prefix) {
    const parts = searchInput.value.split(" ");
    parts[0] = prefix;
    searchInput.value = parts.join(" ") + (parts.length === 1 ? " " : "");
    bangsDropdown.classList.add("hidden");
    searchInput.focus();
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ECE ENGINEERING WORKSTATION MODAL & CALCULATORS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function openEceModal() {
    if (!eceModal) return;
    eceModal.classList.remove("hidden");
    renderEceToolStage(activeEceTab);
}

function closeEceModal() {
    if (!eceModal) return;
    eceModal.classList.add("hidden");
}

if (eceToggleBtn) eceToggleBtn.addEventListener("click", openEceModal);
if (closeEceModalBtn) closeEceModalBtn.addEventListener("click", closeEceModal);
if (eceModal) {
    eceModal.addEventListener("click", (e) => {
        if (e.target === eceModal) closeEceModal();
    });
}

if (eceTabBar) {
    eceTabBar.querySelectorAll(".ece-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            eceTabBar.querySelectorAll(".ece-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            activeEceTab = tab.dataset.tool || "ohm";
            renderEceToolStage(activeEceTab);
        });
    });
}

function renderEceToolStage(tool) {
    if (!eceToolStage) return;

    if (tool === "ohm") {
        eceToolStage.innerHTML = `
            <div class="ece-calc-card">
                <div>
                    <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 4px;">âš¡ Ohm's Law & DC Power Calculator</h3>
                    <p class="ece-calc-desc">Enter any 2 values below. The remaining 2 values and power dissipation will compute instantly.</p>
                </div>
                <div class="ece-inputs-grid">
                    <div class="ece-input-item">
                        <label for="calcOhmV">Voltage (V, in Volts)</label>
                        <input type="number" step="any" id="calcOhmV" placeholder="e.g. 5, 12, 3.3">
                    </div>
                    <div class="ece-input-item">
                        <label for="calcOhmI">Current (I, in Amperes)</label>
                        <input type="number" step="any" id="calcOhmI" placeholder="e.g. 0.02 (20mA)">
                    </div>
                    <div class="ece-input-item">
                        <label for="calcOhmR">Resistance (R, in Ohms)</label>
                        <input type="number" step="any" id="calcOhmR" placeholder="e.g. 220, 10000">
                    </div>
                    <div class="ece-input-item">
                        <label for="calcOhmP">Power (P, in Watts)</label>
                        <input type="number" step="any" id="calcOhmP" placeholder="e.g. 0.25 (1/4W)">
                    </div>
                </div>
                <div id="eceOhmResult" style="margin-top: 10px;"></div>
            </div>
        `;
        bindOhmCalculator();
    } else if (tool === "resistor") {
        eceToolStage.innerHTML = `
            <div class="ece-calc-card">
                <div>
                    <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 4px;">ðŸŽ¨ Resistor Color Code Explorer</h3>
                    <p class="ece-calc-desc">Convert resistance value to 4-band color bands or select band colors interactively.</p>
                </div>
                <div style="display: flex; gap: 10px; align-items: flex-end; margin-bottom: 8px;">
                    <div class="ece-input-item" style="flex: 1;">
                        <label for="resValInput">Enter Resistance Value (e.g. 4.7k, 220, 10k, 1M)</label>
                        <input type="text" id="resValInput" placeholder="4.7k, 220 ohm, 100k...">
                    </div>
                    <button type="button" class="add-rule-btn" id="calcResBtn" style="height: 40px;">
                        <span>Show Bands</span>
                    </button>
                </div>
                <div id="eceResResult"></div>
            </div>
        `;
        bindResistorCalculator();
    } else if (tool === "rc") {
        eceToolStage.innerHTML = `
            <div class="ece-calc-card">
                <div>
                    <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 4px;">ã€°ï¸ RC Low-Pass / High-Pass Cutoff Frequency</h3>
                    <p class="ece-calc-desc">Calculates cutoff frequency fc = 1 / (2&pi;RC) and time constant &tau; = RC.</p>
                </div>
                <div class="ece-inputs-grid">
                    <div class="ece-input-item">
                        <label for="calcRcR">Resistance (R, in Ohms)</label>
                        <input type="text" id="calcRcR" placeholder="e.g. 10k or 10000">
                    </div>
                    <div class="ece-input-item">
                        <label for="calcRcC">Capacitance (C, in Farads)</label>
                        <input type="text" id="calcRcC" placeholder="e.g. 100n, 10u, 47p">
                    </div>
                </div>
                <div id="eceRcResult" style="margin-top: 10px;"></div>
            </div>
        `;
        bindRcCalculator();
    } else if (tool === "db") {
        eceToolStage.innerHTML = `
            <div class="ece-calc-card">
                <div>
                    <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 4px;">ðŸ”Š Decibels (dB / dBm) & Ratios</h3>
                    <p class="ece-calc-desc">Calculate dB gain/attenuation from voltages, powers, or dBm conversions.</p>
                </div>
                <div class="ece-inputs-grid">
                    <div class="ece-input-item">
                        <label for="calcDbV1">Input Voltage V1 (V)</label>
                        <input type="number" step="any" id="calcDbV1" placeholder="e.g. 1.0">
                    </div>
                    <div class="ece-input-item">
                        <label for="calcDbV2">Output Voltage V2 (V)</label>
                        <input type="number" step="any" id="calcDbV2" placeholder="e.g. 10.0">
                    </div>
                </div>
                <div id="eceDbResult" style="margin-top: 10px;"></div>
            </div>
        `;
        bindDbCalculator();
    } else if (tool === "base") {
        eceToolStage.innerHTML = `
            <div class="ece-calc-card">
                <div>
                    <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 4px;">ðŸ”¢ Programmer Number Base Converter</h3>
                    <p class="ece-calc-desc">Type in Decimal, Hex, Binary, or Octal. All bases update simultaneously in real-time.</p>
                </div>
                <div class="ece-inputs-grid">
                    <div class="ece-input-item">
                        <label for="baseDecInput">Decimal (Base 10)</label>
                        <input type="text" id="baseDecInput" placeholder="e.g. 255">
                    </div>
                    <div class="ece-input-item">
                        <label for="baseHexInput">Hexadecimal (Base 16)</label>
                        <input type="text" id="baseHexInput" placeholder="e.g. FF or 0xFF">
                    </div>
                    <div class="ece-input-item">
                        <label for="baseBinInput">Binary (Base 2)</label>
                        <input type="text" id="baseBinInput" placeholder="e.g. 11111111">
                    </div>
                    <div class="ece-input-item">
                        <label for="baseOctInput">Octal (Base 8)</label>
                        <input type="text" id="baseOctInput" placeholder="e.g. 377">
                    </div>
                </div>
            </div>
        `;
        bindBaseCalculator();
    }
}

function bindOhmCalculator() {
    const vIn = document.getElementById("calcOhmV");
    const iIn = document.getElementById("calcOhmI");
    const rIn = document.getElementById("calcOhmR");
    const pIn = document.getElementById("calcOhmP");
    const resBox = document.getElementById("eceOhmResult");

    const compute = () => {
        let v = parseFloat(vIn.value);
        let i = parseFloat(iIn.value);
        let r = parseFloat(rIn.value);
        let p = parseFloat(pIn.value);

        let count = [!isNaN(v), !isNaN(i), !isNaN(r), !isNaN(p)].filter(Boolean).length;
        if (count < 2) {
            resBox.innerHTML = `<div style="color: var(--text-muted); font-size: 12.5px;">Enter at least 2 known values to solve circuit.</div>`;
            return;
        }

        if (!isNaN(v) && !isNaN(i)) {
            r = v / i;
            p = v * i;
        } else if (!isNaN(v) && !isNaN(r)) {
            i = v / r;
            p = (v * v) / r;
        } else if (!isNaN(v) && !isNaN(p)) {
            i = p / v;
            r = (v * v) / p;
        } else if (!isNaN(i) && !isNaN(r)) {
            v = i * r;
            p = (i * i) * r;
        } else if (!isNaN(i) && !isNaN(p)) {
            v = p / i;
            r = p / (i * i);
        } else if (!isNaN(r) && !isNaN(p)) {
            v = Math.sqrt(p * r);
            i = Math.sqrt(p / r);
        }

        resBox.innerHTML = `
            <div class="metric-cards-grid">
                <div class="metric-stat-card"><span class="metric-stat-label">Voltage</span><span class="metric-stat-value">${v.toFixed(3)} V</span></div>
                <div class="metric-stat-card"><span class="metric-stat-label">Current</span><span class="metric-stat-value">${(i * 1000).toFixed(2)} mA</span></div>
                <div class="metric-stat-card"><span class="metric-stat-label">Resistance</span><span class="metric-stat-value">${r.toFixed(2)} &Omega;</span></div>
                <div class="metric-stat-card"><span class="metric-stat-label">Power</span><span class="metric-stat-value">${(p * 1000).toFixed(2)} mW</span></div>
            </div>
        `;
    };

    [vIn, iIn, rIn, pIn].forEach(input => input.addEventListener("input", compute));
}

function bindResistorCalculator() {
    const input = document.getElementById("resValInput");
    const btn = document.getElementById("calcResBtn");
    const resBox = document.getElementById("eceResResult");

    const run = async () => {
        const val = input.value.trim();
        if (!val) return;
        try {
            const res = await fetch(`${API_BASE}/api/tools/ece?q=${encodeURIComponent("resistor " + val)}`);
            if (!res.ok) throw new Error("Could not calculate bands for this value");
            const data = await res.json();
            const bands = data.bands_4 || [];
            const hexMap = data.color_hex || {};

            resBox.innerHTML = `
                <div class="resistor-display-box">
                    <div class="resistor-graphic">
                        <div class="resistor-lead"></div>
                        <div class="resistor-body">
                            ${bands.map(b => `<div class="color-band" style="background-color: ${hexMap[b] || b};" title="${b}"></div>`).join("")}
                        </div>
                        <div class="resistor-lead"></div>
                    </div>
                    <div class="band-tags-row">
                        ${bands.map((b, i) => `<span class="band-chip"><span class="band-dot" style="background-color: ${hexMap[b] || b};"></span><span>Band ${i+1}: ${b}</span></span>`).join("")}
                    </div>
                    <div style="margin-top: 12px; font-weight: 700; font-size: 15px; color: var(--accent); font-family: 'JetBrains Mono', monospace;">
                        ${data.resistance} &bull; Tolerance: ${data.tolerance || "Â±5%"}
                    </div>
                </div>
            `;
        } catch (err) {
            resBox.innerHTML = `<div style="color: var(--danger); font-size: 13px;">${err.message}</div>`;
        }
    };

    btn.addEventListener("click", run);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
    // Default trigger
    input.value = "4.7k";
    run();
}

function bindRcCalculator() {
    const rIn = document.getElementById("calcRcR");
    const cIn = document.getElementById("calcRcC");
    const resBox = document.getElementById("eceRcResult");

    const run = async () => {
        const rVal = rIn.value.trim();
        const cVal = cIn.value.trim();
        if (!rVal || !cVal) return;

        try {
            const res = await fetch(`${API_BASE}/api/tools/ece?q=${encodeURIComponent("rc " + rVal + " " + cVal)}`);
            if (!res.ok) return;
            const data = await res.json();
            resBox.innerHTML = `
                <div class="metric-cards-grid">
                    <div class="metric-stat-card highlight"><span class="metric-stat-label">Cutoff Freq (fc)</span><span class="metric-stat-value">${data.cutoff_frequency}</span></div>
                    <div class="metric-stat-card highlight"><span class="metric-stat-label">Time Constant (&tau;)</span><span class="metric-stat-value">${data.time_constant}</span></div>
                    <div class="metric-stat-card"><span class="metric-stat-label">R</span><span class="metric-stat-value">${data.resistance}</span></div>
                    <div class="metric-stat-card"><span class="metric-stat-label">C</span><span class="metric-stat-value">${data.capacitance}</span></div>
                </div>
            `;
        } catch { /* ignore */ }
    };

    rIn.addEventListener("input", run);
    cIn.addEventListener("input", run);
    rIn.value = "10k";
    cIn.value = "100n";
    run();
}

function bindDbCalculator() {
    const v1In = document.getElementById("calcDbV1");
    const v2In = document.getElementById("calcDbV2");
    const resBox = document.getElementById("eceDbResult");

    const compute = () => {
        const v1 = parseFloat(v1In.value);
        const v2 = parseFloat(v2In.value);
        if (isNaN(v1) || isNaN(v2) || v1 <= 0 || v2 <= 0) return;

        const ratio = v2 / v1;
        const db = 20 * Math.log10(ratio);

        resBox.innerHTML = `
            <div class="metric-cards-grid">
                <div class="metric-stat-card highlight"><span class="metric-stat-label">Decibels</span><span class="metric-stat-value">${db.toFixed(2)} dB</span></div>
                <div class="metric-stat-card"><span class="metric-stat-label">Voltage Gain</span><span class="metric-stat-value">${ratio.toFixed(3)}&times;</span></div>
                <div class="metric-stat-card"><span class="metric-stat-label">Power Gain</span><span class="metric-stat-value">${(ratio * ratio).toFixed(3)}&times;</span></div>
            </div>
        `;
    };

    v1In.addEventListener("input", compute);
    v2In.addEventListener("input", compute);
    v1In.value = 1;
    v2In.value = 10;
    compute();
}

function bindBaseCalculator() {
    const decIn = document.getElementById("baseDecInput");
    const hexIn = document.getElementById("baseHexInput");
    const binIn = document.getElementById("baseBinInput");
    const octIn = document.getElementById("baseOctInput");

    const updateFromDec = (num) => {
        if (isNaN(num)) return;
        hexIn.value = "0x" + num.toString(16).toUpperCase();
        binIn.value = num.toString(2);
        octIn.value = "0o" + num.toString(8);
    };

    decIn.addEventListener("input", () => {
        const num = parseInt(decIn.value, 10);
        updateFromDec(num);
    });

    hexIn.addEventListener("input", () => {
        const clean = hexIn.value.replace(/^0x/i, "");
        const num = parseInt(clean, 16);
        if (!isNaN(num)) {
            decIn.value = num;
            binIn.value = num.toString(2);
            octIn.value = "0o" + num.toString(8);
        }
    });

    binIn.addEventListener("input", () => {
        const clean = binIn.value.replace(/^0b/i, "").replace(/\s+/g, "");
        const num = parseInt(clean, 2);
        if (!isNaN(num)) {
            decIn.value = num;
            hexIn.value = "0x" + num.toString(16).toUpperCase();
            octIn.value = "0o" + num.toString(8);
        }
    });

    octIn.addEventListener("input", () => {
        const clean = octIn.value.replace(/^0o/i, "");
        const num = parseInt(clean, 8);
        if (!isNaN(num)) {
            decIn.value = num;
            hexIn.value = "0x" + num.toString(16).toUpperCase();
            binIn.value = num.toString(2);
        }
    });

    decIn.value = 255;
    updateFromDec(255);
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   DATA PORTABILITY (EXPORT & IMPORT JSON)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

if (exportDataBtn) {
    exportDataBtn.addEventListener("click", async () => {
        try {
            showToast("Generating full JSON backup...");
            const res = await fetch(`${API_BASE}/api/export`);
            if (!res.ok) throw new Error("Export failed on server");
            const data = await res.json();

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const dateStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
            a.href = url;
            a.download = `mysearch_backup_${dateStr}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast("Backup downloaded successfully!");
        } catch (err) {
            showToast(`Export error: ${err.message}`);
        }
    });
}

if (importDataTriggerBtn && importFileInput) {
    importDataTriggerBtn.addEventListener("click", () => {
        importFileInput.click();
    });

    importFileInput.addEventListener("change", async () => {
        const file = importFileInput.files[0];
        if (!file) return;

        showToast("Reading backup file...");
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const payload = JSON.parse(e.target.result);
                const res = await fetch(`${API_BASE}/api/import`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.detail || "Failed to restore backup");
                }

                const resData = await res.json();
                const counts = resData.imported_counts || {};
                showToast(`Restored: ${counts.bookmarks || 0} bookmarks, ${counts.history || 0} history, ${counts.local_documents || 0} notes`);

                importFileInput.value = "";
                await loadHistory();
                await refreshBookmarksData();
                await loadDomainRules();
                await loadVaultDocuments();
                await loadBangs();
            } catch (err) {
                showToast(`Restore failed: ${err.message}`);
            }
        };
        reader.readAsText(file);
    });
}


/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   INITIAL LOAD
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

// Run immediately for instant theme application before full DOM paint
initTheme();


/* ── Cloud & Mobile API Endpoint Management ── */
async function checkApiHealth(url) {
    if (!apiStatusMessage) return;
    try {
        apiStatusMessage.textContent = "Connecting to " + url + "...";
        const res = await fetch(url + "/health", { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
            const data = await res.json();
            apiStatusMessage.textContent = "Connected (v" + (data.version || "0.7.0") + ") • " + url;
            apiStatusMessage.style.color = "var(--accent)";
        } else {
            apiStatusMessage.textContent = "Server responded with " + res.status + " • " + url;
            apiStatusMessage.style.color = "var(--text-muted)";
        }
    } catch (err) {
        apiStatusMessage.textContent = "Offline / unreachable: " + url;
        apiStatusMessage.style.color = "#e63946";
    }
}

function initApiEndpointSettings() {
    if (!apiEndpointInput) return;
    apiEndpointInput.value = API_BASE;
    checkApiHealth(API_BASE);

    if (saveApiEndpointBtn) {
        saveApiEndpointBtn.onclick = async () => {
            const raw = apiEndpointInput.value.trim();
            if (!raw) {
                showToast("Please enter an API URL");
                return;
            }
            const clean = raw.replace(/\/$/, "");
            API_BASE = clean;
            localStorage.setItem("mysearch_api_base", clean);
            showToast("API Base set to: " + clean);
            await checkApiHealth(clean);
            refreshBookmarksData();
            loadDomainRules();
            loadBangs();
        };
    }

    if (autoDetectApiBtn) {
        autoDetectApiBtn.onclick = async () => {
            localStorage.removeItem("mysearch_api_base");
            API_BASE = resolveApiBase();
            apiEndpointInput.value = API_BASE;
            showToast("Auto-detected: " + API_BASE);
            await checkApiHealth(API_BASE);
            refreshBookmarksData();
            loadDomainRules();
            loadBangs();
        };
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    loadHistory();
    refreshBookmarksData();
    loadDomainRules();
    loadVaultDocuments();
    renderSpeedDials();
    loadBangs();
    initBangsAutocomplete();
    initApiEndpointSettings();

    // OpenSearch & URL Query Auto-Search Handler
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const initialQuery = urlParams.get("q");
        if (initialQuery && initialQuery.trim()) {
            searchInput.value = initialQuery.trim();
            performSearch(initialQuery.trim());
        }
    } catch(e) {}
});


