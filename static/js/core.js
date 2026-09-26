/**
 * imaginalOS - Core Module
 * Shared primitives every other module depends on: the version banner, HTML
 * escaping, and the single-flight script loader. Loaded first so the rest of
 * the system never has to guess.
 */
(function() {
    window.imaginalOS = window.imaginalOS || {};

    const FALLBACK_VERSION = '0.9.1';

    window.imaginalOS.VERSION = FALLBACK_VERSION;

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

    const cspViolations = [];

    window.addEventListener('securitypolicyviolation', (event) => {
        const record = {
            directive: event.effectiveDirective || event.violatedDirective || 'unknown',
            blocked: event.blockedURI || 'inline',
            source: event.sourceFile || '',
            sample: (event.sample || '').slice(0, 200)
        };
        const key = record.directive + '|' + record.blocked + '|' + record.sample;
        if (!cspViolations.some((v) => v.key === key)) {
            record.key = key;
            cspViolations.push(record);
        }
    });

    window.imaginalOS.cspReport = function() {
        if (cspViolations.length === 0) {
            console.log('%c[imaginalOS] No CSP violations were recorded on this page.', 'color: #27ae60');
            return cspViolations;
        }

        console.group('%c[imaginalOS] ' + cspViolations.length + ' blocked resource(s)', 'color: #e67e22; font-weight: bold');
        cspViolations.forEach((v, i) => {
            console.log('%d. %s blocked "%s"', i + 1, v.directive, v.blocked);
            if (v.source) console.log('     came from: ' + v.source);
            if (v.sample) console.log('     code: ' + v.sample);
        });
        console.log('%cIf the source is an extension or a bookmarklet, it is not the site: nothing in this project uses inline scripts.', 'color: #8892b0');
        console.groupEnd();
        return cspViolations;
    };

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
