# Engineering decisions

- Retain React 19, JavaScript, Vite, Three/R3F and Zustand; no framework migration or new runtime dependency.
- Keep arcade traffic/objectives and add a damage-free Free Drive mode for relaxed exploration.
- New session identity controls reset; pausing never resets statistics or vehicle state.
- Deterministic analytic road profiles use relative coordinates around the player and fixed geometry pools, avoiding unbounded scene growth.
- Native HTMLAudioElement handles radio. Plain M3U imports contain validated HTTPS audio entries; HLS requires native support and otherwise explains the browser limitation. Do not flatten HLS segments into station lists.
- Radio continues during game pause/restart/menu; restored preferences require a new Play gesture after reload.
- Optional geolocation stays on-device and ranks returned stations with coordinates. Manual country/region selection is independent of simulated scenery. City search uses incomplete station metadata, not an invented city API.
- No arbitrary streaming proxy, paid service, reverse-geocoding service or bundled private playlist.
- Imported third-party skill files are project tooling under .agents/skills, excluded from app lint. User configuration is preserved; no install scripts executed.
