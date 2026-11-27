# AgenticCar — Highway Objective

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

Pick Countryside, Forest, Desert or Coast. Free Drive has no vehicle damage or required objectives; Endless and Mission retain traffic scoring and integrity. Settings controls quality, steering sensitivity, cruise assist, camera, engine/wind volume, time of day, automatic day/night cycling and clear/fog/rain weather. Preferences save on this device. Pause preserves your run; Restart starts a fresh run. Returning to the menu ends the current run.

| Key | Action |
|---|---|
| W / ↑ | Accelerate |
| S / ↓ | Brake; low-speed reverse |
| A / ←, D / → | Steer |
| Space | Handbrake |
| C | Chase/hood camera |
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
