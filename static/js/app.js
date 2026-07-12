/**
 * imaginalOS - Core Application Orchestrator
 */
(function() {
    window.imaginalOS = window.imaginalOS || {};
    fetch('/package.json')
        .then(res => res.json())
        .then(pkg => {
            window.imaginalOS.VERSION = pkg.version;
        })
        .catch(() => {
            window.imaginalOS.VERSION = '0.9.1';
        });

    function updateFavicon() {
        let emoji = '💻';
        const ref = document.referrer.toLowerCase();
        
        if (ref.includes('github.com')) {
            emoji = '🐱';
        } else if (ref.includes('t.me') || ref.includes('telegram')) {
            emoji = '✈️';
        } else if (ref.includes('google.') || ref.includes('yandex.') || ref.includes('bing.') || ref.includes('yahoo.')) {
            emoji = '🔍';
        } else {
            const ua = navigator.userAgent.toLowerCase();
            if (ua.includes('firefox')) {
                emoji = '🦊';
            } else if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android')) {
                emoji = '🍎';
            } else if (ua.includes('opera') || ua.includes('opr')) {
                emoji = '⭕';
            } else if (ua.includes('edg')) {
                emoji = '🌊';
            } else if (ua.includes('chrome') && !ua.includes('edg') && !ua.includes('opr')) {
                emoji = '🌐';
            }
        }

        const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
        link.type = 'image/svg+xml';
        link.rel = 'icon';
        link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`;
        document.getElementsByTagName('head')[0].appendChild(link);
    }

    function tick() {
        const now = new Date();
        const hour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
        
        if (window.updateSkyAndStars) window.updateSkyAndStars(hour);
        if (window.updateCelestial) window.updateCelestial(hour);
    }

    let terminalLoaded = false;
    let loadingTerminal = false;

    async function loadTerminal() {
        if (terminalLoaded) return true;
        if (loadingTerminal) return false;
        loadingTerminal = true;

        const scripts = [
            '/static/js/sound.js',
            '/static/js/commands_data.js',
            '/static/js/vfs.js',
            '/static/js/vim.js',
            '/static/js/spacerock.js',
            '/static/js/commands.js',
            '/static/js/terminal.js'
        ];

        try {
            for (const src of scripts) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = src;
                    script.async = false;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });
            }
            terminalLoaded = true;
            loadingTerminal = false;
            return true;
        } catch (err) {
            console.error('Failed to load terminal subsystem:', err);
            loadingTerminal = false;
            return false;
        }
    }

    window.addEventListener('keydown', async (e) => {
        if (terminalLoaded) return;
        
        if (e.key === '`') {
            e.preventDefault();
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

    window.addEventListener('DOMContentLoaded', () => {
        // Initialize subsystems sequentially
        if (window.imaginalOS && window.imaginalOS.initTooltip) {
            window.imaginalOS.initTooltip();
        }
        if (window.imaginalOS && window.imaginalOS.initTelemetry) {
            window.imaginalOS.initTelemetry();
        }
        if (window.imaginalOS && window.imaginalOS.initWeatherCanvas) {
            window.imaginalOS.initWeatherCanvas();
        }

        updateFavicon();
        tick();
        setInterval(tick, 15000);
        
        console.log("%c=== ImaginalOS Console ===", "color: #27ae60; font-weight: bold; font-size: 14px;");
        console.log("%cLost something?\nThe environment is reacting to your presence.", "color: #7f8c8d;");
        console.log("%cPress the backtick key (`) to open the control terminal.", "color: #e67e22; font-style: italic;");

        const path = window.location.pathname;
        let errorCode = '';
        const pathMatch = path.match(/\b(404|418|500|502|503|504)\b/);
        const queryMatch = window.location.search.match(/\b(404|418|500|502|503|504)\b/);

        if (pathMatch) {
            errorCode = pathMatch[1];
        } else if (queryMatch) {
            errorCode = queryMatch[1];
        } else if (path !== '/' && path !== '/index.html' && !path.startsWith('/static/') && !path.startsWith('/functions/') && path !== '/package.json') {
            errorCode = '404';
        }

        if (errorCode) {
            showAmbientError(errorCode);
        }
    });
})();
