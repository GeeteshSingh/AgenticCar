You are a senior frontend game engineer specializing in React, Three.js, React Three Fiber, browser game architecture, real-time rendering, arcade vehicle controls, and performance optimization.

You are working inside an EXISTING codebase. Do not create a new Vite application, replace the project blindly, or rewrite working configuration without first inspecting it.

The existing project currently uses:

* Vite
* React 19
* JavaScript and JSX
* Tailwind CSS 4
* shadcn/ui
* Geist typography
* Existing `@/` import aliases
* A prototype 2D canvas-based three-lane driving game
* A large `App.jsx` containing rendering, controls, gameplay state, collision logic, spawning, particles, scoring, and UI

The current 2D implementation is a prototype and visual reference. It is not the architecture for the new game.

Your task is to progressively transform the existing prototype into a polished, browser-based, semi-realistic 3D arcade highway game.

# Working Title

Highway Objective

# Product Vision

Build a desktop-first 3D arcade driving game where the player drives freely on an endless multi-lane highway.

The player must:

* Avoid vehicles approaching from the front
* Overtake slower vehicles traveling in the same direction
* Complete mission objectives
* Earn points from distance, overtakes, near misses, speed, and objective completion
* Survive increasingly difficult traffic
* Experience a dynamic day/night environment
* Manage vehicle integrity after collisions

The game must prioritize:

1. Responsive and enjoyable driving
2. Stable performance
3. Fair and readable traffic
4. Clear gameplay feedback
5. Modular architecture
6. Visual polish

Do not prioritize detailed assets before the core driving loop works.

# Mandatory Development Rules

Before changing code:

1. Inspect the entire project structure.
2. Read:

   * `package.json`
   * `vite.config.*`
   * `src/App.jsx`
   * `src/main.jsx`
   * Global CSS files
   * `components.json`
   * Existing shadcn components
   * Existing utility files
3. Identify reusable configuration and components.
4. Preserve the existing Vite, React, Tailwind CSS 4, shadcn/ui, typography, aliases, and working build setup.
5. Do not initialize a new project.
6. Do not replace working configuration unless technically necessary.
7. Explain any major configuration change before making it.

Use JavaScript and JSX for this implementation.

Do not migrate the entire project to TypeScript during the 3D migration.

Do not put the new game inside one large React component.

Do not update React state every animation frame.

Do not use React component state for high-frequency vehicle transforms, traffic movement, camera interpolation, or physics calculations.

Use React for application composition and UI. Use the render loop, refs, and physics engine for real-time simulation.

# Required Technology

Install only if missing:

```bash
npm install three @react-three/fiber @react-three/drei @react-three/rapier zustand framer-motion howler
```

Use:

* React Three Fiber for the 3D scene
* Three.js for low-level 3D functionality
* Drei for useful React Three Fiber helpers
* Rapier for collision detection and simplified physics
* Zustand for meaningful global gameplay state
* Tailwind CSS for styling
* shadcn/ui for menus, HUD panels, dialogs, settings, pause screens, and results
* Framer Motion for interface transitions
* Howler.js for audio in later phases

Before installing dependencies, verify compatibility with the existing React and Vite versions.

Do not add unnecessary libraries.

# Architecture

Refactor the project toward this structure where appropriate:

