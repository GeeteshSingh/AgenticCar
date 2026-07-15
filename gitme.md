# CarAgent — Git Workflow (copy / paste)

A copy-paste reference for the Highway Objective ("CarAgent") game project.
Each development phase gets its own branch off `main`, is committed with a
conventional message, pushed, then merged back when approved.

---

## 0. One-time: set your identity (skip if already set)

```bash
git config --global user.name "geeteshsingh"
git config --global user.email "singh.geetesh1998@gmail.com"
```

## 1. Create the repo named "CarAgent"

Option A — start fresh in a new folder:

```bash
mkdir CarAgent && cd CarAgent && git init
```

Option B — initialize in the current project folder (e.g. `Desktop/test`):

```bash
git init
```

(Repo "name" is just the folder name; `git init` uses the current directory.)

## 2. Initial commit on `main`

```bash
git checkout -b main        # if not already on main
git add -A
git commit -m "chore: scaffold Highway Objective project"
git branch -M main
```

---

## 3. Phase branches, commits, and push

For every phase: branch off `main`, make the change, commit with the conventional
message, then push the branch. Replace the message text with whatever you
actually implemented that phase.

### Phase 1 — Foundation
```bash
git checkout -b phase-1-foundation main
git add -A
git commit -m "chore: add 3d game dependencies"
git commit -m "refactor: separate application shell from game scene"
git push -u origin phase-1-foundation
```

### Phase 2 — Playable 3D Driving Slice
```bash
git checkout -b phase-2-driving-slice main
git add -A
git commit -m "feat: add arcade vehicle controller"
git commit -m "feat: add chase and hood cameras"
git commit -m "feat: add keyboard input and camera toggle"
git push -u origin phase-2-driving-slice
```

### Phase 3 — Endless Road and Traffic
```bash
git checkout -b phase-3-traffic main
git add -A
git commit -m "feat: add recycled endless highway"
git commit -m "feat: add mixed traffic spawning"
git push -u origin phase-3-traffic
```

### Phase 4 — Collision, Integrity, Results
```bash
git checkout -b phase-4-integrity main
git add -A
git commit -m "feat: add vehicle integrity system"
git commit -m "feat: add results screen and restart flow"
git push -u origin phase-4-integrity
```

### Phase 5 — Scoring and Difficulty
```bash
git checkout -b phase-5-scoring main
git add -A
git commit -m "feat: add scoring and near-miss detection"
git commit -m "feat: add progressive difficulty scaling"
git push -u origin phase-5-scoring
```

### Phase 6 — Missions and Objectives
```bash
git checkout -b phase-6-objectives main
git add -A
git commit -m "feat: add mission objective system"
git push -u origin phase-6-objectives
```

### Phase 7 — Day/Night Environment
```bash
git checkout -b phase-7-day-night main
git add -A
git commit -m "feat: add dynamic day-night environment"
git push -u origin phase-7-day-night
```

### Phase 8 — Presentation and Audio
```bash
git checkout -b phase-8-presentation main
git add -A
git commit -m "feat: add loading, countdown, and pause presentation"
git commit -m "feat: add audio and restrained UI animation"
git push -u origin phase-8-presentation
```

### Phase 9 — Assets and Optimization
```bash
git checkout -b phase-9-optimization main
git add -A
git commit -m "perf: add graphics presets and render optimizations"
git commit -m "feat: replace primitives with optimized GLB assets"
git push -u origin phase-9-optimization
```

---

## 4. Connect a remote and push `main`

```bash
git remote add origin https://github.com/your-username/CarAgent.git
git push -u origin main
```

(Use your real repository URL. Run once; later pushes just need `git push`.)

## 5. Merge a finished phase back into `main` (when approved)

```bash
git checkout main
git merge --no-ff phase-3-traffic -m "merge: phase 3 traffic into main"
git push origin main
```

## 6. Tag a milestone (optional)

```bash
git tag -a v0.3 -m "Phase 3 milestone: endless road and traffic"
git push origin --tags
```

## 7. Quick status / log helpers

```bash
git status
git log --oneline -10
git branch          # list local branches
git branch -a       # list all branches (incl. remote)
git checkout main   # switch back to main
```
