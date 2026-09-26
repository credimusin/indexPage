/**
 * imaginalOS - Core Module
 * Shared primitives every other module depends on: the version banner and
 * HTML escaping. Loaded first so the rest of the system never has to guess.
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
})();
