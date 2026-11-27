# Indian route task update

| ID | Owner | Files / branch | Status and evidence |
|---|---|---|---|
| I01 | india_world | roadProfile, EndlessHighway, Environment, RouteLandmarks, world.test; codex/indian-environments | MERGED locally c3a06e5; regional determinism/seam/gradient tests pass; independent radio_impl review passed |
| I02 | Lead | environmentConfig, settings/menu/HUD, shared road mapping, LHT and traffic transform | Implemented; regression/build/lint pass; independent traffic_impl integration review passed (source only) |
| I03 | Lead QA | Browser Indian scene/route switch/landmark glyphs | BLOCKED browser host unavailable; not visually verified |

Stable stored IDs retained. No third-party map data/assets or new dependencies added. Procedural scenes are inspired by regions, not real-road replicas. Prior tasks/checkpoints below are preserved.

---

# Current task state — execution checkpoint

All initial discovery is complete. Implementation authorized. This table supersedes historical setup statuses below.

| Task | Owner | Implementation | Tests | Review | Integration / acceptance |
|---|---|---|---|---|---|
| G01/G04 | Lead | Lifecycle, terminal stats, restart identity | Lifecycle/store tests pass; earlier mission pause browser observed | Independent findings fixed | MERGED locally; final browser regression pending |
| G02 | traffic_impl | Numeric speed/lane/difficulty, bounded recycling | Regression pass | Other specialists reviewed | MERGED locally |
| G03 | objectives_impl | Activation baselines and sustained timers | Regression pass | traffic_impl reviewed | MERGED locally |
| G05 | objectives_impl | Valid overtake/near-miss encounters | Regression pass | radio_impl identified/reviewed | MERGED locally |
| W01 | objectives_impl | Road profile, terrain/scenery/atmosphere | Profile tests pass | radio_impl reviewed | MERGED locally; long-run visual performance pending |
| R01–R04 | radio_impl | Catalog/player/UI/import/persistence |11 radio tests pass | traffic_impl reviewed races/security | MERGED locally; actual MP3 observed; switching/import journey pending |
| U01 | traffic_impl | Menu/HUD/pause/touch | Build/lint pass | Lead static/render checks partial | MERGED locally; final desktop/mobile acceptance pending |
| S01 | Lead | Settings and synthetic engine/wind | Settings tests pass | traffic_impl reviewed | Integrated; final browser pending |
| Q01 | QA specialists + Lead | Release/acceptance/security | Unit/build/lint pass; audit24 advisories | Ongoing | BLOCKED browser connection; dependency review outstanding |

Branches/worktrees and exact owned files are recorded below. Four total slots including lead were respected. No worker pushed. Source/source licenses for installed skill tooling remain separate from application licensing. No app LICENSE added.

---

## Preserved setup register and dispatch history

# AgenticCar task register and authoritative setup plan

Setup date: 2026-11-27. Implementation is awaiting the user's instruction.

## Execution rules

The lead owns task assignment, interfaces, shared-file integration and acceptance. A task needs an owner, base SHA, branch/worktree, allowed files, dependencies, acceptance criteria and status before implementation. Never assign two writers to one file. Discovery agents share the checkout read-only. Implementation agents receive separate worktrees and explicit working directories; tools do not isolate subagent files automatically.

Use `codex/<task-id>-<summary>` branches from refreshed main. Do not implement on old merged PR branches. The lead serially integrates reviewed commits, reruns relevant checks, updates this register and reports unresolved issues. Only the lead owns GameWorld.jsx, GameRouter.jsx, useGameStore.js, package manifests, CI and orchestration docs/config. Obtain explicit permission for push, PR creation, merge, dependencies or repository settings. No implementation during setup.

Runtime: four slots total including primary; at most three concurrent children. Project config requests three children but cannot raise host limits. Agents inherit parent model/permissions. The definitions are reusable role files, not five simultaneously running processes. This chat's spawn tool takes task instructions rather than a custom-role selector: pass the corresponding definition as task context. Newly written config may need a fresh trusted project session to load.

## Discovery completed