```text
src/
├── app/
│   ├── AppShell.jsx
│   └── GameRouter.jsx
│
├── game/
│   ├── GameCanvas.jsx
│   │
│   ├── config/
│   │   ├── gameConfig.js
│   │   ├── vehicleConfig.js
│   │   ├── trafficConfig.js
│   │   └── difficultyConfig.js
│   │
│   ├── player/
│   │   ├── PlayerCar.jsx
│   │   ├── useArcadeVehicleController.js
│   │   └── vehicleDamage.js
│   │
│   ├── input/
│   │   ├── inputActions.js
│   │   └── useKeyboardInput.js
│   │
│   ├── camera/
│   │   ├── CameraManager.jsx
│   │   ├── useChaseCamera.js
│   │   └── useHoodCamera.js
│   │
│   ├── world/
│   │   ├── GameWorld.jsx
│   │   ├── EndlessHighway.jsx
│   │   ├── RoadSegment.jsx
│   │   ├── Environment.jsx
│   │   └── DayNightCycle.jsx
│   │
│   ├── traffic/
│   │   ├── TrafficManager.jsx
│   │   ├── TrafficVehicle.jsx
│   │   ├── trafficSpawner.js
│   │   └── spawnSafety.js
│   │
│   ├── collision/
│   │   ├── collisionSeverity.js
│   │   └── useCollisionEffects.js
│   │
│   ├── scoring/
│   │   ├── scoringRules.js
│   │   ├── overtakeDetector.js
│   │   └── nearMissDetector.js
│   │
│   ├── objectives/
│   │   ├── ObjectiveManager.jsx
│   │   ├── objectiveDefinitions.js
│   │   └── missionDefinitions.js
│   │
│   ├── effects/
│   │   ├── SpeedEffects.jsx
│   │   ├── CollisionEffects.jsx
│   │   └── CameraShake.jsx
│   │
│   └── audio/
│       └── AudioManager.jsx
│
├── stores/
│   ├── useGameStore.js
│   ├── useVehicleStore.js
│   └── useSettingsStore.js
│
├── ui/
│   ├── hud/
│   │   ├── GameHUD.jsx
│   │   ├── SpeedDisplay.jsx
│   │   ├── IntegrityDisplay.jsx
│   │   └── ObjectiveDisplay.jsx
│   │
│   ├── menus/
│   │   ├── MainMenu.jsx
│   │   └── ModeSelection.jsx
│   │
│   ├── pause/
│   │   └── PauseMenu.jsx
│   │
│   ├── results/
│   │   └── ResultsScreen.jsx
│   │
│   └── settings/
│       └── SettingsDialog.jsx
│
├── hooks/
│   ├── useGameLoop.js
│   └── usePerformanceTier.js
│
└── assets/
    ├── models/
    ├── textures/
    └── audio/
```

Adapt this structure to existing project conventions where necessary.

Each file must have one clear responsibility.

Avoid premature abstraction. Create a module only when it owns meaningful behavior.

# Game Modes

Create two game modes eventually:

## Mission Mode

The player completes sequential objectives during a run.

Example mission:

1. Travel 2 kilometers
2. Overtake 10 vehicles
3. Maintain at least 120 km/h for 30 seconds
4. Survive at night for 60 seconds
5. Finish with at least 50% vehicle integrity

Objectives become progressively more difficult.

## Endless Mode

The player drives until vehicle integrity reaches zero.

Display three rotating optional challenges.

Failing an optional challenge must not end the endless run.

# Core Gameplay Loop

```text
Main Menu
→ Mode Selection
→ Mission or Run Setup
→ Loading
→ Three-Second Countdown
→ Driving
→ Objectives and Increasing Difficulty
→ Pause or Continue
→ Mission Complete or Vehicle Destroyed
→ Results
→ Restart or Main Menu
```

# Player Controls

Desktop keyboard controls:

```text
W or Arrow Up:
Accelerate

S or Arrow Down:
Brake
Allow reverse only at very low speed

A or Arrow Left:
Steer left

D or Arrow Right:
Steer right

Space:
Handbrake

C:
Switch between chase and hood cameras

Escape:
Pause or resume
```

Use an abstract input-action interface:

```js
{
  accelerate: 0,
  brake: 0,
  steer: 0,
  handbrake: false
}
```

Do not couple the vehicle controller directly to keyboard event codes.

Future touch controls must be able to provide the same actions without rewriting vehicle movement.

# Vehicle Handling

Use free arcade movement rather than fixed lane switching.

The vehicle must support:

* Smooth acceleration
* Braking
* Limited low-speed reverse
* Continuous steering
* Speed-sensitive steering
* Reduced steering sensitivity at high speed
* Arcade lateral grip
* Natural drag
* Handbrake behavior
* Maximum forward speed
* Maximum reverse speed
* Smooth visual body roll
* Small pitch changes during acceleration and braking
* Road boundaries

Do not attempt realistic tire simulation.

The vehicle should feel responsive and enjoyable before realistic.

Store all tuning values in `vehicleConfig.js`.

Do not scatter tuning constants across components.

# Camera System

Implement:

## Chase Camera

Default camera.

Position the camera behind and above the vehicle.

Requirements:

