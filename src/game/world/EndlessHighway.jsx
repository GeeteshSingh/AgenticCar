import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD } from '@/game/config/gameConfig'

// Recycled endless highway. A pool of road segments scrolls toward the camera
// (the car is fixed at z=0; the world moves -z). Segments that pass behind the
// player are repositioned ahead. No unbounded object creation: a fixed pool of
// N segment meshes is reused.

const SEGMENT_LENGTH = 40
const SEGMENT_COUNT = 16 // covers ~640 units of road

export function EndlessHighway({ scrollRef }) {
  const groupRef = useRef()
  const segments = useRef([])

  // Build static segment meshes once (reused forever)
  const roadMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1b1f2a', roughness: 0.9 }),
    [],
  )
  const shoulderMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0e1118', roughness: 1 }),
    [],
  )
  const lineMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#e5e7eb', emissive: '#94a3b8', emissiveIntensity: 0.5 }),
    [],
  )
  const barrierMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0ea5e9', emissiveIntensity: 0.6 }),
    [],
  )

  // Initial z positions for each segment
  const positions = useMemo(
    () => Array.from({ length: SEGMENT_COUNT }, (_, i) => i * SEGMENT_LENGTH),
    [],
  )

  useFrame((_, dt) => {
    const scrollSpeed = (scrollRef?.current ?? 0) * 0.1 // visual scale of speed
    const g = groupRef.current
    if (!g) return
    for (let i = 0; i < g.children.length; i++) {
      const seg = g.children[i]
      seg.position.z -= scrollSpeed * dt
      // Recycle when fully behind the camera
      if (seg.position.z < -SEGMENT_LENGTH * 1.5) {
        // Move to the front of the train
        let maxZ = -Infinity
        for (let j = 0; j < g.children.length; j++) {
          maxZ = Math.max(maxZ, g.children[j].position.z)
        }
        seg.position.z = maxZ + SEGMENT_LENGTH
      }
    }
  })

  return (
    <group ref={groupRef}>
      {positions.map((z, i) => (
        <group key={i} position={[0, 0, z]}>
          {/* Road surface */}
          <mesh receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[WORLD.roadWidth, 0.2, SEGMENT_LENGTH]} />
            <primitive object={roadMat} attach="material" />
          </mesh>
          {/* Shoulders */}
          <mesh position={[WORLD.roadWidth / 2 + WORLD.shoulderWidth / 2, -0.05, 0]}>
            <boxGeometry args={[WORLD.shoulderWidth, 0.1, SEGMENT_LENGTH]} />
            <primitive object={shoulderMat} attach="material" />
          </mesh>
          <mesh position={[-WORLD.roadWidth / 2 - WORLD.shoulderWidth / 2, -0.05, 0]}>
            <boxGeometry args={[WORLD.shoulderWidth, 0.1, SEGMENT_LENGTH]} />
            <primitive object={shoulderMat} attach="material" />
          </mesh>
          {/* Guardrails */}
          <mesh position={[WORLD.roadWidth / 2 + WORLD.shoulderWidth, 0.6, 0]}>
            <boxGeometry args={[0.2, 1.2, SEGMENT_LENGTH]} />
            <primitive object={barrierMat} attach="material" />
          </mesh>
          <mesh position={[-WORLD.roadWidth / 2 - WORLD.shoulderWidth, 0.6, 0]}>
            <boxGeometry args={[0.2, 1.2, SEGMENT_LENGTH]} />
            <primitive object={barrierMat} attach="material" />
          </mesh>
          {/* Lane markings (between lanes) */}
          {Array.from({ length: WORLD.laneCount - 1 }, (_, k) => {
            const x = -WORLD.roadWidth / 2 + (k + 1) * (WORLD.roadWidth / WORLD.laneCount)
            return (
              <mesh key={k} position={[x, 0.12, 0]}>
                <boxGeometry args={[0.18, 0.02, SEGMENT_LENGTH * 0.8]} />
                <primitive object={lineMat} attach="material" />
              </mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}

export default EndlessHighway
