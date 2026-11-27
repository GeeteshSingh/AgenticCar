# Indian environments milestone — 2026-11-27

Implemented four Indian-inspired procedural route presets: Western Ghats, Thar Desert, Konkan Coast and Deccan Plateau. They have distinct road bend/grade, terrain, vegetation and distant scenery, plus pooled original India/KEEP LEFT signs and kilometer stones. Menu preview, HUD and settings use the selected route. Stable saved environment keys retained; route selection applies appropriate time/weather defaults. Manual radio location remains independent.

India LHT: lanes[-1,-1,1,1] for world +z travel; player spawns at +2 in the left carriageway. Removed duplicated traffic child transforms so visual positions match collision coordinates. World/player/traffic/camera share the selected profile.

Agent india_world owns codex/indian-environments at /private/tmp/agenticcar-india. World commit c5a6006 integrated as c3a06e5 after independent radio_impl review. Regional profile tests and settings/traffic projection regressions pass; full npm test/lint/build pass. Four existing lint warnings and bundle warning remain. Browser connection remains unavailable, so rendered Indian landscapes, Hindi glyphs and transitions are NOT manually verified.

---

# Current execution checkpoint — 2026-11-27

Current phase: integrated implementation and QA (Phases 2–8 delivered in code; Phases 9–10 acceptance/release not complete). Branch codex/multi-agent-setup. Preserve all original setup files below and resume from this checkpoint rather than repeating discovery.

Implemented: lifecycle mount/reset/pause correctness; full terminal stats; numeric traffic speed and lane direction; objective activation baselines; overtake/near-miss encounter guards; deterministic curved/elevated road with terrain/vegetation pools and four landscapes; atmospheric presets/cycle/fog/rain; persisted graphics/camera/sensitivity/cruise/audio settings; Free Drive, revised menus/HUD/pause/restart/touch controls; native radio discovery/player/playlist/favorites/recent persistence; synthesized engine/wind audio. No runtime dependencies added.

Integrated local commits: a2d849a (traffic), 8b356df (objectives), 803ede4 (world), 2979329/12f4ad0 (radio+watchdog), d958b36 (near misses), f85fa70 (UI), 13c5a4f (radio URL/focus), cdfe72c (overtakes). Lead integration and new lifecycle/settings tests follow these commits. All workers used separate /private/tmp worktrees; retained branches g02-traffic, g03-objectives, radio-system, world-experience, ui-experience.

Independent review: traffic specialist reviewed lifecycle/UI/radio; radio specialist reviewed lifecycle/world/security; objectives specialist reviewed traffic/performance. Valid findings fixed, including first-mount objectives, unreachable speed target, playback races/timeouts, local host validation, scoring invalid encounters, input focus and pause-transition traffic. Tests/lint/build pass; four existing lint warnings and large JS warning remain. Fonts fixed.

Approved skills installed project-scoped from user-approved repositories: ponytail; Matt Pocock tdd, diagnosing-bugs, research, code-review; impeccable. No installer scripts or downloaded binaries executed. Graphify/ECC remain deferred. See SKILL_INVENTORY.md appended provenance.

Manual evidence: mission initialized/speed120; pause preserved stats; actual US Groove Salad search; SomaFM128k MP3 playing and favorited; entered driving while radio continued; terminal stats shown. Full final product browser acceptance is BLOCKED: browser access host unavailable, native snapshots stopped refreshing. Final UI changes after that observation are not manually verified. Needs restored browser connection before release. Dependency audit reports 24 vulnerabilities (critical in unused shadcn CLI transitive tree); review remains open, no dependency changes made.

Next actions: finish final UI/settings/stream switching/M3U/persistence/offline/production-preview journey; measure prolonged drive; investigate dependency tree with owner; obtain final independent acceptance. See TESTING.md and KNOWN_ISSUES.md. No push/PR/merge authorized for this implementation.

---

## Preserved setup baseline (historical)

# AgenticCar project status

Setup date: 2026-11-27. Branch: codex/multi-agent-setup. Base: origin/main 42c5f91090eb77343d6e4af4a39c38cafc779f2d, including merged documentation and CI PRs. No application functionality changed by setup. Authoritative task/ownership/implementation plan: [AGENT_TASKS.md](AGENT_TASKS.md).

