# QA checklist

## Known failures

- [ ] The secret supercar has no dedicated audio profile and uses the SUV fallback (`config-integrity.test.mjs`). Add and verify its own profile.
- [ ] Free-roam traffic has no player collision detection (`tunneling.test.mjs`). Implement collision checks and verify them in the browser.
