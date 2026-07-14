import * as THREE from 'three'
import { VEHICLE } from '@/game/config/vehicleConfig'

// Hood camera. Sits near the windshield, follows the car rotation closely,
// reduced shake, fixed-ish FOV (slightly wide for immersion).

const OFFSET = new THREE.Vector3(0, 1.5, 0.6) // just above hood, slightly back
const LOOK_AHEAD = new THREE.Vector3(0, 1.4, 12)

const _pos = new THREE.Vector3()
const _look = new THREE.Vector3()

export function createHoodCamera() {
  const initialized = { current: false }
  return {
    initialized,
    update(camera, target, dt) {
      if (!target) return
      // Position relative to car, but we keep it mostly locked to car rotation
      _pos.set(target.lateralX + OFFSET.x, OFFSET.y, OFFSET.z)
      _look.set(target.lateralX + target.yaw * 2 + LOOK_AHEAD.x, LOOK_AHEAD.y, LOOK_AHEAD.z)

      if (!initialized.current) {
        camera.position.copy(_pos)
        initialized.current = true
      } else {
        camera.position.lerp(_pos, Math.min(1, 12 * dt))
      }
      camera.lookAt(_look)

      const fov = 62 + (Math.abs(target.speed) / VEHICLE.maxSpeed) * 10
      camera.fov += (fov - camera.fov) * Math.min(1, 3 * dt)
      camera.updateProjectionMatrix()
    },
    reset() {
      initialized.current = false
    },
  }
}
