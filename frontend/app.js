const API_BASE = "http://127.0.0.1:8000";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const clearButton = document.getElementById("clearButton");

const categories = document.querySelectorAll(".category");

const hero = document.getElementById("hero");
const brandLink = document.getElementById("brandLink");

const resultsContainer = document.getElementById("results");
const state = document.getElementById("state");
const searchMeta = document.getElementById("searchMeta");

let activeCategory = "general";


function setState(type, title, message) {
    state.className = `state ${type || ""}`;

    state.innerHTML = `
        <div class="state-mark">
            ${type === "error" ? "!" : "⌁"}
        </div>

        <h2>${escapeHtml(title)}</h2>

        <p>${escapeHtml(message)}</p>
    `;

    state.classList.remove("hidden");
}


function hideState() {
    state.classList.add("hidden");
}


function setLoading() {
    state.className = "state";

    state.innerHTML = `
        <div class="state-mark">⋯</div>

        <h2>Searching</h2>

        <p>
            Looking across the available search sources.
        </p>
    `;

    state.classList.remove("hidden");
}


function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}


function getHostname(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return "";
    }
}


function formatDate(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}


function getThumbnail(result) {
    return (
        result.thumbnail ||
        result.img_src ||
        result.iframe_src ||
        ""
    );
}


function getResultType(result) {
    if (activeCategory === "images") {
        return "image";
    }

    if (activeCategory === "videos") {
        return "video";
    }

    if (activeCategory === "news") {
        return "news";
    }

    return "general";
}


function createResult(result) {
    const article = document.createElement("article");

    const type = getResultType(result);
    const thumbnail = getThumbnail(result);

    article.className = "result";

    if (
        (type === "image" || type === "video") &&
        thumbnail
    ) {
        article.classList.add("media-result");
    }

    if (type === "news") {
        article.classList.add("news-result");
    }


    /* Thumbnail */

    if (
        (type === "image" || type === "video") &&
        thumbnail
    ) {
        const image = document.createElement("img");

        image.className = "result-thumbnail";

        image.src = thumbnail;
        image.alt = "";

        image.loading = "lazy";

        image.onerror = () => {
            image.remove();

            article.classList.remove("media-result");
        };

        article.appendChild(image);
    }


    /* Main content */

    const main = document.createElement("div");

    main.className = "result-main";


    /* Header */

    const header = document.createElement("div");

    header.className = "result-header";


    if (result.img_src) {
        const favicon = document.createElement("img");

        favicon.className = "result-favicon";

        favicon.src = result.img_src;
        favicon.alt = "";

        favicon.loading = "lazy";

        favicon.onerror = () => {
            favicon.remove();
        };

        header.appendChild(favicon);
    }


    const source = document.createElement("span");

    source.className = "result-source";

    source.textContent =
        result.engine
            ? cleanEngineName(result.engine)
            : "Web";

    header.appendChild(source);

    main.appendChild(header);


    /* Title */

    const title = document.createElement("h2");

    title.className = "result-title";


    const link = document.createElement("a");

    link.href = result.url || "#";

    link.target = "_blank";

    link.rel = "noopener noreferrer";

    link.textContent =
        result.title || "Untitled result";


    title.appendChild(link);

    main.appendChild(title);


    /* URL */

    const url = document.createElement("div");

    url.className = "result-url";

    url.textContent =
        getHostname(result.url || "");

    main.appendChild(url);


    /* Description */

    const content = document.createElement("p");

    content.className = "result-content";

    content.textContent =
        result.content ||
        "No description was provided for this result.";

    main.appendChild(content);


    /* Date */

    const dateText = formatDate(
        result.publishedDate
    );

    if (dateText) {
        const date = document.createElement("div");

        date.className = "result-date";

        date.textContent = dateText;

        main.appendChild(date);
    }


    article.appendChild(main);

    return article;
}


