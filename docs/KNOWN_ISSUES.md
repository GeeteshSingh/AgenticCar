# Known issues and release gates

- Full browser acceptance is incomplete because browser control host is unavailable and native snapshots stopped refreshing. Final UI, switching, import, offline recovery, long drive and production preview must be tested before release.
- Dependency audit reports 24 vulnerabilities (1 critical, 13 high, 10 moderate) in `npm audit --omit=dev`. Critical proxy-addr is through shadcn's CLI/MCP/Express dependency tree; these server paths are not used by the game bundle. No deployed exploit was demonstrated, but audit is not clean. No automatic dependency changes performed. Review removal or relocation of unused CLI dependencies separately with lockfile verification.
- Raw HLS media manifest imports are rejected. Audio station-list entries pointing to HLS streams require native support, which is browser-dependent. Unsupported browsers show an error; MP3/AAC streams are the recommended starting point. Directory health metadata cannot guarantee playback. HTTPS redirects and DNS remain browser-controlled; validation is not a network sandbox.
- City search is best-effort name/region/tag metadata over bounded results. No reverse geocoding service is used.
- Large production JS bundle warning remains. Four existing lint warnings remain in legacy2D and UI exports.
- Browser profiling remains required for per-frame road normals/bounds work. Object counts are bounded; bounded counts alone do not prove sustained frame rate.
- Custom agent TOML parses and fresh Codex startup configuration succeeds, but named role auto-loading has not been independently exercised by the current tool, which dispatches instruction-defined tasks.
