import { useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Loads one of the project's vehicle GLB models and fits it to the target
// dimensions. The GLBs are authored at wildly different native scales (most
// are in centimeters, one is already in meters) and some are taller/narrower
// than a real car, so we cannot use a single uniform scale. Instead we fit
// each axis independently to the target box [width, height, length] in meters,
// recenter the model, drop its base to the road, and rotate it so its longest
// horizontal axis points along +z (the game's forward direction).
//
// The four emissive light quads (front = +z, rear = -z) live inside the same
// rotation group as the model so they always align with the car's nose/tail.
// This keeps the Phase 7 night headlight system working on real models.
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
    // Forward = +z. If the model is longer along X than Z, rotate 90° so its
    // nose points forward. Rotation is applied in native space, before scale.
    const rotationY = sx > sz ? Math.PI / 2 : 0
    // After rotation, the native footprint maps to (nx, ny, nz):
    const nx = rotationY ? sz : sx
    const ny = sy
    const nz = rotationY ? sx : sz
    // Uniform scale: pick the single factor that fits the model to the target
    // box without distorting proportions. Use the axis that is most
    // constraining (smallest target/native ratio) so nothing clips out.
    const scaleX = width / nx
    const scaleY = height / ny
    const scaleZ = length / nz
    const s = Math.min(scaleX, scaleY, scaleZ)
    // Recenter: shift the model so its horizontal center is at origin and its
    // base sits at y=0 (the road surface) in this group's local space.
    const posX = -_center.x * s
    const posY = -_center.y * s
    const posZ = -_center.z * s
    return { s, rotationY, posX, posY, posZ, height: sy * s }
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

  const halfL = length / 2
  // Ground the base at y=0: shift up by half the scaled height.
  const groundY = fit.posY + fit.height / 2

  return (
    <group>
      {/* Rotation group: aligns the model's nose to +z and holds the lights */}
      <group rotation={[0, fit.rotationY, 0]}>
        {/* Uniform scale + recenter + ground the GLB */}
        <group
          scale={[fit.s, fit.s, fit.s]}
          position={[fit.posX, groundY, fit.posZ]}
        >
          <primitive object={cloned} ref={innerRef} />
        </group>

        {/* Emissive light quads (front = +z, rear = -z) sized to the target
            footprint so night lighting works on any loaded model. */}
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
    </group>
  )
}

// Preload all vehicle models so the first spawn doesn't hitch.
export function preloadVehicleModels(files = []) {
  files.forEach((f) => useGLTF.preload(`/vehicles/${f}`))
}

export default VehicleModel
