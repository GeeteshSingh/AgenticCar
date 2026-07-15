import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD } from '@/game/config/gameConfig'

// Recycled endless highway styled as a calm, low-poly asphalt road winding
// through rolling hills (per the reference art direction). A pool of road
// segments scrolls toward the camera (the car is fixed at z=0; the world moves
// -z). Segments / scenery that pass behind the player are repositioned ahead.
// No unbounded object creation: fixed pools of meshes are reused.

const SEGMENT_LENGTH = 40
const SEGMENT_COUNT = 16 // covers ~640 units of road

export function EndlessHighway({ scrollRef }) {
  const groupRef = useRef()

  // Shared materials (created once).
  const roadMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3a3d44', roughness: 0.95 }), [])
  const groundMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#9aa83f', roughness: 1 }), [])
  const hillMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8a9a36', roughness: 1 }), [])
  const grassMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a7b347', roughness: 1 }), [])
  const edgeLineMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f4f4f5', emissive: '#e5e5e5', emissiveIntensity: 0.15 }), [])
  const centerLineMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#facc15', emissive: '#facc15', emissiveIntensity: 0.2 }), [])
  const railMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b8c0cc', metalness: 0.7, roughness: 0.35 }), [])
  const railPostMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6b7280', metalness: 0.6, roughness: 0.5 }), [])
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4b3621', roughness: 1 }), [])
  const pineMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1f5132', roughness: 1 }), [])

  const positions = useMemo(
    () => Array.from({ length: SEGMENT_COUNT }, (_, i) => i * SEGMENT_LENGTH),
    [],
  )

  // Rolling hills on both sides — a fixed recycled pool, kept well clear of
  // the road so their cones never intersect the asphalt.
  const hills = useMemo(() => {
    const arr = []
    const perSide = 3
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      for (let h = 0; h < perSide; h++) {
        const z = i * SEGMENT_LENGTH + (h / perSide) * SEGMENT_LENGTH
        const side = (i + h) % 2 === 0 ? 1 : -1
        const height = 26 + ((i * 13 + h * 7) % 30)
        const radius = 26 + ((i + h) % 3) * 8
        // Place the cone so its BASE sits on the ground and its near edge
        // stays at least a few meters beyond the shoulder.
        const x = side * (WORLD.roadWidth / 2 + WORLD.shoulderWidth + radius + 14 + (h % 2) * 18)
        arr.push({ x, z, height, radius })
      }
    }
    return arr
  }, [])

  // Roadside dark-green pines — a fixed recycled pool.
  const pines = useMemo(() => {
    const arr = []
    const perSide = 5
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      for (let t = 0; t < perSide; t++) {
        const z = i * SEGMENT_LENGTH + (t / perSide) * SEGMENT_LENGTH
        const side = (i + t) % 2 === 0 ? 1 : -1
        const x = side * (WORLD.roadWidth / 2 + WORLD.shoulderWidth + 10 + (t % 3) * 5)
        arr.push({ x, z, scale: 0.85 + ((i * 5 + t) % 4) * 0.18 })
      }
    }
    return arr
  }, [])

  const roadGroupRef = useRef()
  const hillGroupRef = useRef()
  const pineGroupRef = useRef()

  useFrame((_, dt) => {
    const scrollSpeed = scrollRef?.current ?? 0
    const scrollAndRecycle = (group) => {
      if (!group?.current) return
      for (let i = 0; i < group.current.children.length; i++) {
        const seg = group.current.children[i]
        seg.position.z -= scrollSpeed * dt
        if (seg.position.z < -SEGMENT_LENGTH * 1.5) {
          let maxZ = -Infinity
          for (let j = 0; j < group.current.children.length; j++) {
            maxZ = Math.max(maxZ, group.current.children[j].position.z)
          }
          seg.position.z = maxZ + SEGMENT_LENGTH
        }
      }
    }
    scrollAndRecycle(roadGroupRef)
    scrollAndRecycle(hillGroupRef)
    scrollAndRecycle(pineGroupRef)
  })

  const halfRoad = WORLD.roadWidth / 2
  const railX = halfRoad + WORLD.shoulderWidth

  return (
    <group ref={groupRef}>
      {/* Broad ground (yellow-green, sun-drenched) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
        <planeGeometry args={[600, 1400]} />
        <primitive object={groundMat} attach="material" />
      </mesh>

      {/* Road + markings + guardrail train */}
      <group ref={roadGroupRef}>
        {positions.map((z, i) => (
          <group key={i} position={[0, 0, z]}>
            {/* Asphalt surface */}
            <mesh receiveShadow position={[0, 0, 0]}>
              <boxGeometry args={[WORLD.roadWidth, 0.2, SEGMENT_LENGTH]} />
              <primitive object={roadMat} attach="material" />
            </mesh>
            {/* Shoulders (slightly raised dirt) */}
            <mesh position={[halfRoad + WORLD.shoulderWidth / 2, -0.05, 0]}>
              <boxGeometry args={[WORLD.shoulderWidth, 0.1, SEGMENT_LENGTH]} />
              <primitive object={grassMat} attach="material" />
            </mesh>
            <mesh position={[-halfRoad - WORLD.shoulderWidth / 2, -0.05, 0]}>
              <boxGeometry args={[WORLD.shoulderWidth, 0.1, SEGMENT_LENGTH]} />
              <primitive object={grassMat} attach="material" />
            </mesh>

            {/* Edge lines (white) along both road borders */}
            <mesh position={[halfRoad - 0.25, 0.12, 0]}>
              <boxGeometry args={[0.16, 0.02, SEGMENT_LENGTH * 0.85]} />
              <primitive object={edgeLineMat} attach="material" />
            </mesh>
            <mesh position={[-halfRoad + 0.25, 0.12, 0]}>
              <boxGeometry args={[0.16, 0.02, SEGMENT_LENGTH * 0.85]} />
              <primitive object={edgeLineMat} attach="material" />
            </mesh>
            {/* Center dashed line (yellow) between lanes 1 and 2 */}
            <mesh position={[0, 0.12, 0]}>
              <boxGeometry args={[0.16, 0.02, SEGMENT_LENGTH * 0.4]} />
              <primitive object={centerLineMat} attach="material" />
            </mesh>

            {/* Guardrail on the left shoulder (metal), with posts */}
            <mesh position={[-railX, 0.6, 0]}>
              <boxGeometry args={[0.18, 0.9, SEGMENT_LENGTH]} />
              <primitive object={railMat} attach="material" />
            </mesh>
            {Array.from({ length: 4 }, (_, p) => (
              <mesh key={p} position={[-railX, 0.3, -SEGMENT_LENGTH / 2 + (p + 0.5) * (SEGMENT_LENGTH / 4)]}>
                <boxGeometry args={[0.14, 0.6, 0.14]} />
                <primitive object={railPostMat} attach="material" />
              </mesh>
            ))}

            {/* Soft grass strip on the right shoulder (no rail) */}
            <mesh position={[railX, 0.05, 0]}>
              <boxGeometry args={[2, 0.12, SEGMENT_LENGTH]} />
              <primitive object={grassMat} attach="material" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Rolling hills (recycled) */}
      <group ref={hillGroupRef}>
        {hills.map((m, i) => (
          <mesh key={i} position={[m.x, m.height / 2 - 1, m.z]} frustumCulled={false}>
            <coneGeometry args={[m.radius, m.height, 6]} />
            <primitive object={hillMat} attach="material" />
          </mesh>
        ))}
      </group>

      {/* Roadside dark-green pines (recycled) */}
      <group ref={pineGroupRef}>
        {pines.map((tree, i) => (
          <group key={i} position={[tree.x, 0, tree.z]} scale={tree.scale}>
            <mesh position={[0, 1, 0]} castShadow>
              <cylinderGeometry args={[0.28, 0.4, 2, 6]} />
              <primitive object={trunkMat} attach="material" />
            </mesh>
            <mesh position={[0, 3.1, 0]} castShadow>
              <coneGeometry args={[1.5, 3.2, 7]} />
              <primitive object={pineMat} attach="material" />
            </mesh>
            <mesh position={[0, 4.6, 0]} castShadow>
              <coneGeometry args={[1.1, 2.6, 7]} />
              <primitive object={pineMat} attach="material" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

export default EndlessHighway