| ID | Owner | Evidence | Status |
|---|---|---|---|
| A | architecture | AppShell/GameRouter, GameWorld, player/input, traffic, objectives, store | Complete; static inventory |
| B | baseline | npm test/lint/build, dependency engines, bundle output | Complete; all commands exit 0 |
| C | skills | installed CLI/features, user config and actual SKILL.md frontmatter | Complete; inventory differs from runtime approval |
| D | radio | Radio Browser API, HTML audio, RFC 8216, repo import audit | Complete; proposed contracts only |

## Initial implementation register (all pending authorization)

| ID | Owner | Files/boundary | Dependencies and acceptance |
|---|---|---|---|
| G01 | lead + QA | GameWorld, controller lifecycle; dedicated lifecycle test | Preserve score/integrity/vehicle/objectives on pause/resume; fresh run resets. Lead serial integration. |
| G02 | gameplay + QA | TrafficManager, trafficSpawner, isolated traffic tests | Agree numeric speed contract; finite movement/damage, direction follows lane, difficulty speed ranges. Lead alone changes GameWorld wiring. |
| G03 | gameplay + QA | ObjectiveManager and objectives tests | Define per-challenge baselines; prevent rewards every frame after cumulative targets reached. |
| G04 | lead + QA | store, ResultsScreen, final stats tests | Flush all final stats; display recorded topSpeed rather than current speed. Serial with G01. |
| R01 | radio specialist | new src/game/audio/catalog.js and dedicated tests | Approve catalog contract; bounded HTTPS searches, normalization, abort/error tests. No UI integration. |
| R02 | radio specialist | new src/game/audio/player.js and dedicated tests | Approve player/lifecycle contract; user gesture, promise rejection, race and disposal tests. |
| R03 | QA/radio | separate playlist module/fixtures | Confirm plain M3U requirement first; bound length/entries, resolve relative URLs, reject unsafe schemes; classify HLS separately. |
| R04 | UI assignee | new src/ui/radio directory | Depends on accepted player snapshot; mock data initially; lead integrates menu/HUD later. |

For every pending task, the lead must record exact files, base SHA and worktree at dispatch. Within three child slots, G02, G03 and R01 can run concurrently after their contracts and precise file lists are accepted. G01/G04 share lifecycle/store boundaries and run serially. QA observes concurrently but only writes separately assigned tests. R01/R02 can overlap only with separate files/tests and stable Station contract. No worktrees are currently assigned to implementation.

## Authoritative implementation sequence

1. Accept lifecycle/ref/stat and challenge baseline contracts; add focused regression coverage and fix G01–G04 with serial shared-file integration.
2. Accept radio scope: target browsers, pause/menu/results policy, volume, discovery UI, favorites, click reporting and M3U/HLS requirements remain product decisions. Recommended first slice is user-triggered native HTTPS MP3/AAC radio.
3. Implement isolated catalog/player modules and tests; then UI; lead integrates lifecycle after review.
4. Validate npm ci/test/lint/build, browser gameplay scenarios and audio errors. Report baseline warnings separately. Review combined diff before any publication request.

## Proposed interfaces (design, not existing functionality)

- Traffic reads numeric km/h from controller state.speed; never coerce the state object.
- New runs reset once on session identity, not every transition to playing.
- finishRun receives a full terminal stats snapshot; HUD throttling cannot determine final results.
- Endless challenges measure progress from agreed activation baselines; a completed challenge cannot earn again without new progress.
- searchStations({query, countryCode, limit, signal}) returns Station[] with {id, name, streamUrl, codec, bitrate, hls, homepage}; identity uses stationuuid, stream prefers url_resolved.
- createRadioPlayer({audioElement}) exposes play(station), pause(), stop(), setVolume(0..1), subscribe(listener), dispose(); snapshot {stationId,status,volume,errorCode}. Status follows media events and play() promises.
- Existing game event bus is private to GameWorld; audio must not assume global subscription. Lead decides any bridge.

## Worktree procedure and evidence

`git worktree add -b codex/<task-id>-<summary> /private/tmp/agenticcar-<task-id> <approved-base-sha>`

