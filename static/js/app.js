/**
 * imaginalOS - Core Application Orchestrator
 */
(function() {
    window.imaginalOS = window.imaginalOS || {};

    function updateFavicon() {
        const emoji = pickFaviconEmoji();
        const link = document.querySelector("link[rel~='icon']");
        const href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`;

        if (link) {
            link.href = href;
            return;
        }

        const newLink = document.createElement('link');
        newLink.type = 'image/svg+xml';
        newLink.rel = 'icon';
        newLink.href = href;
        document.head.appendChild(newLink);
    }

    function pickFaviconEmoji() {
        const ref = document.referrer.toLowerCase();

        if (ref.includes('github.com')) {
            return '🐱';
        }
        if (ref.includes('t.me') || ref.includes('telegram')) {
            return '✈️';
        }
        if (ref.includes('google.') || ref.includes('yandex.') || ref.includes('bing.') || ref.includes('yahoo.')) {
            return '🔍';
        }

        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('firefox')) {
            return '🦊';
        }
        if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android')) {
            return '🍎';
        }
        if (ua.includes('opera') || ua.includes('opr')) {
            return '⭕';
        }
        if (ua.includes('edg')) {
            return '🌊';
        }
        if (ua.includes('chrome') && !ua.includes('edg') && !ua.includes('opr')) {
            return '🌐';
        }
        return '💻';
    }

    function tick() {
        const now = new Date();
        const hour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

        if (window.imaginalOS.updateSkyAndStars) window.imaginalOS.updateSkyAndStars(hour);
        if (window.imaginalOS.updateCelestial) window.imaginalOS.updateCelestial(hour);
    }

    let terminalLoaded = false;
    let terminalLoadPromise = null;

    const MODULES = {
        sound: '/static/js/sound.js',
        data: '/static/js/commands_data.js',
        vfs: '/static/js/vfs.js',
        commands: '/static/js/commands.js',
        terminal: '/static/js/terminal.js',
        vim: '/static/js/vim.js',
        spacerock: '/static/js/spacerock.js'
    };

    const TERMINAL_BOOT = ['sound', 'data', 'vfs', 'commands', 'terminal'];

    function loadModule(name) {
        const src = MODULES[name];
        if (!src) {
            return Promise.reject(new Error('Unknown module: ' + name));
        }
        if (typeof window.imaginalOS.loadScript !== 'function') {
            return Promise.reject(new Error(reportStaleCore()));
        }
        return window.imaginalOS.loadScript(src);
    }

    function reportStaleCore() {
        const message = 'imaginalOS: core.js is an older cached copy without the module loader. Hard-reload (Ctrl+Shift+R) to fetch it.';
        console.error('%c' + message, 'color: #ff5555; font-weight: bold;');
        return message;
    }
    window.imaginalOS.loadModule = loadModule;
    window.imaginalOS.MODULES = MODULES;

    async function loadTerminalScripts() {

        await window.imaginalOS.VERSION_READY;
        for (const name of TERMINAL_BOOT) {
            await loadModule(name);
        }
    }

    function loadTerminal() {
        if (terminalLoaded) return Promise.resolve(true);
        if (terminalLoadPromise) return terminalLoadPromise;

        terminalLoadPromise = loadTerminalScripts()
            .then(() => {
                terminalLoaded = true;
                return true;
            })
            .catch((err) => {
                console.error('Failed to load terminal subsystem:', err);

                terminalLoadPromise = null;
                return false;
            });

        return terminalLoadPromise;
    }
    window.imaginalOS.loadTerminal = loadTerminal;

    window.addEventListener('keydown', async (e) => {
        if (terminalLoaded) return;

        if (e.key === '`') {
            e.preventDefault();
            if (window.imaginalOS.onTerminalOpen) {
                window.imaginalOS.onTerminalOpen();
            }
            const success = await loadTerminal();
            if (success && window.toggleTerminal) {
                window.toggleTerminal();
            }
        }
    });

    function showAmbientError(code = '404') {
        document.title = `${code}: Lost in Space`;

        const codeDisplay = document.createElement('div');
        codeDisplay.className = 'ambient-error-code';
        codeDisplay.innerText = code;
        document.body.appendChild(codeDisplay);

        const particleCount = 15;
        const particles = [];
        for (let i = 0; i < particleCount; i++) {
            const el = document.createElement('div');
            el.className = 'floating-error-particle';
            el.innerText = code;
            const scale = 0.6 + Math.random() * 1.4;
            const opacity = 0.05 + Math.random() * 0.18;
            el.style.fontSize = `${scale}rem`;
            el.style.color = `rgba(255, 85, 85, ${opacity})`;
            document.body.appendChild(el);
            particles.push({
                el,
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 1.2,
                vy: (Math.random() - 0.5) * 1.2
            });
        }

        function animate() {
            const w = window.innerWidth;
            const h = window.innerHeight;

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < -60) p.x = w + 60;
                if (p.x > w + 60) p.x = -60;
                if (p.y < -60) p.y = h + 60;
                if (p.y > h + 60) p.y = -60;
                p.el.style.left = `${p.x}px`;
                p.el.style.top = `${p.y}px`;
            });
            requestAnimationFrame(animate);
        }
        animate();
    }

    const SUBSYSTEMS = ['initTelemetry', 'initWeatherCanvas', 'initCurious'];

    const INTENT_EVENTS = ['pointerdown', 'keydown', 'touchstart'];

    function installIntentTrigger() {
        const onIntent = () => {
            INTENT_EVENTS.forEach(type => window.removeEventListener(type, onIntent));
            if (window.imaginalOS.ensureGeo) {
                window.imaginalOS.ensureGeo();
            }
        };
        INTENT_EVENTS.forEach(type => window.addEventListener(type, onIntent, { once: true, passive: true }));
    }

    function initSubsystem(name) {
        const init = window.imaginalOS[name];
        if (typeof init !== 'function') return;
        try {
            init();
        } catch (err) {

            console.error(`imaginalOS: ${name} failed to start`, err);
        }
    }

    function detectErrorCode() {
        const ERROR_CODES = /\b(404|418|500|502|503|504)\b/;
        const path = window.location.pathname;

        const pathMatch = path.match(ERROR_CODES);
        if (pathMatch) return pathMatch[1];

        const queryMatch = window.location.search.match(ERROR_CODES);
        if (queryMatch) return queryMatch[1];

        const isRootDocument = path === '/' || path === '/index.html';
        const looksLikeAsset = /\.[^/]+$/.test(path);
        return (!isRootDocument && !looksLikeAsset) ? '404' : '';
    }

    window.addEventListener('DOMContentLoaded', () => {
        SUBSYSTEMS.forEach(initSubsystem);
        installIntentTrigger();

        updateFavicon();
        tick();
        setInterval(tick, 15000);

        console.log("%c=== ImaginalOS Console ===", "color: #27ae60; font-weight: bold; font-size: 14px;");
        console.log("%cLost something?\nThe environment is reacting to your presence.", "color: #7f8c8d;");
        console.log("%cPress the backtick key (`) to open the control terminal.", "color: #e67e22; font-style: italic;");

        const errorCode = detectErrorCode();
        if (errorCode) {
            showAmbientError(errorCode);
        }
    });
})();
