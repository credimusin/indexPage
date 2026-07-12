/**
 * imaginalOS - Telemetry Forensics Harvester Module
 */
(function() {
    // Global telemetry registry
    window.telemetryData = {
        ip: 'Scanning...',
        city: 'Saint Petersburg (Fallback)',
        region: 'Saint Petersburg',
        country: 'Russia',
        isp: 'Local Loopback ISP',
        lat: 59.9386,
        lon: 30.3141,
        timezone: 'Europe/Moscow',
        weatherCode: 0,
        weatherText: 'Clear sky',
        temperature: '0°C',
        windspeed: '0 m/s',
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
        language: navigator.language || 'en-US'
    };

    const FALLBACK_LAT = 59.9386;
    const FALLBACK_LON = 30.3141;

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
        else if (ua.indexOf("Linux") > -1) os = "Linux Linux-Kernel";
        
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

    function getGeoAndWeather() {
        // 1. Try ipapi.co first
        fetch('https://ipapi.co/json/')
            .then(res => {
                if (!res.ok) throw new Error("CORS or network error");
                return res.json();
            })
            .then(data => {
                if (data && data.ip) {
                    return {
                        ip: data.ip,
                        city: data.city || 'Saint Petersburg',
                        region: data.region || 'Saint/Leningrad',
                        country: data.country_name || 'Russia',
                        isp: data.org || 'ISP',
                        latitude: data.latitude,
                        longitude: data.longitude,
                        timezone: data.timezone || 'Europe/Moscow'
                    };
                }
                throw new Error("Invalid payload");
            })
            .catch(() => {
                // 2. Fallback to ipinfo.io
                return fetch('https://ipinfo.io/json')
                    .then(res => {
                        if (!res.ok) throw new Error("CORS or network error");
                        return res.json();
                    })
                    .then(data => {
                        if (data && data.ip) {
                            const loc = (data.loc || '').split(',');
                            return {
                                ip: data.ip,
                                city: data.city || 'Saint Petersburg',
                                region: data.region || 'Saint Petersburg',
                                country: data.country || 'Russia',
                                isp: data.org || 'ISP',
                                latitude: parseFloat(loc[0]) || FALLBACK_LAT,
                                longitude: parseFloat(loc[1]) || FALLBACK_LON,
                                timezone: data.timezone || 'Europe/Moscow'
                            };
                        }
                        throw new Error("Invalid ipinfo payload");
                    });
            })
            .catch(() => {
                // 3. Fallback to ipwho.is
                return fetch('https://ipwho.is/')
                    .then(res => {
                        if (!res.ok) throw new Error("CORS or network error");
                        return res.json();
                    })
                    .then(data => {
                        if (data && data.success) {
                            return {
                                ip: data.ip,
                                city: data.city || 'Saint Petersburg',
                                region: data.region || 'Saint Petersburg',
                                country: data.country || 'Russia',
                                isp: (data.connection && data.connection.isp) || 'ISP',
                                latitude: data.latitude,
                                longitude: data.longitude,
                                timezone: (data.timezone && data.timezone.id) || 'Europe/Moscow'
                            };
                        }
                        throw new Error("Invalid ipwho payload");
                    });
            })
            .then(geo => {
                window.telemetryData.ip = geo.ip;
                window.telemetryData.city = geo.city;
                window.telemetryData.region = geo.region;
                window.telemetryData.country = geo.country;
                window.telemetryData.isp = geo.isp;
                window.telemetryData.lat = geo.latitude || FALLBACK_LAT;
                window.telemetryData.lon = geo.longitude || FALLBACK_LON;
                window.telemetryData.timezone = geo.timezone;
                
                return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${window.telemetryData.lat}&longitude=${window.telemetryData.lon}&current_weather=true&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum&timezone=auto`)
                    .then(res => res.json())
                    .catch(() => null);
            })
            .catch(() => {
                // Static Fallback
                window.telemetryData.ip = 'IP Obfuscated';
                window.telemetryData.city = 'Saint Petersburg';
                window.telemetryData.region = 'Saint/Leningrad';
                window.telemetryData.country = 'Russia';
                window.telemetryData.isp = 'VLAN Fallback';
                window.telemetryData.lat = FALLBACK_LAT;
                window.telemetryData.lon = FALLBACK_LON;
                window.telemetryData.timezone = 'Europe/Moscow';
                
                return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${FALLBACK_LAT}&longitude=${FALLBACK_LON}&current_weather=true&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum&timezone=auto`)
                    .then(res => res.json())
                    .catch(() => null);
            })
            .then(weather => {
                if (weather) {
                    if (weather.current_weather) {
                        const cw = weather.current_weather;
                        window.telemetryData.weatherCode = cw.weathercode;
                        window.telemetryData.temperature = `${cw.temperature}°C`;
                        window.telemetryData.windspeed = `${cw.windspeed} km/h`;
                        
                        if (cw.winddirection !== undefined) {
                            window.telemetryData.windDirection = cw.winddirection;
                            const moveAngle = (cw.winddirection + 180) * Math.PI / 180;
                            const speedFactor = Math.min(2.0, Math.max(0.4, cw.windspeed / 12.0));
                            window.windVector = {
                                x: Math.cos(moveAngle) * speedFactor,
                                y: Math.sin(moveAngle) * speedFactor * 0.2
                            };
                        }
                        
                        interpretWeatherCode(cw.weathercode);
                    }
                    
                    if (weather.daily) {
                        const d = weather.daily;
                        if (d.sunrise && d.sunrise[0]) {
                            window.telemetryData.sunrise = d.sunrise[0].split('T')[1] || 'N/A';
                        }
                        if (d.sunset && d.sunset[0]) {
                            window.telemetryData.sunset = d.sunset[0].split('T')[1] || 'N/A';
                        }
                        if (d.temperature_2m_max && d.temperature_2m_max[0]) {
                            window.telemetryData.tempMax = `${d.temperature_2m_max[0]}°C`;
                        }
                        if (d.temperature_2m_min && d.temperature_2m_min[0]) {
                            window.telemetryData.tempMin = `${d.temperature_2m_min[0]}°C`;
                        }
                        if (d.uv_index_max && d.uv_index_max[0] !== undefined) {
                            window.telemetryData.uvMax = d.uv_index_max[0];
                        }
                        if (d.precipitation_sum && d.precipitation_sum[0] !== undefined) {
                            window.telemetryData.precipitation = `${d.precipitation_sum[0]} mm`;
                        }
                    }
                } else {
                    window.telemetryData.weatherCode = 0;
                    window.telemetryData.temperature = '15°C';
                    window.telemetryData.windspeed = '5 km/h';
                    interpretWeatherCode(0);
                }
            })
            .catch(() => {
                window.telemetryData.weatherCode = 0;
                window.telemetryData.temperature = '15°C';
                window.telemetryData.windspeed = '5 km/h';
                interpretWeatherCode(0);
            });
    }

    function interpretWeatherCode(code) {
        let type = 'clear';
        let text = 'Clear sky';
        
        if (code === 0) {
            type = 'clear';
            text = 'Clear sky';
        } else if (code >= 1 && code <= 3) {
            type = 'clouds';
            text = 'Partly cloudy';
        } else if (code === 45 || code === 48) {
            type = 'clouds';
            text = 'Foggy atmosphere';
        } else if (code >= 51 && code <= 57) {
            type = 'rain';
            text = 'Light drizzle';
        } else if (code >= 61 && code <= 67) {
            type = 'rain';
            text = 'Rainfall';
        } else if (code >= 71 && code <= 77) {
            type = 'snow';
            text = 'Snowfall';
        } else if (code >= 80 && code <= 82) {
            type = 'rain';
            text = 'Showers';
        } else if (code === 85 || code === 86) {
            type = 'snow';
            text = 'Snow showers';
        } else if (code >= 95) {
            type = 'storm';
            text = 'Thunderstorm';
        }
        
        if (window.imaginalOS.setWeatherType) {
            window.imaginalOS.setWeatherType(type);
        }
        window.telemetryData.weatherText = text;
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
        getGeoAndWeather();
    }

    // Expose helpers globally
    window.imaginalOS = window.imaginalOS || {};
    window.imaginalOS.initTelemetry = initTelemetry;
    window.imaginalOS.interpretWeatherCode = interpretWeatherCode;
})();
