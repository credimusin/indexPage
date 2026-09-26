/**
 * imaginalOS - Telemetry Forensics Harvester Module
 */
(function() {
    const FALLBACK_LAT = 59.9386;
    const FALLBACK_LON = 30.3141;
    const GEO_TIMEOUT_MS = 4000;
    const WEATHER_TIMEOUT_MS = 4000;

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
        referrer: document.referrer || 'Direct Visit'
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

    // Three geolocation providers, tried in order until one answers. Each is
    // bounded by a timeout so a hanging endpoint cannot stall the whole chain.
    async function fetchJson(url, timeout) {
        const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }

    const GEO_PROVIDERS = [
        {
            url: 'https://ipapi.co/json/',
            parse: (data) => data && data.ip && ({
                ip: data.ip,
                city: data.city,
                country: data.country_name,
                isp: data.org,
                latitude: data.latitude,
                longitude: data.longitude,
                timezone: data.timezone
            })
        },
        {
            url: 'https://ipinfo.io/json',
            parse: (data) => {
                if (!data || !data.ip) return null;
                const [lat, lon] = (data.loc || '').split(',');
                return {
                    ip: data.ip,
                    city: data.city,
                    country: data.country,
                    isp: data.org,
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lon),
                    timezone: data.timezone
                };
            }
        },
        {
            url: 'https://ipwho.is/',
            parse: (data) => data && data.success && ({
                ip: data.ip,
                city: data.city,
                country: data.country,
                isp: data.connection && data.connection.isp,
                latitude: data.latitude,
                longitude: data.longitude,
                timezone: data.timezone && data.timezone.id
            })
        }
    ];

    async function resolveGeo() {
        for (const provider of GEO_PROVIDERS) {
            try {
                const geo = provider.parse(await fetchJson(provider.url, GEO_TIMEOUT_MS));
                if (geo) return geo;
            } catch {
                // Try the next provider.
            }
        }
        return null;
    }

    function applyGeo(geo) {
        const td = window.telemetryData;
        td.ip = geo.ip || 'IP Obfuscated';
        td.city = geo.city || 'Saint Petersburg';
        td.country = geo.country || 'Russia';
        td.isp = geo.isp || 'VLAN Fallback';
        td.lat = Number.isFinite(geo.latitude) ? geo.latitude : FALLBACK_LAT;
        td.lon = Number.isFinite(geo.longitude) ? geo.longitude : FALLBACK_LON;
        td.timezone = geo.timezone || 'Europe/Moscow';
    }

    function applyWeather(weather) {
        const td = window.telemetryData;
        if (!weather) {
            td.weatherCode = 0;
            td.temperature = '15°C';
            td.windspeed = '5 km/h';
            interpretWeatherCode(0);
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

    async function getGeoAndWeather() {
        const geo = await resolveGeo();
        applyGeo(geo || { ip: null });

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${window.telemetryData.lat}` +
                    `&longitude=${window.telemetryData.lon}&current_weather=true` +
                    `&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum&timezone=auto`;

        let weather = null;
        try {
            weather = await fetchJson(url, WEATHER_TIMEOUT_MS);
        } catch {
            weather = null;
        }
        applyWeather(weather);
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
        getGeoAndWeather().catch(() => {
            window.telemetryData.ip = 'IP Obfuscated';
        });
    }

    // Expose helpers globally
    window.imaginalOS = window.imaginalOS || {};
    window.imaginalOS.initTelemetry = initTelemetry;
    window.imaginalOS.describeWeatherCode = describeWeatherCode;
})();