function cleanEngineName(name) {
    const cleaned = String(name)
        .replace(/\.(videos|news|images)$/i, "")
        .replace(/_/g, " ");

    return cleaned
        .split(" ")
        .map((word) => {
            if (!word) {
                return word;
            }

            return (
                word.charAt(0).toUpperCase() +
                word.slice(1).toLowerCase()
            );
        })
        .join(" ");
}


async function performSearch(query) {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
        hero.classList.remove("compact");

        setState(
            "",
            "Start with a search",
            "Search websites, news, images and videos from one place."
        );

        resultsContainer.innerHTML = "";

        searchMeta.classList.add("hidden");

        return;
    }


    hero.classList.add("compact");

    setLoading();

    resultsContainer.innerHTML = "";

    searchMeta.classList.add("hidden");


    try {
        const params = new URLSearchParams({
            q: cleanQuery,
            category: activeCategory,
        });


        const response = await fetch(
            `${API_BASE}/api/search?${params.toString()}`
        );


        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error(
                "The search service returned an invalid response."
            );
        }


        if (!response.ok) {
            throw new Error(
                data.detail ||
                "Search request failed."
            );
        }


        const results = Array.isArray(data.results)
            ? data.results
            : [];


        hideState();


        searchMeta.textContent =
            `${results.length} result` +
            `${results.length === 1 ? "" : "s"}` +
            ` · ${categoryLabel(activeCategory)}`;


        searchMeta.classList.remove("hidden");


        if (results.length === 0) {
            setState(
                "",
                "No results found",
                "Try another search or choose a different category."
            );

            return;
        }


        const fragment =
            document.createDocumentFragment();


        results.forEach((result) => {
            fragment.appendChild(
                createResult(result)
            );
        });


        resultsContainer.appendChild(
            fragment
        );


        document.querySelector(".search-area")
            .scrollIntoView({
                behavior: "smooth",
                block: "start",
            });


    } catch (error) {

        console.error(error);

        setState(
            "error",
            "Search unavailable",
            error.message ||
            "We couldn't reach the search service."
        );
    }
}


function categoryLabel(category) {
    const labels = {
        general: "Web",
        images: "Images",
        news: "News",
        videos: "Videos",
    };

    return labels[category] || "Web";
}


/* Search */

searchForm.addEventListener(
    "submit",
    (event) => {
        event.preventDefault();

        performSearch(searchInput.value);
    }
);


/* Input */

searchInput.addEventListener(
    "input",
    () => {
        clearButton.classList.toggle(
            "hidden",
            searchInput.value.length === 0
        );
    }
);


/* Clear */

clearButton.addEventListener(
    "click",
    () => {

        searchInput.value = "";

        clearButton.classList.add("hidden");

        searchInput.focus();

        hero.classList.remove("compact");

        resultsContainer.innerHTML = "";

        searchMeta.classList.add("hidden");

        setState(
            "",
            "Start with a search",
            "Search websites, news, images and videos from one place."
        );
    }
);


/* Category */

categories.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                categories.forEach(
                    (item) => {
                        item.classList.remove(
                            "active"
                        );
                    }
                );


                button.classList.add(
                    "active"
                );


                activeCategory =
                    button.dataset.category;


                if (
                    searchInput.value.trim()
                ) {
                    performSearch(
                        searchInput.value
                    );
                }
            }
        );
    }
);


/* Home */

brandLink.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        searchInput.value = "";

        clearButton.classList.add("hidden");

        hero.classList.remove("compact");

        resultsContainer.innerHTML = "";

        searchMeta.classList.add("hidden");

        setState(
            "",
            "Start with a search",
            "Search websites, news, images and videos from one place."
        );

        searchInput.focus();
    }
);


/* "/" shortcut */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "/" &&
            document.activeElement !== searchInput
        ) {
            event.preventDefault();

            searchInput.focus();
        }


        if (
            event.key === "Escape" &&
            document.activeElement === searchInput
        ) {
            searchInput.value = "";

            clearButton.classList.add("hidden");
        }
    }
);