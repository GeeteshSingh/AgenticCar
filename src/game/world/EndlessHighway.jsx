import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD } from '@/game/config/gameConfig'

// Recycled endless highway rendered as a calm, low-poly road landscape. A pool
// of road segments scrolls toward the camera (the car is fixed at z=0; the
// world moves -z). Segments / scenery that pass behind the player are
// repositioned ahead. No unbounded object creation: fixed pools of meshes are
// reused, and all meshes share a small set of memoized materials.
//
// Coordinate contract:
//   - Road surface top sits at y = ROAD_TOP.
//   - Ground (grass) top sits at y = GROUND_TOP (just below the road).
//   - The player car group is placed at y = ROAD_TOP so its wheels rest on the
//     asphalt.
//   - The road spans the full lane width (WORLD.roadWidth) and remains continuous
//     both behind the camera and toward the horizon.

const SEGMENT_LENGTH = 40
const SEGMENT_COUNT = 30 // ~1200 units of road (covers view + recycle slack)
const ROAD_TOP = WORLD.roadTop
const GROUND_TOP = 0.0
const MARKING_Y = ROAD_TOP + 0.02

export function EndlessHighway({ scrollRef }) {
  const groupRef = useRef()

  // ---- Shared materials (created once; reused by every segment) ----
  const mats = useMemo(() => {
    const std = (color, extra = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.95, ...extra })
    return {
      road: std('#7c828a', { roughness: 0.85 }),
      roadEdge: std('#4a5158'),
      ground: std('#6b8a45', { roughness: 1 }),
      shoulder: std('#7a9a52', { roughness: 1 }),
      laneLine: std('#f3f4f6', { emissive: '#cfd2d6', emissiveIntensity: 0.15 }),
      centerLine: std('#f2c84b', { emissive: '#f2c84b', emissiveIntensity: 0.2 }),
      rail: std('#aeb6c2', { metalness: 0.6, roughness: 0.4 }),
      railPost: std('#7b828c', { metalness: 0.5, roughness: 0.5 }),
      trunk: std('#4b3621', { roughness: 1 }),
      pine: std('#27502f', { roughness: 1 }),
    }
  }, [])

  const halfRoad = WORLD.roadWidth / 2
  const railX = halfRoad + WORLD.shoulderWidth
  const laneW = WORLD.roadWidth / WORLD.laneCount

  // X positions of painted lines for laneCount=4:
  //   edges at +/-halfRoad, inner dividers at +/-laneW, median at 0.
  const edgeX = halfRoad - 0.3
  const innerDividerX = [-(halfRoad - laneW), halfRoad - laneW]
  const medianX = 0

  // Precompute segment base offsets. Start several segments behind the car so
  // the road is continuous under and behind the camera on the very first frame.
  const positions = useMemo(
    () => Array.from({ length: SEGMENT_COUNT }, (_, i) => (i - 8) * SEGMENT_LENGTH),
    [],
  )

  // Dashed markings per segment for the two inner dividers.
  const dashOffsets = useMemo(() => {
    const dash = 4
    const gap = 5
    const step = dash + gap
    const offsets = []
    const start = -SEGMENT_LENGTH / 2 + gap / 2
    for (let z = start; z < SEGMENT_LENGTH / 2; z += step) offsets.push(z)
    return offsets
  }, [])

  // Rolling hills — fixed recycled pool, kept well clear of the road.
  const hills = useMemo(() => {
    const arr = []
    const perSide = 2
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      for (let h = 0; h < perSide; h++) {
        const z = i * SEGMENT_LENGTH + (h / perSide) * SEGMENT_LENGTH
        const side = (i + h) % 2 === 0 ? 1 : -1
        const height = 22 + ((i * 11 + h * 7) % 26)
        const radius = 30 + ((i + h) % 3) * 10
        const x = side * (halfRoad + WORLD.shoulderWidth + radius + 22 + (h % 2) * 20)
        arr.push({ x, z, height, radius, key: `h${i}_${h}` })
      }
    }
    return arr
  }, [halfRoad])

  // Roadside pines — recycled pool with natural-looking jitter + clustering.
  const pines = useMemo(() => {
    const arr = []
    const perSide = 5
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      for (let t = 0; t < perSide; t++) {
        const z = i * SEGMENT_LENGTH + (t / perSide) * SEGMENT_LENGTH - SEGMENT_LENGTH / 2
        const side = (i + t) % 2 === 0 ? 1 : -1
        // pseudo-random but deterministic jitter so placement isn't mirrored
        const r = ((i * 928371 + t * 12347) % 1000) / 1000
        const r2 = ((i * 53341 + t * 7717) % 1000) / 1000
        const dist = WORLD.roadWidth / 2 + WORLD.shoulderWidth + 9 + r * 26
        const x = side * dist
        const scale = 0.8 + r2 * 0.6
        arr.push({ x, z, scale, key: `t${i}_${t}` })
      }
    }
    return arr
  }, [halfRoad])

  const roadGroupRef = useRef()
  const hillGroupRef = useRef()
  const pineGroupRef = useRef()

  useFrame((_, dt) => {
    const scrollSpeed = scrollRef?.current ?? 0
    const scrollAndRecycle = (group) => {
      if (!group?.current) return
      // Threshold: keep chunks until they are well behind the camera so the
      // road never disappears under/behind the player.
      const recycleZ = -SEGMENT_LENGTH * 4
      for (let i = 0; i < group.current.children.length; i++) {
        const seg = group.current.children[i]
        seg.position.z -= scrollSpeed * dt
        if (seg.position.z < recycleZ) {
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

  return (
    <group ref={groupRef}>
      {/* Broad ground (readable low-poly grass, never black) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_TOP, 0]} receiveShadow>
        <planeGeometry args={[WORLD.groundWidth, WORLD.groundLength]} />
        <primitive object={mats.ground} attach="material" />
      </mesh>

      {/* Road + markings + guardrail train */}
      <group ref={roadGroupRef}>
        {positions.map((z, i) => (
          <group key={i} position={[0, 0, z]}>
            {/* Asphalt surface (slab, top at ROAD_TOP) */}
            <mesh receiveShadow position={[0, ROAD_TOP - 0.15, 0]}>
              <boxGeometry args={[WORLD.roadWidth, 0.3, SEGMENT_LENGTH]} />
              <primitive object={mats.road} attach="material" />
            </mesh>
            {/* Darker apron just below the asphalt edge for a crisp curb line */}
            <mesh position={[0, GROUND_TOP - 0.02, 0]}>
              <boxGeometry args={[WORLD.roadWidth + 0.1, 0.06, SEGMENT_LENGTH]} />
              <primitive object={mats.roadEdge} attach="material" />
            </mesh>

            {/* Grass shoulders (calm green, readable transition to terrain) */}
            {[1, -1].map((s) => (
              <mesh key={s} position={[s * (halfRoad + WORLD.shoulderWidth / 2), GROUND_TOP, 0]}>
                <boxGeometry args={[WORLD.shoulderWidth, 0.06, SEGMENT_LENGTH]} />
                <primitive object={mats.shoulder} attach="material" />
              </mesh>
            ))}

            {/* Solid white edge lines along both outer borders */}
            {[edgeX, -edgeX].map((x) => (
              <mesh key={x} position={[x, MARKING_Y, 0]}>
                <boxGeometry args={[0.28, 0.04, SEGMENT_LENGTH * 0.98]} />
                <primitive object={mats.laneLine} attach="material" />
              </mesh>
            ))}

            {/* Dashed lane dividers (inner, +/-laneW) */}
            {innerDividerX.map((x) =>
              dashOffsets.map((dz, k) => (
                <mesh key={`${x}_${k}`} position={[x, MARKING_Y, dz]}>
                  <boxGeometry args={[0.24, 0.04, 4]} />
                  <primitive object={mats.centerLine} attach="material" />
                </mesh>
              )),
            )}

            {/* Solid median (between opposite directions) */}
            <mesh position={[medianX, MARKING_Y, 0]}>
              <boxGeometry args={[0.28, 0.04, SEGMENT_LENGTH * 0.98]} />
              <primitive object={mats.laneLine} attach="material" />
            </mesh>

            {/* Guardrails on both shoulders (metal), with posts */}
            {[1, -1].map((s) => (
              <group key={s}>
                <mesh position={[s * railX, 0.6, 0]}>
                  <boxGeometry args={[0.18, 0.9, SEGMENT_LENGTH]} />
                  <primitive object={mats.rail} attach="material" />
                </mesh>
                {Array.from({ length: 4 }, (_, p) => (
                  <mesh
                    key={p}
                    position={[s * railX, 0.3, -SEGMENT_LENGTH / 2 + (p + 0.5) * (SEGMENT_LENGTH / 4)]}
                  >
                    <boxGeometry args={[0.14, 0.6, 0.14]} />
                    <primitive object={mats.railPost} attach="material" />
                  </mesh>
                ))}
              </group>
            ))}
          </group>
        ))}
      </group>

      {/* Rolling hills (recycled) */}
      <group ref={hillGroupRef}>
        {hills.map((m) => (
          <mesh key={m.key} position={[m.x, GROUND_TOP + m.height / 2 - 0.5, m.z]} frustumCulled={false}>
            <coneGeometry args={[m.radius, m.height, 6]} />
            <primitive object={mats.pine} attach="material" />
          </mesh>
        ))}
      </group>

      {/* Roadside dark-green pines (recycled) */}
      <group ref={pineGroupRef}>
        {pines.map((tree) => (
          <group key={tree.key} position={[tree.x, GROUND_TOP, tree.z]} scale={tree.scale}>
            <mesh position={[0, 1, 0]} castShadow>
              <cylinderGeometry args={[0.28, 0.4, 2, 6]} />
              <primitive object={mats.trunk} attach="material" />
            </mesh>
            <mesh position={[0, 3.1, 0]} castShadow>
              <coneGeometry args={[1.5, 3.2, 7]} />
              <primitive object={mats.pine} attach="material" />
            </mesh>
            <mesh position={[0, 4.6, 0]} castShadow>
              <coneGeometry args={[1.1, 2.6, 7]} />
              <primitive object={mats.pine} attach="material" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

export default EndlessHighway
