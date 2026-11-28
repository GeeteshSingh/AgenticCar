# Folio 2025 research for WayFound

Research snapshot: public [folio-2025 repository](https://github.com/brunosimon/folio-2025), 28 November 2026. This document describes ideas; no upstream assets or implementation have been imported.

## Licensing

The root [`license.md`](https://github.com/brunosimon/folio-2025/blob/main/license.md) is MIT, copyright 2025 Bruno Simon. It permits use, modification and distribution subject to retaining its copyright and permission notice; it disclaims warranties and liability. Read the original for its full terms. The music folder contains a [CC0 1.0 notice](https://github.com/brunosimon/folio-2025/blob/main/static/sounds/musics/license.md); CC0 does not require attribution, but confirm which specific recordings it covers and provenance before reuse. MIT code reuse requires retaining the notice; CC0 does not clear trademarks or third-party rights.

The tree also contains sound effects and editable audio projects outside that music folder, including files with identifiable commercial-library-style names and a file named after a commercial recording under `resources/sounds/reveal-preview.band/Media/Audio Files/`. Their individual rights were not established. Models, logos, fonts and other artwork have not been individually cleared either. Treat these as not clearly CC0: do not reuse without checking provenance and applicable licences; obtain permission where necessary. No claim is made that the root MIT notice clears third-party rights.

## Feature comparison

Effort is relative to the current prototype; risks are estimates, not phone measurements. Backend means needed for the described shared experience, not for a local-only prototype.

| Feature | Folio evidence and approach | Smallest independent WayFound approach | Effort | Android risk | Backend |
|---|---|---|---|---|---|
| Respawn / stuck | `sources/Game/Respawns.js` indexes named reference positions from a scene model; `Map.js` invokes player respawn. | Add safe return-to-road/spawn action to `src/game/world/freeRoamMotion.js`, `FreeRoamWorld.jsx` and HUD. | M | Low | No |
| Reset | `sources/Game/Achievements.js` implements reset of achievement and timing state; circuit has object reset in `World/Areas/CircuitArea.js`. | Separate restart-run from clear-progress in `src/stores/useGameStore.js` and settings UI; confirmation for clearing saved data. | S | Low | No |
| Map | `sources/Game/Map.js` maps world coordinates to labelled destinations and can respawn at them. | Start with a schematic grid and current position in `src/ui/hud/` and `FreeRoamWorld.jsx`; no real-map claim. | M | Low–medium | No |
| Achievements / rewards | `sources/Game/Achievements.js`, `sources/data/achievements.js`: progress and reward selections saved locally. | Add bounded, versioned local milestones to stores and a results panel, using existing objectives. | M | Low | No; sync later |
| Quality toggle | `sources/Game/Quality.js` selects quality levels, including a mobile default. | Extend existing quality setting in `src/stores/useSettingsStore.js` and `GameCanvas.jsx`; measure each tier. | S | Low | No |
| Renderer fallback | `sources/Game/PreRenderer.js` imports `three/webgpu` for pre-rendering; that file alone does not establish the actual fallback policy. | Detect unsupported rendering and show an actionable message in `GameCanvas.jsx`; investigate WebGPU separately. | M–L | High | No |
| Touch | `sources/Game/Inputs/Pointer.js` tracks touches and computes multi-touch information. The exact one-finger driving/two-finger camera mapping was not verified. | Prototype gestures in `src/ui/controls/TouchControls.jsx` and camera handling, retain buttons and test cancellation. | M | Medium | No |
| Circuit / leaderboard | `sources/Game/World/Areas/CircuitArea.js` manages a circuit and draws leaderboard entries into a texture. The server validation protocol was not established. | Add checkpoints and a local best-time first; authoritative shared rankings require a server in addition to `useGameStore`. | L | Medium | Shared ranking: yes |
| Whispers | `sources/Game/World/Whispers.js` uses instanced flame/reveal data and spatial interactions. Submission and moderation infrastructure require separate inspection. | If desired, start with authored offline messages in world data; public messages require moderation and reporting. | L | Medium–high | User-submitted: yes |
| Audio | `sources/Game/Audio.js` registers audio groups and persists mute state. | Build on `src/game/audio/` and `src/stores/useRadioStore.js`; preserve gesture-gated playback and volume controls. | M | Medium | No, except external streams |
| Loading / behind scenes | `sources/Game/PreRenderer.js` pre-renders with a cube camera; `World/Areas/BehindTheSceneArea.js` implements an in-world area. Their complete loading orchestration was not verified. | Extend `index.html` loading state and `src/App.jsx`; optional explanatory panel without pre-rendering. | S–M | Low; pre-rendering can spike GPU | No |

## Size and order

The GitHub recursive tree reports **202,641,001 bytes** under `static/` including original and compressed variants, not a network transfer measurement. A local existing WayFound `dist/` occupies approximately **1,432 KiB** on disk, `public/` approximately **60 KiB**; these are from the existing build, not a fresh upstream or downstream build. Upstream production build, cache behavior, compression and downloaded subsets were not measured, so these figures are not directly comparable. Folio's README describes asset compression; evaluate its principles without copying its assets.

Recommended sequence: (1) safe respawn and clear restart, (2) schematic map, (3) local milestones, (4) measured quality improvements, (5) touch gesture experiment, (6) local timed circuit. Consider shared features only after authentication, moderation, privacy and server-side validation are designed. Benchmark on real phones before changing renderer or increasing scene density.

Do not adopt its large asset library, real-world logos, audio files, user-generated whispers, public leaderboard backend, or WebGPU-specific rendering wholesale: asset rights, moderation, cheating, compatibility and mobile performance are not established. Revisit individual ideas after permissions and measurements.

## Questions

1. Should respawn return to the last safe road point or the nearest intersection?
2. Should the first map show only your location, or allow travel to discovered places?
3. Which local reward matters most: vehicle colours, discoveries, or driving milestones?
