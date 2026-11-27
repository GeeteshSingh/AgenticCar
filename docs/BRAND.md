# WayFound brand assets

- Replace `public/brand/logo.svg` to change the menu wordmark. Keep a usable viewBox and accessible text or title.
- Replace `public/favicon.svg` with a matching square icon.
- Add `public/brand/og.png` at **1200 × 630 pixels** for social previews. The metadata points to this path; no image is included yet, so previews cannot display it until added and deployed.
- Edit `src/config/brand.js` for the name, tagline, description and theme colours. Vite uses it to populate HTML metadata at build time.
- Existing browser storage keys remain `agenticcar-settings` and `agenticcar-radio-v1` to preserve player preferences.
