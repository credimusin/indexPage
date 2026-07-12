export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get("user-agent") || "";
  const path = url.pathname;

  let version = "0.9.1";
  try {
    const pkgResponse = await context.env.ASSETS.fetch(new URL("/package.json", request.url));
    if (pkgResponse.ok) {
      const pkg = await pkgResponse.json();
      if (pkg && pkg.version) {
        version = pkg.version;
      }
    }
  } catch {}

  let curlResponses = { coffee: "", tea: "", homepage: "" };
  try {
    const curlResponse = await context.env.ASSETS.fetch(new URL("/static/js/curl_responses.json", request.url));
    if (curlResponse.ok) {
      curlResponses = await curlResponse.json();
    }
  } catch {}

  if (path === "/about.txt") {
    url.pathname = "/static/vfs/about.txt";
    return context.env.ASSETS.fetch(url);
  }
  if (path === "/contact.txt") {
    url.pathname = "/static/vfs/contact.txt";
    return context.env.ASSETS.fetch(url);
  }
  if (path === "/dossier.txt") {
    url.pathname = "/static/vfs/dossier.txt";
    return context.env.ASSETS.fetch(url);
  }
  if (path === "/draft_rates.cfg") {
    url.pathname = "/static/vfs/draft_rates.cfg";
    return context.env.ASSETS.fetch(url);
  }

  if (path === "/coffee" || path === "/teapot") {
    return new Response(curlResponses.coffee, {
      status: 418,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-teapot": "true"
      }
    });
  }

  if (path === "/tea") {
    return new Response(curlResponses.tea, {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-tea-brewed": "true"
      }
    });
  }

  if (path === "/" && (userAgent.toLowerCase().includes("curl") || userAgent.toLowerCase().includes("wget"))) {
    const ansiContent = curlResponses.homepage.replace(/\${version}/g, version);
    return new Response(ansiContent, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-bmo-os": `imaginalOS-v${version}`
      }
    });
  }

  return context.next();
}