Install using npm ci separately in each implementation worktree; never share writable node_modules across agents. Check git status before removal; retain unmerged work. Setup probe: detached worktree at bd5b2ef created successfully in /private/tmp/agenticcar-setup-probe; npm test passed all four suites without installed dependencies; clean probe removed. Full install/build isolation was not tested there. Repository metadata writes require sandbox escalation.

## Radio research sources and limitations

- https://docs.radio-browser.info/ — bounded search, mirrors, station metadata and click reporting. Station health is historical, not a playback guarantee. Resolve browser User-Agent restrictions and reporting policy before implementation.
- https://www.rfc-editor.org/rfc/rfc8216 — HLS uses playlists and segments; ordinary M3U is a URL list, not a codec. Never flatten HLS into station entries.
- https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay — handle play promise rejection and user activation.
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/audio — media events/resources.
- https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Mixed_content — require HTTPS; fetched playlists also need CORS. Avoid an unrestricted URL proxy.
- https://github.com/video-dev/hls.js#compatibility — HLS support varies; extra dependency requires separate approval. No audio was played or station click sent during discovery.

## Configuration source

https://developers.openai.com/codex/multi-agent/ (current redirect to ChatGPT Learn subagents): standalone project agent TOML requires name, description and developer_instructions; project agents settings request concurrency. Models, permissions, tools and skills are inherited. Do not force-enable experimental multi_agent_v2.

## Execution authorization — 2026-11-27

User authorized complete product implementation under the attached master specification. Prior setup is preserved. Approved skills are restricted to Ponytail, Matt Pocock, Impeccable, Caldo, Graphify and selected ECC skills; none found in audited installed inventory. Proceed with engineering practices; do not install unreviewed scripts.

| Task | Owner | Base | Branch/worktree | Owned files | Status | Review/integration |
|---|---|---|---|---|---|---|
| G01/G04 | Lead | 42c5f91 | codex/multi-agent-setup; primary checkout | GameWorld, GameRouter, controller lifecycle, store, ResultsScreen, lifecycle.test.mjs | IN_PROGRESS | Pending independent review |
| G02 | traffic_impl | 42c5f91 | codex/g02-traffic; /private/tmp/agenticcar-g02 | src/game/traffic/**, traffic-regression.test.mjs | IN_PROGRESS | Pending |
| G03 | objectives_impl | 42c5f91 | codex/g03-objectives; /private/tmp/agenticcar-g03 | src/game/objectives/**, objectives.test.mjs | IN_PROGRESS | Pending |
| R01–R04 | radio_impl | 42c5f91 | codex/radio-system; /private/tmp/agenticcar-radio | src/game/audio/**, src/ui/radio/**, useRadioStore.js, radio.test.mjs | IN_PROGRESS | Pending |

Contracts accepted for this batch: read speed from playerStateRef.current.speed; reset only on new session mount; flush terminal snapshot; challenge activation baselines; one persistent native audio player independent of session mounting. Radio continues through pause/menu/restart with explicit stop; no autoplay after refresh. HTTPS station discovery, manual location filters, best-effort city metadata; native-only HLS with clear unsupported feedback. Dependency-free approach first.

Mixed-direction traffic update: spawning now prefers oncoming first, then alternates direction after successful spawns. Safe-lane checks can fall back to another lane when preferred lanes are blocked. Biased-RNG regression confirms explicit oncoming/same-direction requests; full tests/lint/build pass. Browser visual verification remains pending.

Vehicle selection milestone: nine original procedural vehicles, Digit/Numpad1–9 selection, persisted settings selector/HUD, per-vehicle speed/width/length and camera clearances. Vehicle key/profile regressions and full tests/lint/build pass. Visual review remains blocked by browser host availability; no photorealism claim.

Collision/interior UI milestone: added bounded synthesized impact voices, camera shake after camera placement with offset removal/reduced-motion handling, retained scene with translucent scrollable results, HUD vehicle/camera buttons, and procedural right-hand-drive cockpit/handlebars. Independent review identified terminal flash, camera persistence and focus-containment issues; addressed. Automated camera cycling, persistence and audio lifecycle tests added. Browser host remains unavailable; visual/audio/mobile acceptance and live release approval remain outstanding.