## Repository baseline

React 19/Vite 8 JavaScript game with R3F/Three.js rendering, Zustand lifecycle/HUD state and ref-based simulation. Menu → loading/countdown → play/pause → results; mission/endless modes; arcade controller with cruise, keyboard controls, chase/hood cameras, recycled highway, traffic pool, AABB damage, scoring and objectives. Static day environment and primitive geometry. Audio/radio, M3U/HLS, dynamic day/night and settings are not implemented.

Node v22.23.4/npm 10.9.9. Lockfile toolchain requires Node ^20.19.0 or >=22.12.0. Existing four pure-logic suites pass; lint exits 0 with 12 warnings; build exits 0 with five unresolved Geist font references and >500kB chunk warning. Measured JS 1,167.28kB, gzip 322.43kB; no FPS, memory or long-session measurements. Agent B ran these on bd5b2ef before refreshing main; main adds documentation/identity only. No browser/integration coverage of lifecycle or audio. CI already runs npm ci/test/lint/build on PR and main push.

## Findings requiring regression verification

- GameWorld passes controller object ref as playerSpeedRef; TrafficManager expects a number (NaN risk).
- Pause→playing triggers run reset in GameWorld and controller.
- finishRun drops some supplied final stats; results reads current speed as top speed.
- Spawn direction is chosen independently of lane; oncoming difficulty speed formula is reversed.
- Endless rotating challenges reuse cumulative totals and may repeat rewards.
- alias-loader tests .mjs existence but appends .js in that fallback.

These are static findings, not browser reproductions. Existing passing unit suites do not validate integration. Reserve separate small tasks; preserve current architecture.

## Agent and skill audit

CLI 0.167.1; actual feature check: multi_agent stable true, multi_agent_v2 false. Live spawn tools successfully ran discovery A/B/C concurrently, then D after A completed. Four total slots including primary; project requests three children. Global ~/.codex/config.toml unchanged. Custom role loading must be confirmed in a fresh trusted project session; current tool dispatch uses instructions directly.

Current session reports no selected-environment skills available. Installed disk inventory is not approval to invoke or install skills:

- System actual names: imagegen, openai-docs, review-agent, create-statusline, skill-creator, skill-installer.
- Globally enabled Claude Cowork Superpowers 6.1.1 names: brainstorming, dispatching-parallel-agents, executing-plans, finishing-a-development-branch, receiving-code-review, requesting-code-review, subagent-driven-development, systematic-debugging, test-driven-development, using-git-worktrees, using-superpowers, verification-before-completion, writing-plans, writing-skills.
- Claude Cowork management: cowork-plugin-customizer, create-cowork-plugin. Marketing 2.6.0 contains 45 skills, unrelated to initial game work.
- Runtime cached names: documents, pdf, Presentations, Spreadsheets, excel-live-control, template-creator.
- Other cached copies include Superpowers 7.0.1 (adds diagnosing-superpowers), sites/sites-remix, pets skills, Pages skills, plugin-management, visualize and artifact templates. Multiple versions exist; do not mix copies or assume cache means enabled.

Locations: ~/.codex/skills/.system/; ~/.codex/plugins/cache/claude-cowork/; ~/.codex/plugins/cache/openai-primary-runtime/; ~/.codex/plugins/cache/openai-curated-remote/. No skills installed, enabled or copied during setup. The active runtime catalog must be checked again before execution.

## Conflicts resolved and remaining gates

Old local CI branch lacked identity changes; refreshed main chosen as setup base. Subagent filesystem sharing is handled by isolated implementation worktrees and exclusive file ownership. Radio planning must use explicit new service contracts because the current event bus is private. Ordinary M3U and HLS remain distinct scopes. Product decisions and implementation authorization remain pending; see task register. No push, PR or merge performed for setup.

Fresh-session role verification: a read-only Codex CLI session attempted to spawn qa_engineer but failed before reply with an internal thread-store/no-rollout error. Therefore named custom role loading remains unverified; direct instruction-based subagents did work during implementation. No project files were edited by the verification session.
