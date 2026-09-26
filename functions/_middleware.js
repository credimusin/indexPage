// Global middleware. Runs in front of every request, including static assets,
// so it must stay cheap: the version and the easter-egg payloads are only
// fetched on the few routes that actually need them.
const VFS_REWRITES = {
  "/about.txt": "/static/vfs/about.txt",
  "/contact.txt": "/static/vfs/contact.txt",
  "/dossier.txt": "/static/vfs/dossier.txt",
  "/draft_rates.cfg": "/static/vfs/draft_rates.cfg"
};

const CURL_AGENT = /curl|wget/i;

async function readAsset(context, path) {
  try {
    const res = await context.env.ASSETS.fetch(new URL(path, context.request.url));
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  const rewrite = VFS_REWRITES[path];
  if (rewrite) {
    url.pathname = rewrite;
    return context.env.ASSETS.fetch(url);
  }

  if (path === "/coffee" || path === "/teapot") {
    const { coffee = "" } = (await readAsset(context, "/static/js/curl_responses.json")) || {};
    return new Response(coffee, {
      status: 418,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-teapot": "true"
      }
    });
  }

  if (path === "/tea") {
    const { tea = "" } = (await readAsset(context, "/static/js/curl_responses.json")) || {};
    return new Response(tea, {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-tea-brewed": "true"
      }
    });
  }

  // Shell users get the ANSI homepage instead of the page.
  if (path === "/" && CURL_AGENT.test(request.headers.get("user-agent") || "")) {
    const [{ homepage = "" }, pkg] = await Promise.all([
      readAsset(context, "/static/js/curl_responses.json"),
      readAsset(context, "/package.json")
    ]);
    const version = (pkg && pkg.version) || "0.9.1";
    return new Response(homepage.replace(/\$\{version\}/g, version), {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-bmo-os": `imaginalOS-v${version}`
      }
    });
  }

  return context.next();
}
