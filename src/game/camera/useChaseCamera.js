import * as THREE from 'three'
import { VEHICLE } from '@/game/config/vehicleConfig'

// Chase camera. Smoothly follows a target transform (ref state) with slight
// lag, increases FOV with speed, and adds subtle lateral offset on steering.
// Returns an update(camera, targetState, dt) function.

const OFFSET = new THREE.Vector3(0, 4.2, -9.5) // behind + above; car faces +z (natural 3rd-person)
const LOOK_OFFSET = new THREE.Vector3(0, 1.2, 12) // look ahead down the road
const BASE_FOV = 62
const MAX_FOV_BONUS = 14

const _desiredPos = new THREE.Vector3()
const _lookTarget = new THREE.Vector3()
const _smoothPos = new THREE.Vector3()
const _smoothLook = new THREE.Vector3()

export function createChaseCamera() {
  const initialized = { current: false }
  return {
    initialized,
    update(camera, target, dt) {
      if (!target) return
      const t = Math.min(1, 3.5 * dt) // position smoothing factor (smooth follow)

      // Desired camera position behind + above the car, looking down the road.
      _desiredPos.set(target.lateralX + OFFSET.x, OFFSET.y, OFFSET.z)
      _lookTarget.set(target.lateralX + LOOK_OFFSET.x, LOOK_OFFSET.y, LOOK_OFFSET.z)

      if (!initialized.current) {
        _smoothPos.copy(_desiredPos)
        _smoothLook.copy(_lookTarget)
        initialized.current = true
      } else {
        _smoothPos.lerp(_desiredPos, t)
        _smoothLook.lerp(_lookTarget, Math.min(1, 5 * dt))
      }

      camera.position.copy(_smoothPos)
      camera.lookAt(_smoothLook)

      // Speed-based FOV
      const fovBonus = (Math.abs(target.speed) / VEHICLE.maxSpeed) * MAX_FOV_BONUS
      camera.fov += (BASE_FOV + fovBonus - camera.fov) * Math.min(1, 3 * dt)
      camera.updateProjectionMatrix()
    },
    reset() {
      initialized.current = false
    },
  }
}
