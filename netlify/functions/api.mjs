const SEARXNG_URL = process.env.SEARXNG_URL || "https://my-searxng-gf7s.onrender.com";

const SEEDED_BANGS = [
    { trigger: "!gh", name: "GitHub", target_url: "https://github.com/search?q={q}", category: "code" },
    { trigger: "!yt", name: "YouTube", target_url: "https://www.youtube.com/results?search_query={q}", category: "media" },
    { trigger: "!w", name: "Wikipedia", target_url: "https://en.wikipedia.org/wiki/Special:Search?search={q}", category: "general" },
    { trigger: "!arxiv", name: "arXiv", target_url: "https://arxiv.org/search/?query={q}&searchtype=all", category: "academic" },
    { trigger: "!so", name: "Stack Overflow", target_url: "https://stackoverflow.com/search?q={q}", category: "code" },
    { trigger: "!r", name: "Reddit", target_url: "https://www.reddit.com/search/?q={q}", category: "general" },
    { trigger: "!g", name: "Google", target_url: "https://www.google.com/search?q={q}", category: "general" },
    { trigger: "!maps", name: "Google Maps", target_url: "https://www.google.com/maps/search/{q}", category: "maps" },
    { trigger: "!ddg", name: "DuckDuckGo", target_url: "https://duckduckgo.com/?q={q}", category: "general" },
    { trigger: "!mdn", name: "MDN Web Docs", target_url: "https://developer.mozilla.org/en-US/search?q={q}", category: "code" },
    { trigger: "!pypi", name: "PyPI", target_url: "https://pypi.org/search/?q={q}", category: "code" },
    { trigger: "!v", name: "Vimeo", target_url: "https://vimeo.com/search?q={q}", category: "media" },
    { trigger: "!ece", name: "ECE Workstation", target_url: "#ece", category: "tools" }
];

function detectInstantAnswer(q) {
    const trimmed = q.trim();
    
    // Ohm's law: "ohm 5 10"
    const ohmMatch = trimmed.match(/^ohm\s+([0-9.]+)\s+([0-9.]+)/i);
    if (ohmMatch) {
        const v = parseFloat(ohmMatch[1]);
        const i = parseFloat(ohmMatch[2]);
        const r = i !== 0 ? v / i : 0;
        const p = v * i;
        return {
            type: "ohm",
            title: "Ohm's Law Calculation",
            voltage: `${v} V`,
            current: `${i} A`,
            resistance: `${r.toFixed(2)} Ω`,
            power: `${p.toFixed(2)} W`
        };
    }

    // RC filter: "rc 10k 100n"
    const rcMatch = trimmed.match(/^rc\s+([0-9.]+[kmg]?)\s+([0-9.]+[numfp]?)/i);
    if (rcMatch) {
        const parseUnit = (str) => {
            const m = str.match(/^([0-9.]+)\s*([a-z]?)/i);
            if (!m) return 0;
            const val = parseFloat(m[1]);
            const u = (m[2] || "").toLowerCase();
            const multipliers = { k: 1e3, m: 1e6, g: 1e9, u: 1e-6, n: 1e-9, p: 1e-12, f: 1e-15 };
            return val * (multipliers[u] || 1);
        };
        const r = parseUnit(rcMatch[1]);
        const c = parseUnit(rcMatch[2]);
        if (r > 0 && c > 0) {
            const fc = 1 / (2 * Math.PI * r * c);
            const tau = r * c;
            return {
                type: "rc_filter",
                title: "RC Low-Pass Filter",
                cutoff_frequency: `${fc.toFixed(2)} Hz`,
                time_constant: `${(tau * 1000).toFixed(3)} ms`,
                resistance: `${rcMatch[1]}Ω`,
                capacitance: `${rcMatch[2]}F`
            };
        }
    }

    // Base conversion: "hex FF" or "0xFF"
    const hexMatch = trimmed.match(/^(?:hex\s+|0x)([0-9a-f]+)$/i);
    if (hexMatch) {
        const dec = parseInt(hexMatch[1], 16);
        return {
            type: "base_converter",
            title: "Base Radix Conversion",
            decimal: dec.toString(10),
            hexadecimal: "0x" + dec.toString(16).toUpperCase(),
            binary: "0b" + dec.toString(2),
            octal: "0o" + dec.toString(8)
        };
    }

    // Simple math evaluator: e.g. "2 + 2", "100 * 4"
    if (/^[0-9.\s+\-*/()^%]+$/.test(trimmed) && /[+\-*/^%]/.test(trimmed)) {
        try {
            const sanitized = trimmed.replace(/\^/g, "**");
            const res = Function(`"use strict"; return (${sanitized})`)();
            if (typeof res === "number" && !isNaN(res)) {
                return {
                    type: "math",
                    title: "Math Expression",
                    expression: trimmed,
                    result: res.toString()
                };
            }
        } catch(e) {}
    }

    return null;
}

export default async (req, context) => {
    const url = new URL(req.url);
    const pathname = url.pathname;

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Content-Type": "application/json"
    };

    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    // 1. /health
    if (pathname === "/health" || pathname === "/api/health") {
        return new Response(JSON.stringify({
            status: "ok",
            service: "mysearch-api-netlify",
            version: "0.7.0"
        }), { headers: corsHeaders });
    }

    // 2. /api/bangs
    if (pathname === "/api/bangs") {
        return new Response(JSON.stringify(SEEDED_BANGS), { headers: corsHeaders });
    }

    // 3. /api/search
    if (pathname === "/api/search") {
        const q = (url.searchParams.get("q") || "").trim();
        const category = url.searchParams.get("category") || "general";

        if (!q) {
            return new Response(JSON.stringify({
                query: "",
                category: "general",
                results: []
            }), { headers: corsHeaders });
        }

        // Check bang redirects
        for (const b of SEEDED_BANGS) {
            if (q.startsWith(b.trigger + " ") || q === b.trigger) {
                const subQuery = q.slice(b.trigger.length).trim();
                const targetUrl = b.target_url.replace("{q}", encodeURIComponent(subQuery));
                return new Response(JSON.stringify({
                    query: q,
                    redirect_url: targetUrl,
                    bang: b.trigger,
                    results: []
                }), { headers: corsHeaders });
            }
        }

        // Check instant answers
        const instantAnswer = detectInstantAnswer(q);

        // Fetch from SearXNG
        try {
            const searxUrl = `${SEARXNG_URL}/search?q=${encodeURIComponent(q)}&format=json&categories=${encodeURIComponent(category)}`;
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 25000);
            const res = await fetch(searxUrl, { signal: controller.signal });
            clearTimeout(timer);

            if (res.ok) {
                const data = await res.json();
                return new Response(JSON.stringify({
                    query: q,
                    category: category,
                    results: data.results || [],
                    instant_answer: instantAnswer
                }), { headers: corsHeaders });
            }
        } catch (err) {
            console.warn("SearXNG fetch error:", err.message);
        }

        // Return instant answer or empty results on SearXNG timeout
        return new Response(JSON.stringify({
            query: q,
            category: category,
            results: [],
            instant_answer: instantAnswer
        }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders });
};

export const config = {
    path: ["/health", "/api/*"]
};