* Smooth position interpolation
* Smooth look-target interpolation
* Slight camera lag
* Speed-based field-of-view increase
* Subtle movement during steering
* Collision shake without permanently changing camera position

## Hood Camera

Secondary camera.

Requirements:

* Position near the hood or windshield
* Follow player rotation closely
* Maintain readable forward visibility
* Reduce camera shake compared with chase mode

Pressing `C` switches camera mode.

Do not add cinematic or replay cameras during the MVP.

# Endless Highway

Create a recycled endless-road system.

Requirements:

* Multi-lane highway
* Same-direction traffic lanes
* Opposite-direction traffic lanes
* Lane markings
* Road shoulders
* Guardrails or barriers
* Recycled road segments
* No continuously growing world
* No unlimited creation of road objects

Road sections leaving the active area must be repositioned ahead.

Use primitive geometry initially.

Do not wait for detailed road assets.

# Traffic

Implement mixed highway traffic:

1. Slower vehicles traveling in the player’s direction
2. Faster vehicles approaching from the opposite direction

Traffic requirements:

* Multiple vehicle colors
* Multiple placeholder vehicle dimensions
* Configurable speed ranges
* Configurable spawn distance
* Progressive density
* Object reuse or pooling
* No uncontrolled create/destroy cycle
* Traffic remains lane-bound in the MVP
* No AI lane changing in the MVP

Difficulty should increase gradually through a normalized value from `0` to `1`.

As difficulty increases:

* Traffic density increases
* Oncoming vehicle speed increases
* Same-direction vehicle speed variation increases
* Safe gaps become smaller
* Score rewards may increase

Traffic must remain fair.

Create a spawn-safety system that prevents unavoidable walls of traffic.

Before activating a traffic group:

* Check upcoming lane occupancy
* Prevent all useful lanes from becoming blocked simultaneously
* Preserve a reasonable escape route
* Avoid spawning traffic directly on top of the player

# Collision and Vehicle Integrity

Player integrity begins at:

```text
100%
```

Damage model:

```text
Light side contact:
Approximately 5–10 damage

Moderate collision:
Approximately 15–30 damage

Severe high-speed or head-on collision:
Approximately 50–100 damage
```

Damage must consider:

* Relative impact speed
* Collision direction
* Collision severity

Significant collisions should:

* Reduce vehicle speed
* Temporarily reduce acceleration
* Trigger camera shake
* Trigger impact effects
* Reset the score multiplier
* Reduce integrity

Do not add detailed mesh deformation during the MVP.

At zero integrity:

1. Disable player input
2. Trigger a brief slow-motion effect
3. Transition to the results screen
4. Allow restart or return to menu

# Scoring

Initial configurable scoring:

```text
Distance:
Continuous base points

Clean overtake:
+100

Near miss:
+250

High-relative-speed near miss:
Up to +500

Objective completion:
+1,000 to +5,000

Collision-free driving:
Increasing score multiplier

Collision:
Reset active multiplier
```

Track:

* Total score
* Distance
* Survival time
* Overtakes
* Near misses
* Highest speed
* Collisions
* Objectives completed
* Current multiplier

Do not hardcode score values inside UI components.

# Overtake Detection

Count a clean overtake only when:

1. A same-direction traffic vehicle was ahead of the player
2. The player passes it
3. The player does not collide with it during the pass
4. The event has not already been counted for that vehicle

# Near-Miss Detection

A near miss occurs when:

1. The player passes within a configured safe threshold
2. No collision occurs
3. Relative speed exceeds a configured minimum
4. The same encounter has not already been rewarded

Avoid awarding repeated near-miss points from the same vehicle.

# Objective System

Initial objective types:

```text
DISTANCE
SURVIVAL_TIME
SCORE
OVERTAKES
NEAR_MISSES
MAINTAIN_SPEED
COLLISION_FREE
MINIMUM_INTEGRITY
```

An objective definition should follow a structure similar to:

```js
{
  id: "overtake-10",
  type: "OVERTAKES",
  title: "Clean Passes",
  description: "Overtake 10 vehicles without crashing",
  target: 10,
  reward: 2500,
  failureCondition: null
}
```

Mission mode uses sequential objectives.

Endless mode uses optional rotating challenges.

Objective progress must update from gameplay events rather than directly reading unrelated components.

# Gameplay Events

Use a small event system or clearly defined store actions.

