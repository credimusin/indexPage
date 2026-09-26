// Server-side weather fetch. open-meteo is free and needs no key, but it is
// still a third party, so the call is made from the edge worker: it only ever
// sees this site's traffic, never a visitor's IP address. Results are cached
// per rounded coordinate, so a whole city shares one upstream request.
import { readGeo } from "./geo.js";

const OPEN_METEO = "https://api.open-meteo.com/v1/forecast";
const CACHE_TTL_SECONDS = 900;
const UPSTREAM_TIMEOUT_MS = 5000;

function json(body) {
  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${CACHE_TTL_SECONDS}`
    }
  });
}

// Coordinates may be supplied when the browser's own location signal is used
// because the edge could not resolve one. They are clamped to valid degrees
// and rounded to two decimals, which also bounds the cache key space.
function resolveCoordinates(request) {
  const params = new URL(request.url).searchParams;
  const lat = parseFloat(params.get("lat"));
  const lon = parseFloat(params.get("lon"));

  if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
    return { latitude: Number(lat.toFixed(2)), longitude: Number(lon.toFixed(2)) };
  }
  return readGeo(request);
}

export async function onRequest(context) {
  const { latitude, longitude } = resolveCoordinates(context.request);
  // Two decimals is roughly a kilometre - plenty for a forecast, and coarse
  // enough that the cache key does not pin down an individual house.
  const cacheKey = new Request(`https://weather.imaginal.dev/?lat=${latitude.toFixed(2)}&lon=${longitude.toFixed(2)}`);
  const cache = typeof caches === "undefined" ? null : caches.default;

  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current_weather: "true",
    daily: "sunrise,sunset,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum",
    timezone: "auto"
  });

  let payload = null;
  try {
    const upstream = await fetch(`${OPEN_METEO}?${query}`, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
    if (upstream.ok) {
      payload = await upstream.json();
    }
  } catch {
    payload = null;
  }

  // A null body is a valid answer: the client falls back to its own defaults
  // and the scene stays on "clear" until the next successful request.
  const response = json(JSON.stringify(payload));
  if (payload && cache) {
    await cache.put(cacheKey, response.clone());
  }
  return response;
}
