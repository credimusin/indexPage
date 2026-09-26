/**
 * imaginalOS - Telemetry Forensics Harvester Module
 */
(function() {
    const FALLBACK_LAT = 59.9386;
    const FALLBACK_LON = 30.3141;

    // WMO weather interpretation codes -> the small set of scene types the
    // canvas knows how to draw. `weather` prints these labels too.
    const WEATHER_CODE_MAP = [
        { max: 0, type: 'clear', text: 'Clear sky' },
        { max: 3, type: 'clouds', text: 'Partly cloudy' },
        { max: 48, type: 'clouds', text: 'Foggy atmosphere' },
        { max: 57, type: 'rain', text: 'Light drizzle' },
        { max: 67, type: 'rain', text: 'Rainfall' },
        { max: 77, type: 'snow', text: 'Snowfall' },
        { max: 82, type: 'rain', text: 'Showers' },
        { max: 86, type: 'snow', text: 'Snow showers' },
        { max: 99, type: 'storm', text: 'Thunderstorm' }
    ];

    // Pure lookup: WMO code -> { type, text }. No side effects, so other
    // modules (the `weather` report) can reuse the mapping.
    function describeWeatherCode(code) {
        return WEATHER_CODE_MAP.find(entry => code <= entry.max) || WEATHER_CODE_MAP[0];
    }

    function interpretWeatherCode(code) {
        const match = describeWeatherCode(code);
        if (window.imaginalOS.setWeatherType) {
            window.imaginalOS.setWeatherType(match.type);
        }
        window.telemetryData.weatherText = match.text;
    }

    // Global telemetry registry
    window.telemetryData = {
        ip: 'Scanning...',
        city: 'Saint Petersburg (Fallback)',
        country: 'Russia',
        isp: 'Local Loopback ISP',
        lat: FALLBACK_LAT,
        lon: FALLBACK_LON,
        timezone: 'Europe/Moscow',
        weatherCode: 0,
        weatherText: 'Clear sky',
        temperature: '0°C',
        windspeed: '0 m/s',
        tempMax: null,
        tempMin: null,
        uvMax: null,
        precipitation: null,
        sunrise: null,
        sunset: null,
        os: 'Unknown OS',
        browser: 'Unknown Browser',
        cores: navigator.hardwareConcurrency || 'N/A',
        memory: navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'N/A',
        screenRes: `${screen.width}x${screen.height}`,
        viewportRes: `${window.innerWidth}x${window.innerHeight}`,
        batteryLevel: 'Scanning...',
        batteryStatus: 'Scanning...',
        connectionType: 'N/A',
        downlink: 'N/A',
        rtt: 'N/A',
        canvasHash: 'Generating...',
        audioHash: 'Generating...',
        detectedFonts: [],
        cookiesEnabled: navigator.cookieEnabled ? 'Yes' : 'No',
        doNotTrack: navigator.doNotTrack || 'N/A',
        gpuVendor: 'Unknown',
        gpuRenderer: 'Unknown',
        referrer: document.referrer || 'Direct Visit',
        // 'idle' before anything is requested, then:
        //   'ready'   real measurement (from the edge or the browser)
        //   'offline' nothing available and no prompt was allowed
        //   'denied'  the visitor refused the browser location prompt
        geoStatus: 'idle',
        // 'edge' | 'browser' | null - which one produced lat/lon
        locationSource: null
    };

    function parseUA() {
        const ua = navigator.userAgent;
        let browser = "Unknown Browser";
        let os = "Unknown OS";
        
        if (ua.indexOf("Firefox") > -1) browser = "Mozilla Firefox";
        else if (ua.indexOf("SamsungBrowser") > -1) browser = "Samsung Internet";
        else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browser = "Opera";
        else if (ua.indexOf("Trident") > -1) browser = "Internet Explorer";
        else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) browser = "Microsoft Edge";
        else if (ua.indexOf("Chrome") > -1) browser = "Google Chrome";
        else if (ua.indexOf("Safari") > -1) browser = "Apple Safari";
        
        if (ua.indexOf("Windows NT 10.0") > -1) os = "Windows 10/11";
        else if (ua.indexOf("Windows NT 6.2") > -1) os = "Windows 8";
        else if (ua.indexOf("Windows NT 6.1") > -1) os = "Windows 7";
        else if (ua.indexOf("Macintosh") > -1) os = "macOS";
        else if (ua.indexOf("Android") > -1) os = "Android OS";
        else if (ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1) os = "iOS";
        else if (ua.indexOf("Linux") > -1) os = "Linux";
        
        window.telemetryData.browser = browser;
        window.telemetryData.os = os;
    }

    function getCanvasFingerprint() {
        try {
            const tc = document.createElement('canvas');
            const tctx = tc.getContext('2d');
            tc.width = 250;
            tc.height = 40;
            tctx.textBaseline = "top";
            tctx.font = "12px 'Courier New'";
            tctx.fillStyle = "#27ae60";
            tctx.fillRect(80, 2, 45, 12);
            tctx.fillStyle = "#e74c3c";
            tctx.fillText("imaginal.dev_telemetry_scan", 4, 4);
            tctx.fillStyle = "rgba(41, 128, 185, 0.6)";
            tctx.fillText("imaginal.dev_telemetry_scan", 6, 6);
            
            const dataUrl = tc.toDataURL();
            let hash = 0;
            for (let i = 0; i < dataUrl.length; i++) {
                hash = ((hash << 5) - hash) + dataUrl.charCodeAt(i);
                hash |= 0;
            }
            window.telemetryData.canvasHash = '0x' + Math.abs(hash).toString(16).toUpperCase();
        } catch {
            window.telemetryData.canvasHash = 'ErrDenied';
        }
    }

    function getAudioFingerprint() {
        try {
            const OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
            if (!OfflineAudioContext) {
                window.telemetryData.audioHash = 'Unsupported';
                return;
            }
            const oCtx = new OfflineAudioContext(1, 44100, 44100);
            const osc = oCtx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(440, 0);
            const comp = oCtx.createDynamicsCompressor();
            comp.threshold.setValueAtTime(-50, 0);
            comp.knee.setValueAtTime(40, 0);
            comp.ratio.setValueAtTime(12, 0);
            comp.attack.setValueAtTime(0, 0);
            comp.release.setValueAtTime(0.25, 0);
            osc.connect(comp);
            comp.connect(oCtx.destination);
            osc.start(0);
            
            oCtx.startRendering().then(buffer => {
                let hash = 0;
                const channelData = buffer.getChannelData(0);
                for (let i = 0; i < Math.min(channelData.length, 800); i++) {
                    hash += Math.abs(channelData[i]);
                }
                window.telemetryData.audioHash = '0x' + Math.abs(Math.floor(hash * 10000000)).toString(16).toUpperCase();
            }).catch(() => {
                window.telemetryData.audioHash = 'ErrOfflineContext';
            });
        } catch {
            window.telemetryData.audioHash = 'ErrDenied';
        }
    }

    function detectFonts() {
        const fontsToCheck = ['Arial', 'Courier New', 'Consolas', 'Georgia', 'Impact', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Comic Sans MS', 'Ubuntu', 'Helvetica', 'Segoe UI', 'Monaco'];
        const detected = [];
        const testString = "mmmmmmmmmmlli";
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = "72px monospace";
        const baseWidth = ctx.measureText(testString).width;
        
        fontsToCheck.forEach(font => {
            ctx.font = `72px "${font}", monospace`;
            const width = ctx.measureText(testString).width;
            if (width !== baseWidth) {
                detected.push(font);
            }
        });
        window.telemetryData.detectedFonts = detected;
    }

    function detectGPU() {
        try {
            const tc = document.createElement('canvas');
            const gl = tc.getContext('webgl') || tc.getContext('experimental-webgl');
            if (gl) {
                window.telemetryData.gpuVendor = gl.getParameter(gl.VENDOR) || 'Unknown';
                window.telemetryData.gpuRenderer = gl.getParameter(gl.RENDERER) || 'Unknown';
                
                const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
                if (!isFirefox) {
                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    if (debugInfo) {
                        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                        if (vendor) window.telemetryData.gpuVendor = vendor;
                        if (renderer) window.telemetryData.gpuRenderer = renderer;
                    }
                }
            }
        } catch {}
    }

    function fetchNetworkDetails() {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) {
            window.telemetryData.connectionType = conn.effectiveType || 'N/A';
            window.telemetryData.downlink = conn.downlink ? conn.downlink + ' Mbps' : 'N/A';
            window.telemetryData.rtt = conn.rtt ? conn.rtt + ' ms' : 'N/A';
        }
    }

    function fetchBatteryDetails() {
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                const updateBatteryInfo = () => {
                    window.telemetryData.batteryLevel = `${Math.round(battery.level * 100)}%`;
                    window.telemetryData.batteryStatus = battery.charging ? 'Charging' : 'Discharging';
                };
                updateBatteryInfo();
                battery.addEventListener('levelchange', updateBatteryInfo);
                battery.addEventListener('chargingchange', updateBatteryInfo);
            }).catch(() => {
                window.telemetryData.batteryLevel = 'Permission Denied';
                window.telemetryData.batteryStatus = 'N/A';
            });
        } else {
            window.telemetryData.batteryLevel = 'Unsupported API';
            window.telemetryData.batteryStatus = 'N/A';
        }
    }

    // Geo and weather come from our own /api endpoints, which resolve them on
    // the edge. No third party ever sees a visitor's IP address.
    const GEO_URL = '/api/geo';
    const WEATHER_URL = '/api/weather';
    const GEO_TIMEOUT_MS = 5000;
    const WEATHER_TIMEOUT_MS = 6000;
    const GEO_CACHE_KEY = 'imaginal_geo_cache';
    const GEO_CACHE_TTL_MS = 30 * 60 * 1000;
    const GEO_RETRY_MS = 15000;

    let geoPromise = null;
    let browserPromise = null;
    let lastGeoAttempt = 0;

    async function fetchJson(url, timeout) {
        const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }

    function readGeoCache() {
        try {
            const raw = sessionStorage.getItem(GEO_CACHE_KEY);
            if (!raw) return null;
            const cached = JSON.parse(raw);
            return Date.now() - cached.at < GEO_CACHE_TTL_MS ? cached : null;
        } catch {
            return null;
        }
    }

    function writeGeoCache(geo, weather) {
        try {
            sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ at: Date.now(), geo, weather }));
        } catch {}
    }

    let warnedAboutEdge = false;

    // Served without the Pages runtime - a plain static server, most likely -
    // the /api endpoints are missing by design. That is a note, not a fault,
    // so it is reported once and calmly.
    function warnAboutMissingEdge() {
        if (warnedAboutEdge) return;
        warnedAboutEdge = true;

        const isLocal = /^(localhost|127\.0\.0\.1|\[::1\]|::1)$/.test(window.location.hostname);
        const hint = 'npx wrangler pages dev . --port 8788';
        const log = isLocal ? console.info : console.warn;

        log(
            `%c[imaginalOS]${isLocal ? ' Local dev' : ' Edge sensors unreachable'}` +
            ` - /api/geo and /api/weather are Cloudflare Pages Functions.\n` +
            `Run ${hint} to serve them. Until then, commands that need a\n` +
            `location offer the browser's own signal instead.`,
            'color: #8892b0'
        );
    }

    // Single wording for "where am I", whichever source answered.
    function getLocationLabel() {
        const td = window.telemetryData;
        if (td.locationSource === 'browser') {
            return `${td.lat.toFixed(3)}, ${td.lon.toFixed(3)} (browser signal, ${td.timezone})`;
        }
        if (td.locationSource === 'edge' && td.city) {
            return `${td.city}, ${td.country}`;
        }
        return 'unknown position';
    }

    function applyGeo(geo) {
        const td = window.telemetryData;
        if (geo) {
            td.geoStatus = 'ready';
            td.locationSource = 'edge';
            td.ip = geo.ip || 'IP Obfuscated';
            td.city = geo.city || '';
            td.country = geo.country || '';
            td.lat = Number.isFinite(geo.latitude) ? geo.latitude : FALLBACK_LAT;
            td.lon = Number.isFinite(geo.longitude) ? geo.longitude : FALLBACK_LON;
            td.timezone = geo.timezone || 'Europe/Moscow';
            return;
        }
        // Nothing to go on. Location stays unset rather than being invented:
        // a plausible-looking guess is worse than an honest blank.
        td.geoStatus = 'offline';
        td.locationSource = null;
        td.ip = 'IP Obfuscated';
        td.city = '';
        td.country = '';
    }

    function applyBrowserGeo(coords) {
        const td = window.telemetryData;
        td.geoStatus = 'ready';
        td.locationSource = 'browser';
        td.lat = coords.latitude;
        td.lon = coords.longitude;
        td.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local time';
        // A reverse geocoder would be a third party again, so there is no city
        // name here: the timezone and the coordinates are the honest labels.
        td.city = '';
        td.country = '';
    }

    function requestBrowserLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }),
                () => resolve(null),
                // A cached fix is reused, so the permission prompt appears once.
                { timeout: 10000, maximumAge: 600000, enableHighAccuracy: false }
            );
        });
    }

    // Used only when a command explicitly needs a location and the edge could
    // not supply one (typically when the site is served without the Pages
    // runtime). The browser asks the visitor first.
    async function applyBrowserFallback() {
        const coords = await requestBrowserLocation();
        if (!coords || !Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) {
            window.telemetryData.geoStatus = 'denied';
            window.telemetryData.locationSource = null;
            return false;
        }

        applyBrowserGeo(coords);
        const weather = await fetchJson(
            `${WEATHER_URL}?lat=${coords.latitude.toFixed(3)}&lon=${coords.longitude.toFixed(3)}`,
            WEATHER_TIMEOUT_MS
        ).catch(() => null);
        applyWeather(weather);
        return true;
    }

    function applyWeather(weather) {
        const td = window.telemetryData;
        if (!weather) {
            // No measurement: say so rather than inventing a plausible one.
            td.weatherCode = null;
            td.weatherText = 'no signal';
            td.temperature = 'unavailable';
            td.windspeed = 'unavailable';
            return;
        }

        if (weather.current_weather) {
            const cw = weather.current_weather;
            td.weatherCode = cw.weathercode;
            td.temperature = `${cw.temperature}°C`;
            td.windspeed = `${cw.windspeed} km/h`;

            if (cw.winddirection !== undefined) {
                const moveAngle = (cw.winddirection + 180) * Math.PI / 180;
                const speedFactor = Math.min(2.0, Math.max(0.4, cw.windspeed / 12.0));
                window.windVector = {
                    x: Math.cos(moveAngle) * speedFactor,
                    y: Math.sin(moveAngle) * speedFactor * 0.2
                };
            }

            interpretWeatherCode(cw.weathercode);
        }

        const d = weather.daily;
        if (!d) return;
        if (d.sunrise && d.sunrise[0]) td.sunrise = d.sunrise[0].split('T')[1] || 'N/A';
        if (d.sunset && d.sunset[0]) td.sunset = d.sunset[0].split('T')[1] || 'N/A';
        if (d.temperature_2m_max && d.temperature_2m_max[0] !== undefined) td.tempMax = `${d.temperature_2m_max[0]}°C`;
        if (d.temperature_2m_min && d.temperature_2m_min[0] !== undefined) td.tempMin = `${d.temperature_2m_min[0]}°C`;
        if (d.uv_index_max && d.uv_index_max[0] !== undefined) td.uvMax = d.uv_index_max[0];
        if (d.precipitation_sum && d.precipitation_sum[0] !== undefined) td.precipitation = `${d.precipitation_sum[0]} mm`;
    }

    // Nothing about a visitor leaves the page until they touch it. The first
    // pointer or key event (or the first command that needs the data) calls
    // this; the result is memoised for the session and cached for a short
    // while so a reload does not ask again.
    // Memoised on its own so a refusal cannot turn into a prompt per command.
    // The browser also remembers a denial, so there is nothing to re-ask.
    function startBrowserFallback() {
        if (!browserPromise) {
            browserPromise = applyBrowserFallback();
        }
        return browserPromise;
    }

    function ensureGeo(options = {}) {
        const { allowPrompt = false } = options;

        if (geoPromise) return geoPromise;

        // A failed edge lookup stays retryable, but not on every command. A
        // command that is allowed to prompt must not be gated by that window:
        // it would otherwise report "no signal" for up to GEO_RETRY_MS.
        if (Date.now() - lastGeoAttempt < GEO_RETRY_MS) {
            return allowPrompt ? startBrowserFallback() : Promise.resolve();
        }
        lastGeoAttempt = Date.now();

        const cached = readGeoCache();
        if (cached) {
            geoPromise = Promise.resolve().then(() => {
                applyGeo(cached.geo);
                applyWeather(cached.weather);
            });
            return geoPromise;
        }

        geoPromise = Promise.all([
            fetchJson(GEO_URL, GEO_TIMEOUT_MS).catch(() => null),
            fetchJson(WEATHER_URL, WEATHER_TIMEOUT_MS).catch(() => null)
        ]).then(async ([geo, weather]) => {
            if (geo) {
                applyGeo(geo);
                applyWeather(weather);
                // Only a successful lookup is worth remembering, and only the
                // edge one: a stored browser fix would go stale the moment the
                // visitor travels, whereas an IP-derived location self-corrects.
                writeGeoCache(geo, weather);
                return;
            }

            // The edge could not answer. Only a command the visitor typed may
            // escalate to a browser permission prompt - a passive visitor, or
            // the first stray click, never triggers one.
            if (allowPrompt) {
                await startBrowserFallback();
                return;
            }

            applyGeo(null);
            applyWeather(weather);
            geoPromise = null;
            warnAboutMissingEdge();
        }).catch(() => {
            geoPromise = null;
        });

        return geoPromise;
    }

    function detectSeason() {
        const month = new Date().getMonth();
        let season = 'summer';
        if (month === 11 || month === 0 || month === 1) {
            season = 'winter';
        } else if (month >= 2 && month <= 4) {
            season = 'spring';
        } else if (month >= 5 && month <= 7) {
            season = 'summer';
        } else {
            season = 'autumn';
        }
        if (window.imaginalOS.setSeasonType) {
            window.imaginalOS.setSeasonType(season);
        }
    }

    function initTelemetry() {
        parseUA();
        getCanvasFingerprint();
        getAudioFingerprint();
        detectFonts();
        detectGPU();
        fetchNetworkDetails();
        fetchBatteryDetails();
        detectSeason();
    }

    // Expose helpers globally
    window.imaginalOS = window.imaginalOS || {};
    window.imaginalOS.initTelemetry = initTelemetry;
    window.imaginalOS.ensureGeo = ensureGeo;
    window.imaginalOS.getLocationLabel = getLocationLabel;
    window.imaginalOS.describeWeatherCode = describeWeatherCode;
})();
