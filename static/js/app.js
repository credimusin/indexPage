/**
 * imaginalOS - Core Application Orchestrator
 */
(function() {
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

        const version = window.imaginalOS.VERSION || '0.9.1';
        const scripts = [
            `static/js/sound.js?v=${version}`,
            `static/js/commands_data.js?v=${version}`,
            `static/js/vfs.js?v=${version}`,
            `static/js/vim.js?v=${version}`,
            `static/js/commands.js?v=${version}`,
            `static/js/terminal.js?v=${version}`
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
    });
})();