Gameplay events should follow structures similar to:

```js
{
  type: "DISTANCE_UPDATED",
  meters: 250
}
```

```js
{
  type: "VEHICLE_OVERTAKEN",
  vehicleId: "traffic-12"
}
```

```js
{
  type: "NEAR_MISS",
  vehicleId: "traffic-8",
  distance: 1.4,
  relativeSpeed: 42
}
```

```js
{
  type: "COLLISION",
  vehicleId: "traffic-4",
  impactSpeed: 65,
  severity: "medium"
}
```

```js
{
  type: "OBJECTIVE_COMPLETED",
  objectiveId: "overtake-10"
}
```

The near-miss detector must not directly update UI, score, objectives, audio, and effects.

It emits an event.

Relevant systems respond independently.

# Day and Night

Implement a hybrid environment system.

## Endless Mode

Automatically cycle through:

```text
Sunrise
→ Day
→ Sunset
→ Night
→ Sunrise
```

Use a configurable total cycle duration between six and eight minutes.

## Mission Mode

Allow a mission to lock the environment to:

```text
DAY
SUNSET
NIGHT
```

Interpolate:

* Sun direction
* Sun intensity
* Ambient lighting
* Sky appearance
* Horizon color
* Fog color
* Fog density
* Environment brightness
* Road brightness
* Vehicle headlights
* Vehicle tail-light emissive intensity

Headlights activate automatically during sunset and night.

Night must reduce visibility without making incoming traffic impossible to see.

Do not implement weather, rain, snow, wet roads, or storms during the MVP.

# Visual Direction

Use a semi-realistic arcade visual style.

Target:

* Realistic vehicle proportions
* Physically based vehicle paint
* Reflective windows
* Working headlights
* Working brake lights
* Modern highway appearance
* Mountains, hills, trees, signs, barriers, tunnels, bridges, and distant city scenery in later phases
* Cinematic daylight and sunset
* Atmospheric fog
* Exaggerated speed feedback
* Near-miss effects
* Collision effects
* Camera shake

Use primitive geometry during the first playable version.

Do not block gameplay development on finding car assets.

Only introduce optimized `.glb` models after controls, traffic, collision, and scoring are stable.

# UI

Use existing Tailwind and shadcn patterns.

The UI should resemble a restrained modern automotive dashboard.

Do not cover important road visibility.

Gameplay HUD:

* Speed in km/h
* Score
* Score multiplier
* Vehicle integrity
* Active objective
* Objective progress
* Distance
* Camera mode
* Day/night phase

Required screens:

* Main menu
* Mode selection
* Mission selection
* Controls
* Graphics settings
* Audio settings
* Loading screen
* Three-second countdown
* Pause menu
* Mission-complete screen
* Game-over screen
* Results screen

Results display:

* Score
* Distance
* Survival time
* Overtakes
* Near misses
* Highest speed
* Objectives completed
* Number of collisions
* Best-score comparison

Use Framer Motion for restrained interface transitions.

Do not animate every UI element.

# Audio

Implement audio only after the first playable 3D milestone is stable.

Audio categories:

* Engine
* Tire movement
* Wind
* Traffic pass-by
* Near-miss whoosh
* Light collision
* Heavy collision
* UI interactions
* Environment ambience
* Music

Engine pitch should react to speed and acceleration.

Wind volume should increase with speed.

Settings:

* Master volume
* Engine volume
* Effects volume
* Environment volume
* Music volume

The game must continue working when audio files are unavailable.

Missing audio must fail gracefully without breaking gameplay.

# Performance

Performance is a core requirement.

Targets:

```text
Normal desktop:
Stable 60 FPS

Lower-powered hardware:
At least 30 FPS
```

Requirements:

* Avoid unnecessary React re-renders
* Do not update Zustand stores every frame unless values are throttled
* Use refs for high-frequency values
* Recycle road sections
* Pool or reuse traffic
* Use instancing for repeated scenery where appropriate
* Use compressed GLB assets later
* Limit shadow-casting lights
* Use one primary directional light for broad shadows
* Avoid shadow maps for every vehicle headlight
* Clamp device pixel ratio
* Add Low, Medium, High, and Auto graphics presets
* Reduce shadow quality on weaker devices
* Pause expensive updates when the document is hidden
* Avoid expensive post-processing during the first milestone

