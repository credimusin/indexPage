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

## Versioning

`package.json` holds the single source of truth for the version, and it is
injected into the URL of every runtime-loaded module
(`…/commands.js?v=0.7.0`). Bumping it is what invalidates a browser's cached
copies of the terminal modules, so **bump it on every deploy** - otherwise a
visitor can end up running a mix of old and new files.

The five modules linked from `index.html` are fetched unversioned; if a stale
`core.js` ever turns up, the shell says so explicitly instead of failing
quietly.

## Checks

```
npm run lint     # eslint over static/js and functions
```

Illuminated by grace!
