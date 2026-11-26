# AgenticCar

AgenticCar is a desktop browser arcade driving game built around an endless 3D highway. Drive through mixed traffic, avoid collisions, complete objectives, and build a score across mission and endless modes.

## Current gameplay

- A real-time 3D scene with a recycled highway, lane-bound traffic, and a responsive arcade vehicle controller.
- Mission mode with sequential distance, overtake, sustained-speed, collision-free, and integrity objectives.
- Endless mode with rotating optional challenges and increasing traffic difficulty.
- Collision damage, temporary post-impact protection, vehicle integrity, scoring, overtakes, near misses, and a results screen.
- Chase and hood camera views, pause/resume, restart, and return-to-menu flows.

The scene uses placeholder primitive vehicle/world geometry. A dynamic day/night cycle, audio, touch controls, and graphics settings are not currently implemented. Gameplay has not been browser-tested as part of this documentation update.

## Controls

| Key | Action |
| --- | --- |
| `W` or `↑` | Accelerate / boost toward maximum speed |
| `S` or `↓` | Brake; reverse is available only at low speed |
| `A` or `←` | Steer left |
| `D` or `→` | Steer right |
| `Space` | Handbrake |
| `C` | Switch between chase and hood cameras |
| `Escape` | Pause or resume |

The vehicle also has automatic cruise acceleration when no brake input is held.

## Requirements

Install a current Node.js release with npm. No specific minimum Node.js version is declared in the project manifest.

## Install and run

```sh
npm install
npm run dev
```

Vite prints the local development URL in the terminal.

## Project commands

```sh
npm run build    # Create the production bundle in dist/
npm run preview  # Serve the built bundle locally
npm test         # Run the Node-based gameplay logic tests
npm run lint     # Run Oxlint
```

Run `npm run build` before `npm run preview`.

## Architecture

- `src/app/` composes the menu, game session, and results routes.
- `src/game/` contains the React Three Fiber scene and gameplay systems, grouped by responsibility (player, traffic, collision, scoring, objectives, camera, world, and effects).
- `src/stores/useGameStore.js` holds low-frequency application and HUD state; per-frame movement and traffic simulation use refs in the render loop.
- `src/ui/` contains the React DOM menus, HUD, pause view, and results view.
- `src/game/config/` centralizes vehicle, traffic, world, and difficulty tuning.
- Root `*.test.mjs` files exercise pure gameplay logic with Node's test/runtime APIs.

## Screenshots

No verified gameplay screenshots are currently included in the repository.
