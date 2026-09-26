// First-party geolocation. Cloudflare already resolved the connecting IP to a
// city/country/coordinate at the edge, so there is no reason to hand a visitor
// address to a third-party lookup API. Nothing leaves the origin here.
const FALLBACK = {
  city: "Saint Petersburg",
  country: "Russia",
  latitude: 59.9386,
  longitude: 30.3141,
  timezone: "Europe/Moscow"
};

const json = (data, headers) =>
  new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json; charset=utf-8", ...headers }
  });

// request.cf is populated by the edge runtime. It is absent when the site is
// served without Cloudflare in front of it, hence the fallbacks.
export function readGeo(request) {
  const cf = request.cf || {};
  const latitude = parseFloat(cf.latitude);
  const longitude = parseFloat(cf.longitude);

  return {
    ip: request.headers.get("cf-connecting-ip") || "IP Obfuscated",
    city: cf.city || FALLBACK.city,
    country: cf.country || FALLBACK.country,
    latitude: Number.isFinite(latitude) ? latitude : FALLBACK.latitude,
    longitude: Number.isFinite(longitude) ? longitude : FALLBACK.longitude,
    timezone: cf.timezone || FALLBACK.timezone
  };
}

export async function onRequest(context) {
  // Per visitor: never let a shared cache hand someone else's location back.
  return json(readGeo(context.request), { "cache-control": "private, no-store" });
}
