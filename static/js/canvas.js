/**
 * imaginalOS - Canvas Background Particle and Celestial Observatories Module
 */
(function() {
    let canvas, ctx;
    let particles = [];
    let currentSeason = 'summer'; // 'spring', 'summer', 'autumn', 'winter'
    let currentWeather = 'clear'; // 'clear', 'clouds', 'rain', 'snow', 'storm'
    window.windVector = { x: 1.0, y: 0.0 };

    const CONSTELLATIONS = [
        {
            name: "Ursa Major",
            cx: 30, cy: 20,
            stars: [
                { dx: -0.18, dy: 0.12 },
                { dx: -0.10, dy: 0.08 },
                { dx: -0.04, dy: 0.05 },
                { dx: 0.03, dy: -0.01 },
                { dx: 0.02, dy: 0.12 },
                { dx: 0.14, dy: 0.10 },
                { dx: 0.15, dy: -0.07 }
            ]
        },
        {
            name: "Cassiopeia",
            cx: 65, cy: 18,
            stars: [
                { dx: -0.15, dy: -0.05 },
                { dx: -0.08, dy: 0.06 },
                { dx: 0.0, dy: -0.06 },
                { dx: 0.07, dy: 0.07 },
                { dx: 0.15, dy: -0.04 }
            ]
        },
        {
            name: "Orion",
            cx: 48, cy: 25,
            stars: [
                { dx: -0.08, dy: -0.12 },
                { dx: 0.07, dy: -0.11 },
                { dx: -0.01, dy: -0.16 },
                { dx: -0.03, dy: 0.0 },
                { dx: -0.01, dy: 0.0 },
                { dx: 0.01, dy: 0.0 },
                { dx: 0.06, dy: 0.12 },
                { dx: -0.07, dy: 0.11 }
            ]
        },
        {
            name: "Ursa Minor",
            cx: 20, cy: 15,
            stars: [
                { dx: -0.12, dy: -0.08 },
                { dx: -0.09, dy: -0.03 },
                { dx: -0.08, dy: 0.02 },
                { dx: -0.02, dy: 0.08 },
                { dx: 0.01, dy: 0.05 },
                { dx: -0.03, dy: -0.01 },
                { dx: -0.06, dy: -0.02 }
            ]
        },
        {
            name: "Cygnus",
            cx: 78, cy: 22,
            stars: [
                { dx: -0.1, dy: -0.1 },
                { dx: 0.0, dy: 0.0 },
                { dx: 0.1, dy: 0.1 },
                { dx: -0.08, dy: 0.04 },
                { dx: -0.16, dy: 0.08 },
                { dx: 0.08, dy: -0.04 },
                { dx: 0.16, dy: -0.08 }
            ]
        },
        {
            name: "Leo",
            cx: 35, cy: 28,
            stars: [
                { dx: -0.08, dy: 0.07 },
                { dx: -0.05, dy: -0.05 },
                { dx: -0.07, dy: -0.12 },
                { dx: -0.13, dy: -0.15 },
                { dx: -0.18, dy: -0.11 },
                { dx: -0.11, dy: -0.01 },
                { dx: 0.08, dy: 0.01 },
                { dx: 0.06, dy: 0.09 },
                { dx: 0.18, dy: 0.05 }
            ]
        },
        {
            name: "Taurus",
            cx: 15, cy: 25,
            stars: [
                { dx: -0.03, dy: 0.03 },
                { dx: -0.14, dy: -0.02 },
                { dx: -0.09, dy: -0.07 },
                { dx: -0.08, dy: 0.01 },
                { dx: -0.11, dy: -0.03 },
                { dx: 0.12, dy: -0.15 },
                { dx: 0.15, dy: -0.02 },
                { dx: -0.22, dy: -0.12 },
                { dx: -0.20, dy: -0.11 },
                { dx: -0.24, dy: -0.13 },
                { dx: -0.23, dy: -0.14 },
                { dx: -0.22, dy: -0.10 }
            ]
        },
        {
            name: "Gemini",
            cx: 58, cy: 15,
            stars: [
                { dx: -0.02, dy: -0.13 },
                { dx: -0.08, dy: -0.12 },
                { dx: -0.07, dy: 0.01 },
                { dx: -0.11, dy: -0.02 },
                { dx: -0.05, dy: 0.15 },
                { dx: -0.14, dy: 0.08 },
                { dx: -0.17, dy: 0.12 },
                { dx: -0.01, dy: 0.08 }
            ]
        },
        {
            name: "Pegasus",
            cx: 82, cy: 16,
            stars: [
                { dx: -0.1, dy: 0.1 },
                { dx: -0.1, dy: -0.1 },
                { dx: 0.1, dy: 0.1 },
                { dx: 0.1, dy: -0.1 },
                { dx: -0.22, dy: 0.08 },
                { dx: -0.20, dy: 0.18 },
                { dx: -0.28, dy: 0.22 },
                { dx: -0.15, dy: -0.18 },
                { dx: -0.20, dy: -0.24 }
            ]
        },
        {
            name: "Scorpius",
            cx: 72, cy: 30,
            stars: [
                { dx: 0.0, dy: -0.02 },
                { dx: -0.09, dy: -0.11 },
                { dx: -0.12, dy: -0.15 },
                { dx: -0.11, dy: -0.07 },
                { dx: -0.04, dy: -0.06 },
                { dx: 0.02, dy: 0.05 },
                { dx: 0.04, dy: 0.12 },
                { dx: 0.08, dy: 0.22 },
                { dx: 0.14, dy: 0.18 },
                { dx: 0.12, dy: 0.20 }
            ]
        },
        {
            name: "Crux",
            cx: 88, cy: 27,
            stars: [
                { dx: 0.0, dy: 0.12 },
                { dx: 0.0, dy: -0.12 },
                { dx: -0.08, dy: 0.02 },
                { dx: 0.08, dy: -0.02 },
                { dx: 0.03, dy: 0.03 }
            ]
        }
    ];

    let activeConstellation = null;
    let constellationState = 'off'; // 'fade-in', 'visible', 'fade-out', 'off'
    let constellationAlpha = 0;
    let constellationTimer = 0;
    let nextConstellationTime = Date.now() + 6000;

    let shootingStars = [];
    let cloudsArray = [];

    const EASTER_EGG_SHAPES = [
        {
            name: "Cosmic Cat",
            puffs: [
                { dx: 0, dy: -0.1, r: 0.45 },
                { dx: -0.22, dy: -0.4, r: 0.18 },
                { dx: 0.22, dy: -0.4, r: 0.18 },
                { dx: -0.35, dy: 0.2, r: 0.35 },
                { dx: 0.0, dy: 0.25, r: 0.4 },
                { dx: 0.35, dy: 0.2, r: 0.35 },
                { dx: 0.6, dy: 0.1, r: 0.2 }
            ]
        },
        {
            name: "Celestial Fish",
            puffs: [
                { dx: 0, dy: 0, r: 0.5 },
                { dx: 0.35, dy: 0, r: 0.25 },
                { dx: -0.45, dy: -0.25, r: 0.25 },
                { dx: -0.45, dy: 0.25, r: 0.25 },
                { dx: -0.15, dy: -0.35, r: 0.18 },
                { dx: -0.15, dy: 0.35, r: 0.18 }
            ]
        },
        {
            name: "Space Duck",
            puffs: [
                { dx: 0, dy: 0.15, r: 0.48 },
                { dx: 0.3, dy: -0.25, r: 0.32 },
                { dx: 0.52, dy: -0.25, r: 0.18 },
                { dx: -0.38, dy: -0.05, r: 0.28 },
                { dx: -0.05, dy: 0.0, r: 0.25 }
            ]
        },
        {
            name: "BeeMO",
            puffs: [
                { dx: 0, dy: -0.22, r: 0.35 },
                { dx: -0.22, dy: 0.12, r: 0.28 },
                { dx: 0.22, dy: 0.12, r: 0.28 },
                { dx: -0.22, dy: 0.4, r: 0.28 },
                { dx: 0.22, dy: 0.4, r: 0.28 },
                { dx: -0.15, dy: 0.65, r: 0.18 },
                { dx: 0.15, dy: 0.65, r: 0.18 }
            ]
        },
        {
            name: "Space Whale",
            puffs: [
                { dx: 0, dy: 0, r: 0.45 },
                { dx: -0.3, dy: 0.05, r: 0.38 },
                { dx: -0.6, dy: 0.1, r: 0.28 },
                { dx: -0.8, dy: 0.2, r: 0.22 },
                { dx: -0.8, dy: 0.0, r: 0.22 },
                { dx: 0.3, dy: -0.05, r: 0.35 },
                { dx: 0.1, dy: 0.35, r: 0.2 },
                { dx: -0.15, dy: -0.3, r: 0.18 }
            ]
        },
        {
            name: "Starry UFO",
            puffs: [
                { dx: 0, dy: 0.1, r: 0.3 },
                { dx: -0.3, dy: 0.12, r: 0.25 },
                { dx: -0.55, dy: 0.15, r: 0.18 },
                { dx: 0.3, dy: 0.12, r: 0.25 },
                { dx: 0.55, dy: 0.15, r: 0.18 },
                { dx: 0, dy: -0.15, r: 0.28 },
                { dx: -0.12, dy: -0.08, r: 0.15 },
                { dx: 0.12, dy: -0.08, r: 0.15 }
            ]
        },
        {
            name: "Stellar Heart",
            puffs: [
                { dx: -0.18, dy: -0.18, r: 0.35 },
                { dx: 0.18, dy: -0.18, r: 0.35 },
                { dx: 0, dy: -0.08, r: 0.32 },
                { dx: -0.22, dy: 0.08, r: 0.3 },
                { dx: 0.22, dy: 0.08, r: 0.3 },
                { dx: 0, dy: 0.32, r: 0.25 },
                { dx: 0, dy: 0.52, r: 0.15 }
            ]
        },
        {
            name: "Retro Rocket",
            puffs: [
                { dx: -0.3, dy: 0.3, r: 0.25 },
                { dx: -0.15, dy: 0.15, r: 0.32 },
                { dx: 0, dy: 0, r: 0.35 },
                { dx: 0.18, dy: -0.18, r: 0.3 },
                { dx: 0.32, dy: -0.32, r: 0.22 },
                { dx: -0.35, dy: 0.08, r: 0.2 },
                { dx: -0.08, dy: 0.35, r: 0.2 }
            ]
        },
        {
            name: "Cosmic Teapot",
            puffs: [
                { dx: 0, dy: 0.1, r: 0.4 },
                { dx: -0.2, dy: 0.05, r: 0.35 },
                { dx: 0.2, dy: 0.05, r: 0.35 },
                { dx: 0, dy: -0.25, r: 0.2 },
                { dx: -0.5, dy: -0.1, r: 0.18 },
                { dx: -0.38, dy: 0.1, r: 0.2 },
                { dx: 0.45, dy: -0.15, r: 0.15 },
                { dx: 0.52, dy: 0.05, r: 0.18 },
                { dx: 0.42, dy: 0.22, r: 0.15 }
            ]
        }
    ];

    let waveTime = 0;

    const skyGradients = [
        { hour: 0, colors: ['#010108', '#030310', '#060618'] },
        { hour: 4.5, colors: ['#02020e', '#09041a', '#120626'] },
        { hour: 5.5, colors: ['#0a031a', '#240a2c', '#4d1633'] },
        { hour: 7.0, colors: ['#240a2c', '#631830', '#c0392b'] },
        { hour: 9.0, colors: ['#1a364a', '#2980b9', '#7fb3d5'] },
        { hour: 13.0, colors: ['#154360', '#2471a3', '#aed6f1'] },
        { hour: 17.0, colors: ['#1b2631', '#7b8a97', '#d5dbdb'] },
        { hour: 19.5, colors: ['#17202a', '#5b2c6f', '#ba4a00'] },
        { hour: 20.5, colors: ['#0e1726', '#34495e', '#d35400'] },
        { hour: 22.0, colors: ['#020610', '#0e1424', '#172030'] },
        { hour: 23.5, colors: ['#010208', '#050816', '#090d20'] }
    ];

    function hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    }

    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
    }

    function interpolateColor(color1, color2, factor) {
        const rgb1 = hexToRgb(color1);
        const rgb2 = hexToRgb(color2);
        const r = rgb1.r + factor * (rgb2.r - rgb1.r);
        const g = rgb1.g + factor * (rgb2.g - rgb1.g);
        const b = rgb1.b + factor * (rgb2.b - rgb1.b);
        return rgbToHex(r, g, b);
    }

    window.updateSkyAndStars = function(hour) {
        let currentStop = skyGradients[skyGradients.length - 1];
        let nextStop = skyGradients[0];
        
        for (let i = 0; i < skyGradients.length; i++) {
            if (skyGradients[i].hour <= hour) {
                currentStop = skyGradients[i];
            }
        }
        for (let i = 0; i < skyGradients.length; i++) {
            if (skyGradients[i].hour > hour) {
                nextStop = skyGradients[i];
                break;
            }
        }
        if (nextStop.hour === skyGradients[0].hour) {
            nextStop = skyGradients[0];
        }
        
        let span = nextStop.hour - currentStop.hour;
        if (span < 0) span += 24;
        
        let progress = hour - currentStop.hour;
        if (progress < 0) progress += 24;
        
        const factor = span === 0 ? 0 : progress / span;
        
        const skyTop = interpolateColor(currentStop.colors[0], nextStop.colors[0], factor);
        const skyMid = interpolateColor(currentStop.colors[1], nextStop.colors[1], factor);
        const skyBot = interpolateColor(currentStop.colors[2], nextStop.colors[2], factor);
        
        document.documentElement.style.setProperty('--sky-top', skyTop);
        document.documentElement.style.setProperty('--sky-mid', skyMid);
        document.documentElement.style.setProperty('--sky-bot', skyBot);
        
        let starsOpacity = 0;
        if (hour >= 20.5 || hour < 5.0) {
            starsOpacity = 1;
        } else if (hour >= 18.5 && hour < 20.5) {
            starsOpacity = (hour - 18.5) / 2;
        } else if (hour >= 5.0 && hour < 7.0) {
            starsOpacity = 1 - (hour - 5.0) / 2;
        }
        
        const s1 = document.getElementById('stars');
        const s2 = document.getElementById('stars2');
        const s3 = document.getElementById('stars3');
        if (s1 && s2 && s3) {
            s1.style.opacity = starsOpacity;
            s2.style.opacity = starsOpacity * 0.7;
            s3.style.opacity = starsOpacity * 0.4;
        }
    };

    function getMoonPhase(year, month, day) {
        if (month < 3) {
            year--;
            month += 12;
        }
        month++;
        const c = 365.25 * year;
        const e = 30.6 * month;
        let jd = c + e + day - 694039.09;
        jd /= 29.5305882;
        const b = parseInt(jd);
        jd -= b;
        let phase = Math.round(jd * 8);
        if (phase >= 8) phase = 0;
        return phase;
    }

    const MOON_PHASE_NAMES = [
        "New Moon",
        "Waxing Crescent",
        "First Quarter",
        "Waxing Gibbous",
        "Full Moon",
        "Waning Gibbous",
        "Last Quarter",
        "Waning Crescent"
    ];
    const MOON_PHASE_ILLUM = [0, 25, 50, 75, 100, 75, 50, 25];

    function getMoonSvg(phase) {
        const cx = 45, cy = 45, r = 45;
        let rx = r, sweepOuter = 1, sweepTerminator = 1;
        
        if (phase === 0) {
            return `<svg width="100%" height="100%" viewBox="0 0 90 90">
                <defs><mask id="disk-mask"><circle cx="${cx}" cy="${cy}" r="${r}" fill="white" /></mask></defs>
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="#161e30" stroke="rgba(255,255,255,0.05)" />
                <g mask="url(#disk-mask)" opacity="0.12">
                    <circle cx="32" cy="35" r="4.5" fill="#000" /><circle cx="58" cy="55" r="6" fill="#000" />
                    <circle cx="28" cy="55" r="3" fill="#000" /><circle cx="48" cy="65" r="5" fill="#000" />
                    <circle cx="50" cy="25" r="3.5" fill="#000" />
                </g>
            </svg>`;
        }
        
        switch(phase) {
            case 1: rx = r * 0.55; sweepOuter = 1; sweepTerminator = 1; break;
            case 2: rx = r * 0.25; sweepOuter = 1; sweepTerminator = 0; break;
            case 3: rx = r * 0.5; sweepOuter = 1; sweepTerminator = 0; break;
            case 4: rx = r; sweepOuter = 1; sweepTerminator = 1; break;
            case 5: rx = r * 0.5; sweepOuter = 0; sweepTerminator = 1; break;
            case 6: rx = r * 0.25; sweepOuter = 0; sweepTerminator = 1; break;
            case 7: rx = r * 0.55; sweepOuter = 0; sweepTerminator = 0; break;
        }
        
        const lightPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${sweepOuter} ${cx} ${cy + r} A ${rx} ${r} 0 0 ${sweepTerminator} ${cx} ${cy - r}`;
                           
        return `<svg width="100%" height="100%" viewBox="0 0 90 90">
            <defs>
                <mask id="light-mask"><rect x="0" y="0" width="90" height="90" fill="black" /><path d="${lightPath}" fill="white" /></mask>
                <mask id="disk-mask"><circle cx="${cx}" cy="${cy}" r="${r}" fill="white" /></mask>
            </defs>
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="#161e30" />
            <g mask="url(#disk-mask)" opacity="0.14">
                <circle cx="32" cy="35" r="4.5" fill="#000" /><circle cx="58" cy="55" r="6" fill="#000" />
                <circle cx="28" cy="55" r="3" fill="#000" /><circle cx="48" cy="65" r="5" fill="#000" />
                <circle cx="50" cy="25" r="3.5" fill="#000" /><circle cx="62" cy="35" r="4" fill="#000" />
                <circle cx="38" cy="45" r="3" fill="#000" />
            </g>
            <path d="${lightPath}" fill="#f5f6f8" />
            <g mask="url(#light-mask)" opacity="0.12">
                <circle cx="32" cy="35" r="4.5" fill="#000" /><circle cx="58" cy="55" r="6" fill="#000" />
                <circle cx="28" cy="55" r="3" fill="#000" /><circle cx="48" cy="65" r="5" fill="#000" />
                <circle cx="50" cy="25" r="3.5" fill="#000" /><circle cx="62" cy="35" r="4" fill="#000" />
                <circle cx="38" cy="45" r="3" fill="#000" />
            </g>
        </svg>`;
    }

    function initTooltip() {
        let tooltip = document.getElementById('celestial-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'celestial-tooltip';
            document.body.appendChild(tooltip);
        }
    }

    function updateTooltipText(isDay) {
        const tooltip = document.getElementById('celestial-tooltip');
        if (!tooltip) return;
        
        if (isDay) {
            const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
            const kpVal = (2.5 + 2.0 * Math.sin(dayOfYear * 0.04) + Math.sin(dayOfYear * 0.15)).toFixed(1);
            let desc = "Quiet";
            if (parseFloat(kpVal) > 4.0) desc = "Active (G1)";
            if (parseFloat(kpVal) > 5.5) desc = "Moderate Storm (G2)";
            const windSpeed = Math.floor(380 + 120 * Math.sin(dayOfYear * 0.05));
            
            tooltip.innerHTML = `
                <div class="tooltip-title">☀ SOLAR OBSERVATORY</div>
                <div>Kp-Index: ${kpVal} (${desc})</div>
                <div>Wind Speed: ${windSpeed} km/s</div>
                <div>Flux Level: 145 SFU</div>
            `;
        } else {
            const now = new Date();
            const phase = getMoonPhase(now.getFullYear(), now.getMonth() + 1, now.getDate());
            const name = MOON_PHASE_NAMES[phase];
            const illum = MOON_PHASE_ILLUM[phase];
            tooltip.innerHTML = `
                <div class="tooltip-title">🌙 LUNAR OBSERVATORY</div>
                <div>Phase: ${name}</div>
                <div>Illumination: ${illum}%</div>
                <div>Tidal Pull: ${illum > 80 ? 'Spring' : 'Neap'}</div>
            `;
        }
    }

    window.updateCelestial = function(hour) {
        const mainDiv = document.querySelector('.main');
        if (!mainDiv) return;
        
        let bodyEl = document.querySelector('.celestial');
        if (!bodyEl) {
            bodyEl = document.createElement('div');
            bodyEl.className = 'celestial';
            mainDiv.insertBefore(bodyEl, mainDiv.firstChild);
            
            const tooltip = document.getElementById('celestial-tooltip');
            bodyEl.addEventListener('mouseenter', () => {
                if (tooltip) {
                    const isCurrentDay = bodyEl.classList.contains('sun');
                    updateTooltipText(isCurrentDay);
                    tooltip.classList.add('visible');
                }
            });
            bodyEl.addEventListener('mousemove', (e) => {
                if (tooltip) {
                    tooltip.style.left = (e.clientX + 15) + 'px';
                    tooltip.style.top = (e.clientY + 15) + 'px';
                }
            });
            bodyEl.addEventListener('mouseleave', () => {
                if (tooltip) tooltip.classList.remove('visible');
            });
        }
        
        const startSun = 5.0;
        const endSun = 20.5;
        let isDay = hour >= startSun && hour < endSun;
        let t;
        
        if (isDay) {
            bodyEl.classList.remove('moon');
            bodyEl.classList.add('sun');
            bodyEl.innerHTML = '';
            t = (hour - startSun) / (endSun - startSun);
        } else {
            bodyEl.classList.remove('sun');
            bodyEl.classList.add('moon');
            if (hour >= endSun) {
                t = (hour - endSun) / (24 - endSun + startSun);
            } else {
                t = (hour + (24 - endSun)) / (24 - endSun + startSun);
            }
            const now = new Date();
            const phase = getMoonPhase(now.getFullYear(), now.getMonth() + 1, now.getDate());
            bodyEl.innerHTML = getMoonSvg(phase);
        }
        
        const left = 5 + 90 * t;
        const top = 60 - 45 * Math.sin(Math.PI * t);
        
        bodyEl.style.left = `${left}%`;
        bodyEl.style.top = `${top}vh`;
        bodyEl.style.position = 'absolute';
        bodyEl.style.zIndex = '2';
        
        const oldMoon = document.querySelector('.main > .moon:not(.celestial)');
        if (oldMoon) {
            oldMoon.remove();
        }
    };

    function updateConstellations() {
        const now = Date.now();
        if (constellationState === 'off') {
            if (now > nextConstellationTime) {
                activeConstellation = CONSTELLATIONS[Math.floor(Math.random() * CONSTELLATIONS.length)];
                constellationState = 'fade-in';
                constellationAlpha = 0;
            }
        } else if (constellationState === 'fade-in') {
            constellationAlpha += 0.008;
            if (constellationAlpha >= 1) {
                constellationAlpha = 1;
                constellationState = 'visible';
                constellationTimer = now + 12000;
            }
        } else if (constellationState === 'visible') {
            if (now > constellationTimer) {
                constellationState = 'fade-out';
            }
        } else if (constellationState === 'fade-out') {
            constellationAlpha -= 0.008;
            if (constellationAlpha <= 0) {
                constellationAlpha = 0;
                constellationState = 'off';
                activeConstellation = null;
                nextConstellationTime = now + 20000 + Math.random() * 20000;
            }
        }
    }

    function drawConstellations(maxAlpha) {
        if (!activeConstellation) return;
        ctx.save();
        const currentOpacity = constellationAlpha * maxAlpha;
        const scale = Math.min(canvas.width, canvas.height);
        const cx = (activeConstellation.cx / 100) * canvas.width;
        const cy = (activeConstellation.cy / 100) * canvas.height;
        
        activeConstellation.stars.forEach((star, idx) => {
            const sx = cx + star.dx * scale;
            const sy = cy + star.dy * scale;
            const offset = idx * 1.5;
            const shimmer = 0.5 + 0.8 * Math.sin(Date.now() * 0.0012 + offset);
            const starAlpha = Math.max(0, Math.min(1, shimmer)) * currentOpacity;
            const starRadius = 1.5 + 0.8 * Math.sin(Date.now() * 0.0012 + offset);
            
            if (starAlpha > 0.01) {
                ctx.beginPath();
                ctx.arc(sx, sy, starRadius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha})`;
                ctx.shadowBlur = 5 * starAlpha;
                ctx.shadowColor = '#ffffff';
                ctx.fill();
            }
        });
        ctx.restore();
    }

    function generateNormalCloudPuffs(numPuffs = 6) {
        const puffs = [];
        puffs.push({ dx: 0, dy: 0, r: 0.33 + Math.random() * 0.08 });
        for (let i = 1; i < numPuffs; i++) {
            const angle = (i / (numPuffs - 1)) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            const dist = 0.2 + Math.random() * 0.22;
            puffs.push({
                dx: Math.cos(angle) * dist,
                dy: Math.sin(angle) * dist * 0.45,
                r: 0.18 + Math.random() * 0.12
            });
        }
        return puffs;
    }

    function onWeatherChange(type) {
        cloudsArray.forEach(c => {
            let scaleBase = 110, scaleRange = 90;
            let opacityBase = 0.82, opacityRange = 0.1;
            if (type === 'storm') {
                scaleBase = 180; scaleRange = 120;
                opacityBase = 0.9; opacityRange = 0.1;
            } else if (type === 'rain') {
                scaleBase = 140; scaleRange = 100;
                opacityBase = 0.85; opacityRange = 0.1;
            }
            c.targetScale = scaleBase + Math.random() * scaleRange;
            c.targetOpacity = opacityBase + Math.random() * opacityRange;
        });
    }

    function updateAndDrawClouds(maxAlpha, hour) {
        let desiredClouds = 0;
        let isStorm = (currentWeather === 'storm');
        if (currentWeather === 'clouds') desiredClouds = 12;
        else if (currentWeather === 'rain') desiredClouds = 16;
        else if (currentWeather === 'storm') desiredClouds = 24;
        else if (currentWeather === 'snow') desiredClouds = 10;
        
        if (desiredClouds === 0) {
            cloudsArray.forEach(c => { c.opacity -= 0.008; });
            cloudsArray = cloudsArray.filter(c => c.opacity > 0);
        } else {
            while (cloudsArray.length < desiredClouds) {
                const numPuffs = 5 + Math.floor(Math.random() * 4);
                const puffs = generateNormalCloudPuffs(numPuffs);
                let scaleBase = 110, scaleRange = 90;
                let opacityBase = 0.82, opacityRange = 0.1;
                if (currentWeather === 'storm') {
                    scaleBase = 180; scaleRange = 120;
                    opacityBase = 0.9; opacityRange = 0.1;
                } else if (currentWeather === 'rain') {
                    scaleBase = 140; scaleRange = 100;
                    opacityBase = 0.85; opacityRange = 0.1;
                }
                const targetScale = scaleBase + Math.random() * scaleRange;
                const targetOpacity = opacityBase + Math.random() * opacityRange;

                cloudsArray.push({
                    x: Math.random() * canvas.width * 1.2 - canvas.width * 0.1,
                    y: 30 + Math.random() * 80,
                    scale: targetScale * 0.1,
                    targetScale: targetScale,
                    speed: 0.1 + Math.random() * 0.22,
                    opacity: 0,
                    targetOpacity: targetOpacity,
                    currentPuffs: puffs.map(p => ({ ...p })),
                    targetPuffs: puffs.map(p => ({ ...p })),
                    isEasterEgg: false,
                    easterEggName: "",
                    morphTimer: 0
                });
            }
        }
        
        if (Math.random() < 0.0006 && !cloudsArray.some(c => c.isEasterEgg) && cloudsArray.length > 0) {
            const activeClouds = cloudsArray.filter(c => c.opacity > 0.4);
            if (activeClouds.length > 0) {
                const targetCloud = activeClouds[Math.floor(Math.random() * activeClouds.length)];
                const egg = EASTER_EGG_SHAPES[Math.floor(Math.random() * EASTER_EGG_SHAPES.length)];
                while (targetCloud.currentPuffs.length < egg.puffs.length) {
                    targetCloud.currentPuffs.push({ dx: 0, dy: 0, r: 0.05 });
                }
                if (targetCloud.currentPuffs.length > egg.puffs.length) {
                    targetCloud.currentPuffs = targetCloud.currentPuffs.slice(0, egg.puffs.length);
                }
                targetCloud.targetPuffs = egg.puffs.map(p => ({ ...p }));
                targetCloud.isEasterEgg = true;
                targetCloud.easterEggName = egg.name;
                targetCloud.morphTimer = Date.now() + 25000;
            }
        }
        
        let r = 240, g = 243, b = 244;
        if (isStorm) {
            r = 12; g = 15; b = 22;
        } else {
            if (hour >= 20.5 || hour < 5.0) {
                r = 10; g = 14; b = 24;
            } else if (hour >= 18.5 && hour < 20.5) {
                const t = (hour - 18.5) / 2.0;
                r = Math.round(240 * (1 - t) + 15 * t);
                g = Math.round(147 * (1 - t) + 10 * t);
                b = Math.round(169 * (1 - t) + 20 * t);
            } else if (hour >= 5.0 && hour < 7.0) {
                const t = (hour - 5.0) / 2.0;
                r = Math.round(15 * (1 - t) + 240 * t);
                g = Math.round(10 * (1 - t) + 243 * t);
                b = Math.round(20 * (1 - t) + 244 * t);
            }
        }
        
        ctx.save();
        cloudsArray.forEach(c => {
            c.x += c.speed * window.windVector.x;
            c.y += c.speed * window.windVector.y;
            c.scale += (c.targetScale - c.scale) * 0.015;
            
            if (window.windVector.x >= 0) {
                if (c.x > canvas.width + c.scale) {
                    c.x = -c.scale;
                    c.y = 30 + Math.random() * 80;
                    
                    let scaleBase = 110, scaleRange = 90;
                    let opacityBase = 0.82, opacityRange = 0.1;
                    if (currentWeather === 'storm') {
                        scaleBase = 180; scaleRange = 120;
                        opacityBase = 0.9; opacityRange = 0.1;
                    } else if (currentWeather === 'rain') {
                        scaleBase = 140; scaleRange = 100;
                        opacityBase = 0.85; opacityRange = 0.1;
                    }
                    c.targetScale = scaleBase + Math.random() * scaleRange;
                    c.scale = c.targetScale * 0.1;
                    c.targetOpacity = opacityBase + Math.random() * opacityRange;
                    
                    if (!c.isEasterEgg) {
                        const numPuffs = 5 + Math.floor(Math.random() * 4);
                        const puffs = generateNormalCloudPuffs(numPuffs);
                        c.currentPuffs = puffs.map(p => ({ ...p }));
                        c.targetPuffs = puffs.map(p => ({ ...p }));
                    }
                }
            } else {
                if (c.x < -c.scale) {
                    c.x = canvas.width + c.scale;
                    c.y = 30 + Math.random() * 80;
                    
                    let scaleBase = 110, scaleRange = 90;
                    let opacityBase = 0.82, opacityRange = 0.1;
                    if (currentWeather === 'storm') {
                        scaleBase = 180; scaleRange = 120;
                        opacityBase = 0.9; opacityRange = 0.1;
                    } else if (currentWeather === 'rain') {
                        scaleBase = 140; scaleRange = 100;
                        opacityBase = 0.85; opacityRange = 0.1;
                    }
                    c.targetScale = scaleBase + Math.random() * scaleRange;
                    c.scale = c.targetScale * 0.1;
                    c.targetOpacity = opacityBase + Math.random() * opacityRange;
                    
                    if (!c.isEasterEgg) {
                        const numPuffs = 5 + Math.floor(Math.random() * 4);
                        const puffs = generateNormalCloudPuffs(numPuffs);
                        c.currentPuffs = puffs.map(p => ({ ...p }));
                        c.targetPuffs = puffs.map(p => ({ ...p }));
                    }
                }
            }
            
            if (c.y < 10) c.y = 10;
            if (c.y > canvas.height * 0.35) c.y = canvas.height * 0.35;
            
            if (c.isEasterEgg && Date.now() > c.morphTimer) {
                c.isEasterEgg = false;
                c.targetPuffs = generateNormalCloudPuffs(c.currentPuffs.length);
            }
            
            c.currentPuffs.forEach((p, idx) => {
                const target = c.targetPuffs[idx];
                if (target) {
                    p.dx += (target.dx - p.dx) * 0.012;
                    p.dy += (target.dy - p.dy) * 0.012;
                    p.r += (target.r - p.r) * 0.012;
                }
            });
            
            if (c.opacity < c.targetOpacity) c.opacity += 0.005;
            
            if (c.opacity > 0.01) {
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${c.opacity})`;
                ctx.shadowBlur = isStorm ? 30 : 20;
                ctx.shadowColor = isStorm ? 'rgba(5, 5, 10, 0.5)' : `rgba(${r}, ${g}, ${b}, 0.12)`;
                
                ctx.beginPath();
                c.currentPuffs.forEach(p => {
                    const px = c.x + p.dx * c.scale;
                    const py = c.y + p.dy * c.scale;
                    const pr = p.r * c.scale;
                    ctx.moveTo(px + pr, py);
                    ctx.arc(px, py, pr, 0, Math.PI * 2);
                });
                ctx.fill();
            }
        });
        ctx.restore();
    }

    function drawCanvasWaves(hour) {
        waveTime += 0.004;
        let baseColor = { r: 10, g: 25, b: 47 };
        if (hour >= 5.0 && hour < 9.0) {
            baseColor = { r: 36, g: 15, b: 44 };
        } else if (hour >= 9.0 && hour < 17.0) {
            baseColor = { r: 15, g: 45, b: 70 };
        } else if (hour >= 17.0 && hour < 20.5) {
            baseColor = { r: 24, g: 12, b: 35 };
        }
        
        const layers = [
            { base: 90, amp1: 12, amp2: 6, freq1: 0.004, freq2: 0.01, speed: 0.25, opacity: 0.35 },
            { base: 75, amp1: 10, amp2: 4, freq1: 0.006, freq2: 0.012, speed: -0.4, opacity: 0.55 },
            { base: 60, amp1: 14, amp2: 7, freq1: 0.005, freq2: 0.008, speed: 0.5, opacity: 0.75 },
            { base: 45, amp1: 8, amp2: 3, freq1: 0.008, freq2: 0.015, speed: -0.7, opacity: 0.92 }
        ];
        
        ctx.save();
        layers.forEach((lyr) => {
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            for (let x = 0; x <= canvas.width + 10; x += 10) {
                const currentX = Math.min(x, canvas.width);
                const angle1 = currentX * lyr.freq1 + waveTime * lyr.speed;
                const angle2 = currentX * lyr.freq2 - waveTime * lyr.speed * 0.5;
                const yOffset = Math.sin(angle1) * lyr.amp1 + Math.cos(angle2) * lyr.amp2;
                const y = canvas.height - lyr.base + yOffset;
                ctx.lineTo(currentX, y);
                if (currentX === canvas.width) break;
            }
            ctx.lineTo(canvas.width, canvas.height);
            ctx.closePath();
            ctx.fillStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${lyr.opacity})`;
            ctx.fill();
        });
        ctx.restore();
    }

    class Particle {
        constructor(type) {
            this.type = type;
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            if (this.type === 'rain' || this.type === 'storm') {
                this.y = -20;
                this.vy = 8 + Math.random() * 6;
                this.vx = window.windVector.x * 3.5 + (Math.random() - 0.5) * 1.0;
                this.length = 15 + Math.random() * 15;
                this.opacity = 0.2 + Math.random() * 0.4;
            } else if (this.type === 'snow') {
                this.y = -10;
                this.vy = 0.8 + Math.random() * 1.2;
                this.vx = window.windVector.x * 1.2 + (Math.random() - 0.5) * 0.5;
                this.r = 1.5 + Math.random() * 2.5;
                this.opacity = 0.3 + Math.random() * 0.6;
                this.swing = Math.random() * 100;
                this.swingSpeed = 0.01 + Math.random() * 0.02;
            } else if (this.type === 'spring') {
                this.y = -10;
                this.vy = 1.0 + Math.random() * 1.5;
                this.vx = 1.2 + Math.random() * 1.5;
                this.r = 3 + Math.random() * 4;
                this.opacity = 0.4 + Math.random() * 0.5;
                this.angle = Math.random() * 360;
                this.rotationSpeed = (Math.random() - 0.5) * 2;
            } else if (this.type === 'autumn') {
                this.y = -10;
                this.vy = 1.2 + Math.random() * 1.2;
                this.vx = (Math.random() - 0.2) * 1.8;
                this.r = 6 + Math.random() * 6;
                this.opacity = 0.5 + Math.random() * 0.4;
                this.angle = Math.random() * 360;
                this.rotationSpeed = (Math.random() - 0.5) * 1.5;
                const colors = ['#d35400', '#e67e22', '#f1c40f', '#ba4a00', '#935116'];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            } else if (this.type === 'summer') {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.8;
                this.vy = (Math.random() - 0.5) * 0.8;
                this.r = 1 + Math.random() * 2.0;
                this.opacity = 0.1;
                this.maxOpacity = 0.3 + Math.random() * 0.5;
                this.fadeDirection = Math.random() > 0.5 ? 1 : -1;
                this.fadeSpeed = 0.005 + Math.random() * 0.01;
            }
        }
        update(mouseX, mouseY) {
            if (this.type === 'rain' || this.type === 'storm') {
                this.y += this.vy;
                this.x += this.vx;
                const waveLimit = canvas.height - 50;
                if (this.y >= waveLimit) {
                    if (Math.random() < 0.25) createSplash(this.x, waveLimit);
                    this.reset();
                }
                if (this.x < -20 || this.x > canvas.width + 20) this.reset();
            } else if (this.type === 'snow') {
                this.y += this.vy;
                this.swing += this.swingSpeed;
                this.x += this.vx + Math.sin(this.swing) * 0.5;
                const dx = this.x - mouseX;
                const dy = this.y - mouseY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 100) {
                    const force = (100 - dist) / 100;
                    this.x += (dx / dist) * force * 3;
                }
                if (this.y > canvas.height - 50 || this.x < -10 || this.x > canvas.width + 10) this.reset();
            } else if (this.type === 'spring') {
                this.y += this.vy;
                this.x += this.vx;
                this.angle += this.rotationSpeed;
                if (this.y > canvas.height - 50 || this.x > canvas.width + 10) this.reset();
            } else if (this.type === 'autumn') {
                this.y += this.vy;
                this.x += this.vx;
                this.angle += this.rotationSpeed;
                if (this.y > canvas.height - 50 || this.x < -10 || this.x > canvas.width + 10) this.reset();
            } else if (this.type === 'summer') {
                this.x += this.vx;
                this.y += this.vy;
                this.opacity += this.fadeSpeed * this.fadeDirection;
                if (this.opacity >= this.maxOpacity) {
                    this.fadeDirection = -1;
                } else if (this.opacity <= 0.05) {
                    this.fadeDirection = 1;
                    this.maxOpacity = 0.3 + Math.random() * 0.5;
                }
                if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height - 100) this.reset();
            }
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            if (this.type === 'rain' || this.type === 'storm') {
                ctx.strokeStyle = '#aabccf';
                ctx.lineWidth = 1.0;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + this.vx, this.y + this.length);
                ctx.stroke();
            } else if (this.type === 'snow') {
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 4;
                ctx.shadowColor = '#ffffff';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'spring') {
                ctx.fillStyle = '#ffb7c5';
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle * Math.PI / 180);
                ctx.beginPath();
                ctx.ellipse(0, 0, this.r, this.r * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'autumn') {
                ctx.fillStyle = this.color;
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle * Math.PI / 180);
                ctx.beginPath();
                ctx.moveTo(0, -this.r);
                ctx.lineTo(this.r * 0.5, 0);
                ctx.lineTo(0, this.r);
                ctx.lineTo(-this.r * 0.5, 0);
                ctx.closePath();
                ctx.fill();
            } else if (this.type === 'summer') {
                ctx.fillStyle = '#d4efdf';
                ctx.shadowBlur = this.r * 6;
                ctx.shadowColor = '#58d68d';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    let splashes = [];
    function createSplash(x, y) {
        splashes.push({
            x: x, y: y, r: 1, maxR: 4 + Math.random() * 6, opacity: 0.8, speed: 0.15 + Math.random() * 0.15
        });
    }

    function updateAndDrawSplashes() {
        ctx.strokeStyle = 'rgba(174, 214, 241, 0.4)';
        ctx.lineWidth = 1.0;
        for (let i = splashes.length - 1; i >= 0; i--) {
            const s = splashes[i];
            s.r += s.speed;
            s.opacity -= 0.02;
            if (s.opacity <= 0) {
                splashes.splice(i, 1);
                continue;
            }
            ctx.save();
            ctx.globalAlpha = s.opacity;
            ctx.beginPath();
            ctx.ellipse(s.x, s.y, s.r * 2.0, s.r * 0.5, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    let mouse = { x: -1000, y: -1000 };
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    let isLightningActive = false;
    let lightningFlashOpacity = 0;

    function triggerLightning() {
        isLightningActive = true;
        lightningFlashOpacity = 0.4 + Math.random() * 0.4;
        if (window.playBeepSound) window.playBeepSound(65, 0.4, 'sawtooth');
        setTimeout(() => {
            isLightningActive = false;
            lightningFlashOpacity = 0;
        }, 100 + Math.random() * 200);
    }

    window.imaginalOS = window.imaginalOS || {};
    window.imaginalOS.setWeatherType = function(type) {
        if (['clear', 'clouds', 'rain', 'snow', 'storm'].includes(type)) {
            currentWeather = type;
            onWeatherChange(type);
        }
    };
    window.imaginalOS.setSeasonType = function(season) {
        if (['spring', 'summer', 'autumn', 'winter'].includes(season)) {
            currentSeason = season;
        }
    };

    window.setWeatherOverride = function(type) {
        if (['clear', 'clouds', 'rain', 'snow', 'storm'].includes(type)) {
            currentWeather = type;
            window.telemetryData.weatherText = type.charAt(0).toUpperCase() + type.slice(1);
            onWeatherChange(type);
            return true;
        }
        return false;
    };

    function renderWeatherLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (currentWeather === 'storm') {
            if (Math.random() < 0.003 && !isLightningActive) {
                triggerLightning();
            }
            if (isLightningActive) {
                ctx.save();
                ctx.fillStyle = `rgba(255, 255, 255, ${lightningFlashOpacity})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
            }
        }
        
        const dt = new Date();
        const currentHour = dt.getHours() + dt.getMinutes() / 60 + dt.getSeconds() / 3600;
        
        let maxAlpha = 0.35;
        if (currentHour >= 20.5 || currentHour < 5.0) {
            maxAlpha = 1.0;
        } else if (currentHour >= 18.5 && currentHour < 20.5) {
            const factor = (currentHour - 18.5) / 2.0;
            maxAlpha = 0.35 + 0.65 * factor;
        }
        
        updateConstellations();
        drawConstellations(maxAlpha);
        updateAndDrawClouds(maxAlpha, currentHour);
        
        if (Math.random() < 0.0003 && maxAlpha > 0.34) {
            shootingStars.push({
                x: Math.random() * canvas.width * 0.75,
                y: Math.random() * canvas.height * 0.3,
                vx: 8 + Math.random() * 7,
                vy: 4 + Math.random() * 4,
                length: 50 + Math.random() * 60,
                opacity: 0.8 + Math.random() * 0.2,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.025
            });
        }
        
        ctx.save();
        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const s = shootingStars[i];
            s.x += s.vx;
            s.y += s.vy;
            s.life -= s.decay;
            if (s.life <= 0) {
                shootingStars.splice(i, 1);
                continue;
            }
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.vx * (s.length / 12), s.y - s.vy * (s.length / 12));
            ctx.strokeStyle = `rgba(255, 255, 255, ${s.opacity * s.life * maxAlpha})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        ctx.restore();
        
        let particleType = currentWeather;
        if (currentWeather === 'clear') {
            particleType = currentSeason;
        }
        
        let desiredCount = 45;
        if (particleType === 'rain') desiredCount = 100;
        if (particleType === 'storm') desiredCount = 180;
        if (particleType === 'snow') desiredCount = 90;
        if (particleType === 'summer') desiredCount = 35;
        
        particles = particles.filter(p => p.type === particleType);
        while (particles.length < desiredCount) {
            particles.push(new Particle(particleType));
        }
        
        particles.forEach(p => {
            p.update(mouse.x, mouse.y);
            p.draw();
        });
        
        if (particleType === 'rain' || particleType === 'storm') {
            updateAndDrawSplashes();
        }
        
        drawCanvasWaves(currentHour);
        requestAnimationFrame(renderWeatherLoop);
    }

    function initWeatherCanvas() {
        canvas = document.createElement('canvas');
        canvas.id = 'weather-canvas';
        ctx = canvas.getContext('2d');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '4';
        document.body.appendChild(canvas);
        
        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            window.telemetryData.viewportRes = `${window.innerWidth}x${window.innerHeight}`;
        }
        window.addEventListener('resize', resize);
        resize();
        renderWeatherLoop();
    }

    window.imaginalOS.initWeatherCanvas = initWeatherCanvas;
    window.imaginalOS.initTooltip = initTooltip;
})();
