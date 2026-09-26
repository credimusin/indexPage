/**
 * imaginalOS - Core Module
 * Shared primitives every other module depends on: the version banner, HTML
 * escaping, and the single-flight script loader. Loaded first so the rest of
 * the system never has to guess.
 */
(function() {
    window.imaginalOS = window.imaginalOS || {};

    const FALLBACK_VERSION = '0.9.1';

    // Exposed synchronously so no module ever has to read a half-loaded value.
    window.imaginalOS.VERSION = FALLBACK_VERSION;

    // Deferred subsystems must await this before snapshotting the version.
    window.imaginalOS.VERSION_READY = (async () => {
        try {
            const res = await fetch('/package.json');
            if (res.ok) {
                const pkg = await res.json();
                if (pkg && pkg.version) {
                    window.imaginalOS.VERSION = pkg.version;
                }
            }
        } catch {}
        return window.imaginalOS.VERSION;
    })();

    window.imaginalOS.escapeHtml = function(text) {
        if (typeof text !== 'string') return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // Single-flight <script> injector. Concurrent callers share one request,
    // and a failed load is forgotten so a later attempt can retry.
    //
    // The URL carries the version so a browser that cached a previous copy of
    // a terminal module cannot end up mixing old and new files in one session:
    // without it, a cached pre-refactor commands.js would pair with a fresh
    // app.js and half the commands would quietly stop working.
    const scriptLoads = new Map();

    window.imaginalOS.loadScript = function(src) {
        if (scriptLoads.has(src)) {
            return scriptLoads.get(src);
        }

        const versioned = src + (src.includes('?') ? '&' : '?') + 'v=' + window.imaginalOS.VERSION;

        const pending = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = versioned;
            script.async = false;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load ' + src));
            document.body.appendChild(script);
        }).catch((err) => {
            scriptLoads.delete(src);
            throw err;
        });

        scriptLoads.set(src, pending);
        return pending;
    };
})();
