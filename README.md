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
| `static/js/telemetry.js` | Hardware/OS/geo/weather probes into `window.telemetryData` |
| `static/js/canvas.js` | Sky, stars, clouds, particles, sun/moon |
| `static/js/curious.js` | "Not so curious" dock + document viewer window |
| `static/js/app.js` | Orchestrator: favicon, sky tick, lazy terminal loader, 404 state |
| `static/js/sound.js` | WebAudio synth for key clicks, beeps, glitches |
| `static/js/commands_data.js` | Static catalogue: command registry, hints, man pages, quotes |
| `static/js/vfs.js` | Virtual filesystem tree, path resolution, persistence |
| `static/js/vim.js` | Full-screen `BIM` editor |
| `static/js/spacerock.js` | The arcade game |
| `static/js/commands.js` | Command implementations (one `run*` per command) |
| `static/js/terminal.js` | Terminal shell: key handling and command dispatch only |

`terminal.js` dispatches, `commands.js` implements. The command surface is
declared once in `commands_data.js` (`COMMANDS`) and everything else - help
output, tab completion, `history` typo detection, the `man` index - is derived
from it.

## Checks

```
npm run lint     # eslint over static/js and functions
```

Illuminated by grace!
