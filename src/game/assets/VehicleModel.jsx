import { useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Loads one of the project's vehicle GLB models and auto-fits it to the
// target dimensions. The model's native scale/orientation are unknown ahead
// of time, so we normalize at runtime from its bounding box: uniform-scale to
// the longest horizontal extent, recenter on X/Z, and drop its base to y=0 so
// the wheels rest on the road.
//
// An optional flat `color` is applied to all standard materials (used for
// traffic variation). The four emissive light quads at the front (+z) and rear
// (-z) are kept as simple meshes so the night headlight system works on
// whatever model is loaded.
const _box = new THREE.Box3()
const _size = new THREE.Vector3()
const _center = new THREE.Vector3()

function useFittedClone(file, width, length, height) {
  const { scene } = useGLTF(`/vehicles/${file}`)
  // Clone per-instance so multiple pool slots can show the same model.
  const cloned = useMemo(() => scene.clone(true), [scene])

  const fit = useMemo(() => {
    _box.setFromObject(cloned)
    _box.getSize(_size)
    _box.getCenter(_center)
    const sx = _size.x || 1
    const sy = _size.y || 1
    const sz = _size.z || 1
    // Uniform scale: fit the longest horizontal span to the target length,
    // but never let height overflow the target cabin height.
    const scale = Math.min(length / Math.max(sx, sz), height / sy)
    return { scale, center: _center.clone(), size: _size.clone() }
  }, [cloned, width, length, height])

  return { cloned, fit }
}

export function VehicleModel({
  file,
  width = 2,
  length = 4.4,
  height = 1.4,
  color,
  headMatRefs,
  tailMatRefs,
  castShadow = true,
}) {
  const { cloned, fit } = useFittedClone(file, width, length, height)
  const innerRef = useRef()

  // Optionally tint the model's standard materials once.
  useMemo(() => {
    if (!color) return
    cloned.traverse((o) => {
      if (o.isMesh && o.material && 'color' in o.material) {
        o.material = o.material.clone()
        o.material.color.set(color)
      }
    })
  }, [cloned, color])

  const halfL = (fit.size.z * fit.scale) / 2
  const lz = fit.size.z * fit.scale

  return (
    <group>
      {/* Fitted GLB model, centered and grounded */}
      <group
        scale={fit.scale}
        position={[-fit.center.x, -fit.center.y, -fit.center.z]}
      >
        <primitive object={cloned} ref={innerRef} />
      </group>

      {/* Emissive light quads (front = +z, rear = -z) so night lighting works
          regardless of the GLB's own materials. Sized to the fitted footprint. */}
      <mesh position={[width * 0.3, height * 0.42, halfL + 0.02]}>
        <boxGeometry args={[0.34, 0.16, 0.04]} />
        <meshStandardMaterial color="#fffbe6" emissive="#fde047" emissiveIntensity={1.6} ref={(m) => headMatRefs && (headMatRefs.current[0] = m)} />
      </mesh>
      <mesh position={[-width * 0.3, height * 0.42, halfL + 0.02]}>
        <boxGeometry args={[0.34, 0.16, 0.04]} />
        <meshStandardMaterial color="#fffbe6" emissive="#fde047" emissiveIntensity={1.6} ref={(m) => headMatRefs && (headMatRefs.current[1] = m)} />
      </mesh>
      <mesh position={[width * 0.3, height * 0.44, -halfL - 0.02]}>
        <boxGeometry args={[0.36, 0.14, 0.04]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.1} ref={(m) => tailMatRefs && (tailMatRefs.current[0] = m)} />
      </mesh>
      <mesh position={[-width * 0.3, height * 0.44, -halfL - 0.02]}>
        <boxGeometry args={[0.36, 0.14, 0.04]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.1} ref={(m) => tailMatRefs && (tailMatRefs.current[1] = m)} />
      </mesh>
    </group>
  )
}

// Preload all vehicle models so the first spawn doesn't hitch.
export function preloadVehicleModels(files = []) {
  files.forEach((f) => useGLTF.preload(`/vehicles/${f}`))
}

export default VehicleModel