# Responsive Scope

Gameplay is desktop-first.

Menus, HUD, pause screens, settings, and results must remain responsive on tablets and phones.

Do not implement touch driving during the MVP.

Keep input architecture ready for future touch controls.

If gameplay is opened on a small touch-only device, show an informative message rather than presenting unusable controls.

# MVP Exclusions

Do not implement these features unless explicitly requested after the core game is approved:

* Multiplayer
* Open-world driving
* Realistic wheel and tire simulation
* Detailed suspension simulation
* Vehicle customization
* Car purchasing
* Garage system
* Currency economy
* Weather
* Rain
* Snow
* Wet-road reflections
* Detailed car deformation
* AI lane changing
* Police chases
* Pedestrians
* Replay system
* Cinematic camera mode
* Mobile touch driving
* Backend
* Authentication
* Online leaderboards

# Required Build Phases

Do not attempt the full project in one pass.

Complete one phase, verify it, report results, and wait for approval before starting the next phase.

## Phase 1: Foundation

Goals:

* Inspect existing code
* Preserve current setup
* Install required dependencies
* Refactor the application shell
* Preserve a working menu
* Create Zustand stores
* Create clear game-state transitions
* Create the empty React Three Fiber scene
* Verify the production build

Acceptance criteria:

* Existing styling still works
* Main menu renders
* A game session can be opened
* Empty 3D scene renders without errors
* Returning to the menu works
* Production build passes

## Phase 2: Playable 3D Driving Slice

Goals:

* Add primitive player vehicle
* Add basic highway
* Add keyboard input
* Add acceleration
* Add braking
* Add steering
* Add handbrake
* Add arcade grip and drag
* Add road boundaries
* Add chase camera
* Add hood camera
* Add camera switching
* Add basic speed HUD

Acceptance criteria:

* Player can start a run
* Player can accelerate and brake
* Steering is smooth
* Vehicle remains controllable at high speed
* Handbrake works
* Player remains within highway boundaries
* Chase camera follows smoothly
* Hood camera works
* `C` changes camera mode
* Speed is displayed
* No severe console errors
* Production build passes

Stop after Phase 2 and request gameplay feedback.

Do not continue until vehicle handling is approved.

## Phase 3: Endless Road and Traffic

Goals:

* Recycle road segments
* Add same-direction traffic
* Add oncoming traffic
* Add traffic pooling
* Add progressive traffic density
* Add safe spawning
* Add placeholder vehicle variation

Acceptance criteria:

* Road appears endless
* Memory does not continuously increase from road creation
* Traffic is visually understandable
* Traffic does not spawn on the player
* Same-direction and oncoming traffic behave correctly
* Impossible traffic walls are prevented
* Traffic becomes gradually more difficult
* Production build passes

## Phase 4: Collision, Integrity, and Results

Goals:

* Add collision severity
* Add vehicle damage
* Add integrity HUD
* Add speed reduction after impacts
* Add temporary acceleration reduction
* Add camera shake
* Add basic impact feedback
* Add zero-integrity sequence
* Add results screen
* Add restart
* Add return to menu

Acceptance criteria:

* Light and severe collisions feel different
* Damage scales reasonably
* Integrity reaches zero correctly
* Input stops after destruction
* Results are displayed
* Restart resets the entire run
* Returning to menu clears gameplay state
* Production build passes

## Phase 5: Scoring and Difficulty

Goals:

* Add distance scoring
* Add clean overtakes
* Add near misses
* Add multiplier
* Reset multiplier after collision
* Track run statistics
* Improve progressive difficulty

Acceptance criteria:

* Overtakes are counted once
* Near misses are counted once
* Collisions do not award near-miss points
* Score values come from configuration
* Results statistics are accurate
* Difficulty increases without generating impossible situations
* Production build passes

## Phase 6: Missions and Objectives

Goals:

* Add mission definitions
* Add objective definitions
* Add objective progress
* Add sequential mission stages
* Add endless optional challenges
* Add objective rewards
* Add objective-completion feedback

Acceptance criteria:

* Every initial objective type can be evaluated
* Mission objectives progress in sequence
* Endless challenges do not end the run when failed
* Objective rewards affect score once
* Objective progress appears in the HUD
* Production build passes

