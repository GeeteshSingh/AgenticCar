# WayFound — Highway Objective

A desktop browser driving game with curved endless roads, generated landscapes and internet radio. Choose a relaxed Free Drive, score-based Endless run, or a five-stage Mission.

## Run locally

Use Node.js 22.12 or newer (Node 22 LTS recommended) and npm:

```sh
npm ci
npm run dev
```

Open the URL Vite prints. No API keys or environment variables are required. Radio discovery and streams require internet; driving runs locally.

```sh
npm test         # Gameplay, lifecycle, world, settings and radio regression tests
npm run lint     # Oxlint
npm run build    # Production files in dist/
npm run preview  # Serve the production build locally after building
```

## Your drive

Pick Western Ghats (misty forested climbs), Thar Desert (dunes and scrub), Konkan Coast (palms and sea), or Deccan Plateau (farmland and basalt hills). These are generated Indian-inspired landscapes, not geographic replicas. The menu previews the selected route. Traffic follows India's left-hand convention. Free Drive has no vehicle damage or required objectives; Endless and Mission retain traffic scoring and integrity. Settings controls quality, steering sensitivity, cruise assist, camera, engine/wind volume, time of day, automatic day/night cycling and clear/fog/rain weather. Preferences save on this device. Pause preserves your run; Restart starts a fresh run. Returning to the menu ends the current run.

| Key | Action |
|---|---|
| W / ↑ | Accelerate |
| S / ↓ | Brake; low-speed reverse |
| A / ←, D / → | Steer |
| Space | Handbrake |
| C | Chase/hood camera |
| 1–9 | Switch vehicle (also available in Settings) |
| 11 | Press 1 twice quickly for the 400 km/h cheat supercar |
| Escape | Pause/resume; close an open utility panel first |

Cruise assist accelerates automatically when enabled. Coarse-pointer devices show touch controls; desktop is the primary target.

## Radio and playlists

Open Radio, choose a country or two-letter country code, then optionally filter by station name, region, genre/tag, language or city metadata. City coverage is incomplete. Optional device geolocation sorts matching station coordinates locally; it does not choose the game landscape or send coordinates to a geocoding service.

Press a station to play; use pause/stop, previous/next, volume/mute and favorites. Recently played stations, selections, location, volume and imported playlist persist locally. Radio continues through game pause/restart/menu. Refresh restores preferences but requires Play again because browsers restrict autoplay.

The Playlist tab imports a local `.m3u` or `.m3u8` audio station list (up to 512 KB). Only public HTTPS URLs without credentials are accepted; video entries, unsafe URLs and duplicates are rejected/reported. Import only streams you are entitled to use. Raw HLS media manifests are rejected on import. Audio station-list entries that point to HLS streams require native browser HLS support; unsupported formats show an error. No proxy or private playlist is bundled. Try an MP3/AAC station if a stream cannot play. Station availability and codec support vary by browser and provider.

## Architecture and verification

React 19/Vite/JavaScript, React Three Fiber/Three.js and Zustand. `src/app` owns routing; `src/game` owns ref-based simulation, deterministic world pools and audio adapters; `src/ui` owns menus/instruments/settings/radio. The radio player is mounted outside game sessions so gameplay changes do not create duplicate audio.

See [Architecture](docs/ARCHITECTURE.md), [Testing](docs/TESTING.md), [Project status](docs/PROJECT_STATUS.md) and [Known issues](docs/KNOWN_ISSUES.md). The integrated product remains in acceptance testing: automated tests/build pass, actual MP3 radio playback was observed, and final browser/long-session checks remain outstanding. No screenshots are fabricated or bundled.

Troubleshooting: run `npm ci` if Vite/Oxlint is missing; use a supported Node version; try low graphics quality if rendering is slow; choose another HTTPS MP3 station after a playback error. Storage-disabled browsers keep settings only for the current session and display a notice. Fullscreen WebGL requires hardware/browser support.

Vehicle keys: 1 Desert SUV, 2 truck, 3 bicycle, 4 hatchback, 5 sedan, 6 auto rickshaw, 7 motorcycle, 8 bus, 9 pickup. Original procedural designs; no manufacturer models or logos. Speed limits and collision dimensions follow the selected vehicle.

Collision feedback includes a synthesized impact sound (controlled by engine volume), red vignette and camera shake; reduced-motion preference suppresses shake. The results overlay keeps the stopped scene visible. Use **C** or the HUD View button to cycle chase, hood and a stylized right-hand-drive cockpit; bicycles and motorcycles use handlebars. The HUD Vehicles button opens the 1–9 selection shortcuts.

## Deploy

For Cloudflare Pages, set the build command to `npm run build`, the output directory to `dist`, and the environment variable `NODE_VERSION` to `22`.

### Checking Content Security Policy reports

The optional same-origin live counter uses `/api/hb`, `/api/start`, and `/api/stats`; test those endpoints alongside the game when reviewing the deployed CSP. Local Vite without a Worker hides the counter. To run the Worker locally after `npm run build`, use `npx wrangler dev` and open the local URL it prints; this uses local Durable Object storage.

For a preview check, open two separate browsers, start a drive in each, and confirm the counts change. Check that the menu hides the counter when the API is unavailable, verify the display thresholds and phone layout, and test the Cloudflare preview before merging. The online count includes menu visitors; the start count represents distinct tab sessions rather than every run.

The Cloudflare deployment applies `public/_headers`; `npm run preview` does not reproduce those hosting headers. On the deployed site, open Chrome DevTools → Console, reload, then test each route, WebAssembly physics, radio search and playback, station artwork, fonts, and the free-roam shop. Look for `Content Security Policy` report-only messages and record the blocked URL and directive. Test any supported third-party streams before tightening the policy.

Only after investigation and browser testing show that legitimate resources work, change `Content-Security-Policy-Report-Only:` to `Content-Security-Policy:` in `public/_headers`, deploy, and repeat the checks. Report-only messages do not block resources; enforcement does.

### Live counter switch and removal

The counter is enabled by default. In Cloudflare Workers & Pages, open the WayFound Worker, choose Settings → Variables and Secrets, and set `LIVE_STATS_ENABLED` to the text `false` for the relevant environment. Apply the configuration change in Cloudflare; whether the dashboard creates a new Worker version or requires deployment depends on Cloudflare's current workflow. The game hides the counter on a 404. Set it to `true` or remove it to re-enable. Check production and preview settings separately.

To remove the Durable Object permanently in a future deployment, first remove the API code and both `LIVE_STATS` bindings, then append a new migration such as `{ "tag": "v2", "deleted_classes": ["LiveStats"] }` to `migrations`. Deleting the class deletes its stored data; verify Cloudflare's migration instructions and retain the existing migration history before deploying.
