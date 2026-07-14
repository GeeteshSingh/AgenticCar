// Camera shake helper. Returns a shake controller whose `trigger(intensity)`
// adds trauma; `update(dt)` decays it and returns an offset to apply to the
// active camera each frame. Kept separate from camera modes so shake never
// permanently moves the camera.
import * as THREE from 'three'

export function createCameraShake() {
  let trauma = 0
  const offset = new THREE.Vector3()
  const seed = Math.random() * 1000

  return {
    trigger(intensity = 0.5) {
      trauma = Math.min(1, trauma + intensity)
    },
    // returns {x,y,z} small offset; call once per frame after camera placed
    update(dt) {
      trauma = Math.max(0, trauma - dt * 1.5)
      const shake = trauma * trauma // quadratic feels better
      const t = performance.now() * 0.03 + seed
      offset.set(
        Math.sin(t * 1.7) * shake * 0.6,
        Math.cos(t * 2.3) * shake * 0.5,
        Math.sin(t * 1.1) * shake * 0.3,
      )
      return offset
    },
    get trauma() {
      return trauma
    },
  }
}