## Phase 7: Day/Night Environment

Goals:

* Add sunrise
* Add day
* Add sunset
* Add night
* Add smooth interpolation
* Add endless-mode cycle
* Add mission environment locking
* Add headlights
* Add readable night traffic

Acceptance criteria:

* Transitions are smooth
* Endless mode cycles automatically
* Missions can lock environment phase
* Headlights activate correctly
* Night remains playable
* Performance remains acceptable
* Production build passes

## Phase 8: Presentation and Audio

Goals:

* Improve menus
* Add loading state
* Add countdown
* Improve pause screen
* Improve results
* Add speed effects
* Add collision effects
* Add audio
* Add audio settings
* Add restrained interface animation

Acceptance criteria:

* Every game state has clear UI
* Audio responds to gameplay
* Missing audio does not break the game
* Pause works correctly
* Countdown prevents early movement
* Effects do not significantly reduce performance
* Production build passes

## Phase 9: Assets and Optimization

Goals:

* Replace primitives with optimized GLB assets
* Add vehicle material variations
* Add modular scenery
* Add graphics presets
* Add automatic performance tier
* Optimize shadows
* Optimize pixel ratio
* Profile rendering
* Test production behavior

Acceptance criteria:

* Gameplay remains unchanged after asset replacement
* Assets load with a visible loading state
* Low preset improves performance
* High preset improves visuals
* Auto preset chooses reasonable defaults
* No uncontrolled object creation
* No major memory growth during extended gameplay
* Production build passes

# First Required Milestone

The first major milestone is:

The player can open the existing application, start a run, drive freely on a 3D highway, accelerate, brake, steer, use the handbrake, switch between chase and hood cameras, avoid basic traffic, receive collision damage, see speed and vehicle integrity in the HUD, pause, restart, and reach a results screen.

Do not add premium models, detailed scenery, weather, advanced missions, or unnecessary effects before this milestone is stable.

# Testing Requirements

For every phase:

1. Run the existing test suite if present.
2. Add focused tests for pure gameplay logic.
3. Test configuration-driven calculations separately from 3D rendering.
4. Run linting if configured.
5. Run the production build.
6. Check the browser console.
7. Report exactly what passed and failed.

Prioritize automated tests for:

* Vehicle tuning calculations
* Collision severity
* Damage calculation
* Difficulty scaling
* Spawn safety
* Overtake detection
* Near-miss detection
* Score calculation
* Objective progression
* Store reset behavior

Do not claim a feature works without verifying it.

# Git and Change Management

Work in small, reviewable changes.

After each meaningful task:

1. Run relevant tests.
2. Run the production build when appropriate.
3. Review the diff.
4. Commit with a focused message.

Example commit messages:

```text
chore: add 3d game dependencies

refactor: separate application shell from game scene

feat: add arcade vehicle controller

feat: add chase and hood cameras

feat: add recycled endless highway

feat: add mixed traffic spawning

feat: add vehicle integrity system

feat: add scoring and near-miss detection

feat: add mission objective system

feat: add dynamic day-night environment

perf: add graphics presets and render optimizations
```

Do not combine the entire game into one commit.

# Code Quality Requirements

Use:

* Small focused modules
* Clear naming
* Configuration objects
* Pure functions for calculations
* Explicit store actions
* Reusable gameplay events
* Comments only where behavior is not obvious

Avoid:

* Giant components
* Deep prop drilling
* Magic numbers
* Per-frame React state updates
* Unnecessary effects
* Duplicate state
* Circular dependencies
* Premature abstractions
* Unnecessary dependencies
* Visual polish before gameplay validation

# Required Response Before Coding

Before editing files, respond with:

1. Your understanding of the existing application
2. The files and configuration you inspected
3. Dependencies already present
4. Dependencies that need to be installed
5. Existing code that will be reused
6. Existing code that will be replaced
7. The exact files you intend to create or modify during Phase 1
8. Risks or compatibility concerns
9. A concise Phase 1 execution plan

Then wait for approval.

Do not begin implementation before approval.

After approval, implement only Phase 1.

At the end of Phase 1, report:

* Files created
* Files modified
* Dependencies installed
* Tests run
* Build result
* Remaining warnings
* Manual verification steps
* Recommended next action

Then stop and request approval before Phase 2.

