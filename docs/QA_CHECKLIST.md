# QA checklist

## Known failures

- [ ] The secret supercar has no dedicated audio profile and uses the SUV fallback (`config-integrity.test.mjs`). Add and verify its own profile.
- [ ] Free-roam traffic has no player collision detection (`tunneling.test.mjs`). Implement collision checks and verify them in the browser.

Record commit/build: __________  Date: __________  Tester: __________

1. [ ] **QA-01 Devices:** On desktop Chrome, Safari and Firefox, Android Chrome and iPhone Safari, open the game, rotate and resize. Expected: controls remain usable without overlap in portrait and landscape.
2. [ ] **QA-02 Routes:** Start every highway route, Jammu & Kashmir and Thar free-roam on Low, Medium and High, by day and night. On a LAN dev server (`npm run dev -- --host`), open `?stats` and record frame time, draw calls and triangles. Expected: each route loads and remains playable; record measurements rather than assuming a target.
3. [ ] **QA-03 Vehicles:** Select each vehicle and drive to its limit; compare speedometer and engine, try H horn, bicycle bell and rider models. Expected: speed matches its configured limit and each sound and rider is appropriate.
4. [ ] **QA-04 Slow network:** Throttle to Slow 4G, select free-roam and open the shop. Force a chunk request offline, then restore network and use Retry; repeat for shop and choose close. Expected: loading/error states appear, retry reloads, and closing resumes the game.
5. [ ] **QA-05 Free-roam:** Steer, reverse, stop and navigate intersections, visit stops and open Desert Market. Add items and reload. Expected: saved list persists; nothing can be purchased or delivered.
6. [ ] **QA-06 Billboards:** Drive past billboards and finish a run. Expected: ads are readable, labelled Sponsored and listed in Road Finds.
7. [ ] **QA-07 Radio:** Play, pause, change station, try an unavailable stream, location and background tab. Expected: controls work or provide a clear error, without unexpected playback.
8. [ ] **QA-08 Settings:** Change sound, quality, day/night and reduced motion; reload. Expected: selected values persist and apply.
9. [ ] **QA-09 Lifecycle:** Pause and resume, change tabs, blur the window, then drive for 15 minutes while observing memory. Expected: input clears on blur, state remains coherent and memory does not grow continuously.
10. [ ] **QA-10 Security:** On the deployed preview run `curl -sI <preview-url>` and inspect the headers; search the browser console for `violates Content Security Policy` while using every feature. Expected: configured headers are present; record violations and affected feature.

## Laptop input and display

- [ ] Chrome, Edge, Firefox and Safari: test integrated GPU and battery saver, at 100%, 125% and 150% zoom on 1366×768, 1536×864, 1920×1080 and 2560×1440. Record overlaps and frame times.
- [ ] On a touchscreen laptop, verify keyboard hints remain visible and Settings → Show touch controls enables buttons. Check keyboard and touch together.
- [ ] Focus the canvas, try driving keys, Ctrl/Cmd shortcuts, Tab and F-keys; blur and use Click to play. Hide the tab and confirm the game pauses.
- [ ] Toggle fullscreen, test unsupported fullscreen, and verify the quality suggestion after sustained slow frames. Record DPR and image clarity before and after adaptive downscale.
