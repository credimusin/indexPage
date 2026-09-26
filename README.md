# BMO // imaginal.dev

A retro-futuristic interactive web page.

## Technologies
- HTML5 / CSS3 / Vanilla JavaScript
- Canvas
- Cloudflare Pages (static assets + `functions/_middleware.js`)

## Layout

No build step and no bundler: every file is a classic script that publishes its
API on the single `window.imaginalOS` namespace.

| File | Role |
| --- | --- |
| `index.html` | Document shell; loads the always-on modules below |
| `static/js/core.js` | Namespace bootstrap: version banner, `escapeHtml` |
| `static/js/telemetry.js` | Hardware/OS probes into `window.telemetryData`; geo + weather on demand |
| `static/js/canvas.js` | Sky, stars, clouds, particles, sun/moon |
| `static/js/curious.js` | "Not so curious" dock + document viewer window |
| `static/js/app.js` | Orchestrator: favicon, sky tick, lazy terminal loader, 404 state |
| `static/js/sound.js` | WebAudio synth for key clicks, beeps, glitches |
| `static/js/commands_data.js` | Static catalogue: command registry, hints, man pages, quotes |
| `static/js/vfs.js` | Virtual filesystem tree, path resolution, persistence |
| `static/js/vim.js` | Full-screen `BIM` editor (loaded by the `vim` command) |
| `static/js/spacerock.js` | The arcade game (loaded by the `game` command) |
| `static/js/commands.js` | Command implementations (one `run*` per command) |
| `static/js/terminal.js` | Terminal shell: key handling and command dispatch only |
| `functions/_middleware.js` | Edge middleware: easter-egg routes and the `curl`/`wget` homepage |
| `functions/api/geo.js` | `/api/geo` - location from Cloudflare's own edge data |
| `functions/api/weather.js` | `/api/weather` - open-meteo called server-side, cached per city |

### Loading

`index.html` loads the always-on modules directly. Everything else is injected
at runtime through `imaginalOS.loadModule(name)` - a single-flight loader, so
concurrent callers share one request and a failed load can be retried. The
manifest lives in `app.js`.

Opening the terminal pulls in only what a bare shell needs (`sound`, `data`,
`vfs`, `commands`, `terminal` - 170 KB). The editor and the arcade are *not*
part of that: `vim` and `game` fetch their module on first use, which keeps
44 KB off the critical path for the majority of sessions.

`terminal.js` dispatches, `commands.js` implements. The command surface is
declared once in `commands_data.js` (`COMMANDS`) and everything else - help
output, tab completion, `history` typo detection, the `man` index - is derived
from it.

## Invariants

The code carries no comments, so the constraints that are not obvious from
reading it are recorded here.

- **`core.js` owns the namespace.** Every module assumes `window.imaginalOS`
  and `escapeHtml` already exist, and `core.js` is the first thing `index.html`
  loads. `VERSION` is assigned synchronously (to a fallback) and then refined
  once `package.json` arrives, so nothing ever reads a half-loaded value;
  `VERSION_READY` is what deferred subsystems await.
- **One script tag, one request.** `loadScript` is single-flight and keyed by
  the unversioned path, while the URL it writes to the DOM carries
  `?v=<version>`. Those two details are deliberate: keying by the versioned URL
  would let a version change mid-session inject the same file twice, and
  re-injecting `vfs.js` would re-run `loadVFS()` and could discard in-memory
  state. The query string is what guarantees a cache miss.
- **`MIN_CANVAS` in `spacerock.js` is a safety floor, not a preference.** The
  canvas is sized from the container, and `Math.max(MIN_CANVAS, ...)` is what
  stops a minimised or collapsed terminal producing a negative width - the DOM
  would coerce that to an unsigned 4-gigabyte bitmap. Resizing mid-game is safe
  because the world wraps: anything outside the new bounds wraps back in.
