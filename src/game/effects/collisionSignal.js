// Transient collision-flash signal shared between the R3F render loop (writer)
// and the DOM HUD overlay (reader). Intentionally NOT in the Zustand store so
// it never triggers React re-renders or per-frame store churn. Consumers read
// currentFlash() inside their own rAF loop.
let flash = 0

export function setCollisionFlash(v) {
  flash = Math.max(0, Math.min(1, v))
}

export function currentCollisionFlash() {
  return flash
}