- **`WEATHER_CODE_MAP` in `telemetry.js` must stay sorted ascending.** The
  lookup is a linear `find(entry => code <= entry.max)`.
- **Escape before linkifying.** `linkify` and `formatDocContent` only ever
  receive already-escaped text, so no file content can break out of an
  attribute.
- **Overlays fill the terminal body with `inset: 0`, never an offset.**
  `.terminal-header` and `.terminal-body` are siblings, so the body already sits
  below the header; a `top: 36px` would double-count it.
- **The middleware must stay cheap.** It runs in front of every request
  including static assets, so `package.json` and `curl_responses.json` are read
  lazily, only on the routes that need them.
- **`FALLBACK_VERSION` / the `0.9.1` in the middleware** are the product
  version shown when `package.json` cannot be read. They are unrelated to
  `package.json`'s deploy version.

## What leaves the browser

- **Nothing on load.** Geo and weather are requested from the site's own
  `/api/*` endpoints, and only after the first pointer, key or touch event (or
  when a command that needs the data runs). No third-party lookup API is
  contacted, so no outside company ever receives a visitor's IP address.
- **Where the reading comes from** is always stated. `geoStatus` on
  `window.telemetryData` is one of:
  - `ready` - a real measurement, `locationSource` says whether it was the
    edge (`edge`) or the visitor's browser location signal (`browser`)
  - `denied` - the visitor declined the browser location prompt
  - `offline` - no source was available and no prompt was allowed

  Nothing is ever invented. When there is no reading, commands print
  `[NO SIGNAL]` rather than a plausible-looking placeholder.
- The browser location prompt is only ever raised by a command the visitor
  typed (`whoami`, `ip`, `date`, `neofetch`, `harvester`, `weather`), never by
  a passive visit or a stray click. It appears only when the edge could not
  answer, which in production it always can.
- Hardware fingerprints (canvas, audio, GPU, fonts) stay in the browser and are
  only printed when a visitor asks for them with `whoami` or `harvester`.
- The visit memory behind `whoami` keeps a timestamp, city and country for 180
  days. It never stores an IP address.

## Running it locally

`/api/geo` and `/api/weather` are Cloudflare Pages Functions, so a plain static
server cannot serve them. Use the Pages runtime:

```
npx wrangler pages dev . --port 8788
```

Without it, commands fall back to asking the browser for a location (real
coordinates, no city name) and honestly report that there is no forecast.

## Deploying

`_headers` sets `Cache-Control: public, max-age=0, must-revalidate` on the HTML,
the JavaScript, the CSS and the VFS text. Cloudflare Pages otherwise serves
non-HTML assets with a long *immutable* lifetime, and since these filenames are
not content-hashed that would pin visitors to an old build for a year - a plain
reload could never pick up a deploy, and the only cure would be a manual cache
clear. Revalidating means the browser re-checks on each navigation and gets a
cheap `304` when nothing changed. Images get a week plus
`stale-while-revalidate`, since they rarely change.

`package.json` holds the single source of truth for the version, and it is
injected into the URL of every runtime-loaded module
(`…/commands.js?v=0.7.0`). **Bump it on every deploy**: it guarantees a cache
miss for the terminal modules, so a visitor can never end up running a mix of
old and new files. Nothing else needs editing.

The five modules linked from `index.html` are fetched unversioned and rely on
revalidation; if a stale `core.js` ever turns up, the shell says so explicitly
instead of failing quietly.

## Content-Security-Policy

`script-src 'self'` blocks every inline script, and the site uses none: no
inline `<script>` bodies, no `on*=` handlers, and dynamically injected scripts
always set `.src`. A CSP violation in the console is therefore something
outside the project injecting a script into the page - almost always a browser
extension.

The browser prints those reports itself and a page cannot suppress them. To
identify one, run this in the console:

```js
imaginalOS.cspReport()
```

It replays what was blocked, with the offending code for inline scripts.

## Checks

```
npm run lint     # eslint over static/js and functions
```

Illuminated by grace!
