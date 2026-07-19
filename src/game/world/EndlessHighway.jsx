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

// --- PUBLIC TUNABLE PARAMETERS -----------------------------------------

const BASE_SEGMENT_LENGTH = 40
const SEGMENT_COUNT = 40 // ~1600 units of road (extended coverage)
const CURVE_CONTROL_FACTOR = 2  // controls curve amplitude relative to segment length

// --- CONSTANT STATE ----------------------------------------------------

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

  // --- CURVE GENERATION -------------------------------------------------
  // Generate a multi-segment Bezier (chain of cubic Bezier curves) for road path
  // First, create control points that will dictate path curvature
  const controlPoints = useMemo(() => {
    // Create points that alternate between centerline and lateral offsets using noise
    const points = []
    // Create multiple control segments that will form a sequence of Bezier curves
    const smoothness = 0.02  // how sharply the curve changes direction
    const baseFlatness = 1.2   // controls how far control handles extend
    const curveCoefficient = BASE_SEGMENT_LENGTH * CURVE_CONTROL_FACTOR
    
    // Generate a path that winds laterally while moving forward
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const z = i * BASE_SEGMENT_LENGTH
      const cumulativeZ = z
      
      // Add lateral offset using a slow noise function for organic flow
      const lateralNoise = Math.sin(i * 0.015) * (laneW * 1.5) * Math.sin(i * 0.03)
      const curveOffset = lateralNoise * (Math.cos(i * 0.02) * curveCoefficient)
      
      points.push({
        x: curveOffset,
        z: cumulativeZ,
        scale: 1 + Math.sin(i * 0.02) * 0.05,
      })
    }
    
    return points
  }, [SEGMENT_COUNT, BASE_SEGMENT_LENGTH])

  // Convert Bezier control points into segment positions using Catmull-Rom-like approach
  const positions = useMemo(() => {
    const posArr = []
    // Simulate a moving point along the curve at regular intervals
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const index = i
      const roadZ = index * BASE_SEGMENT_LENGTH
      
      // Use Bezier control points to simulate curve variation in X axis
      const curveControl = ((i / SEGMENT_COUNT) % 1) * Math.PI * 2
      const offsetX = Math.sin(curveControl) * (laneW * 0.8)
      
      posArr.push({
        x: offsetX,
        z: roadZ,
        rouxDeltaZ: BASE_SEGMENT_LENGTH,
      })
    }
    
    return posArr
  }, [SEGMENT_COUNT, BASE_SEGMENT_LENGTH])

  // Use original straight position generation if needed for fallback
  const basePositions = useMemo(
    () => Array.from({ length: SEGMENT_COUNT }, (_, i) => (i - 8) * BASE_SEGMENT_LENGTH),
    [],
  )
  
  // Generate curved road segments with smooth offset interpolation
  const curvedPositions = useMemo(() => {
    const laneW = WORLD.roadWidth / WORLD.laneCount
    const curveAmplitude = laneW * 0.35  // controls curve severity
    const curveFrequency = 0.025
    
    return Array.from({ length: SEGMENT_COUNT }, (_, i) => {
      const z = (i - 8) * BASE_SEGMENT_LENGTH
      // Apply smooth sine-based curve for gentle road curvature
      const curvePhase = (z / BASE_SEGMENT_LENGTH) * Math.PI * 2.5
      const lateralOffset = Math.sin(curvePhase) * curveAmplitude
      // Add small random variation for organic feel
      const randomJitter = Math.sin(i * 0.317) * 2.5
      
      return {
        baseZ: z,
        offsetX: lateralOffset + randomJitter,
      }
    })
  }, [SEGMENT_COUNT, BASE_SEGMENT_LENGTH])

  // Dashed markings per segment for the two inner dividers.
  const dashOffsets = useMemo(() => {
    const dash = 4
    const gap = 5
    const step = dash + gap
    const offsets = []
    const start = -BASE_SEGMENT_LENGTH / 2 + gap / 2
    for (let z = start; z < BASE_SEGMENT_LENGTH / 2; z += step) offsets.push(z)
    return offsets
  }, [])

  // Rolling hills — fixed recycled pool, kept well clear of the road.
  const hills = useMemo(() => {
    const arr = []
    const perSide = 3
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      for (let h = 0; h < perSide; h++) {
        const curveIndex = i / SEGMENT_COUNT
        const z = i * BASE_SEGMENT_LENGTH + (h / perSide) * BASE_SEGMENT_LENGTH
        const side = (i + h) % 2 === 0 ? 1 : -1
        const height = 22 + ((i * 11 + h * 7) % 26)
        const radius = 30 + ((i + h) % 3) * 10 + Math.sin(i * 0.1) * 5
        const x = side * (halfRoad + WORLD.shoulderWidth + radius + 22 + (h % 2) * 20)
        arr.push({ x, z, height, radius, key: `h${i}_${h}_curve${i}` })
      }
    }
    return arr
  }, [halfRoad])

  // Roadside dark-green pines (recycled) with compact placement patterns
  const pines = useMemo(() => {
    const arr = []
    const perSide = 5
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      for (let t = 0; t < perSide; t++) {
        const z = i * BASE_SEGMENT_LENGTH + (t / perSide) * BASE_SEGMENT_LENGTH - BASE_SEGMENT_LENGTH / 2
        const side = (i + t) % 2 === 0 ? 1 : -1
        const r = ((i * 928371 + t * 12347) % 1000) / 1000
        const r2 = ((i * 53341 + t * 7717) % 1000) / 1000
        const dist = WORLD.roadWidth / 2 + WORLD.shoulderWidth + 9 + r * 26
        const x = side * dist
        const scale = 0.8 + r2 * 0.6
        // Add some variation in scaling for compact pine clusters
        arr.push({
          x, z, scale, key: `t${i}_${t}_curve${i}`, 
          rotation: ((i * 928371 + t * 12347) % 360) * 0.0174533,
        })
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
      const recycleZ = -BASE_SEGMENT_LENGTH * 4
      for (let i = 0; i < group.current.children.length; i++) {
        const seg = group.current.children[i]
        seg.position.z -= scrollSpeed * dt
        if (seg.position.z < recycleZ) {
          let maxZ = -Infinity
          for (let j = 0; j < group.current.children.length; j++) {
            maxZ = Math.max(maxZ, group.current.children[j].position.z)
          }
          seg.position.z = maxZ + BASE_SEGMENT_LENGTH
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
        {positions.map((seg, i) => (
          <group key={i} position={[seg.offsetX || 0, 0, seg.z]}>
            {/* Asphalt surface (slab, top at ROAD_TOP) */}
            <mesh receiveShadow position={[0, ROAD_TOP - 0.15, 0]}>
              <boxGeometry args={[WORLD.roadWidth, 0.3, BASE_SEGMENT_LENGTH]} />
              <primitive object={mats.road} attach="material" />
            </mesh>
            {/* Darker apron just below the asphalt edge for a crisp curb line */}
            <mesh position={[0, GROUND_TOP - 0.02, 0]}>
              <boxGeometry args={[WORLD.roadWidth + 0.1, 0.06, BASE_SEGMENT_LENGTH]} />
              <primitive object={mats.roadEdge} attach="material" />
            </mesh>

            {/* Grass shoulders (calm green, readable transition to terrain) */}
            {[1, -1].map((s) => (
              <mesh key={s * 10 + i} position={[s * (halfRoad + WORLD.shoulderWidth / 2), GROUND_TOP, seg.z]}>
                <boxGeometry args={[WORLD.shoulderWidth, 0.06, BASE_SEGMENT_LENGTH]} />
                <primitive object={mats.shoulder} attach="material" />
              </mesh>
            ))}

            {/* Solid white edge lines along both outer borders */}
            {[edgeX, -edgeX].map((x) => (
              <mesh key={`${x}_${i}`} position={[x, MARKING_Y, seg.z]}>
                <boxGeometry args={[0.28, 0.04, BASE_SEGMENT_LENGTH * 0.98]} />
                <primitive object={mats.laneLine} attach="material" />
              </mesh>
            ))}

            {/* Dashed lane dividers (inner, +/-laneW) */}
            {innerDividerX.map((x) =>
              dashOffsets.map((dz, k) => (
                <mesh key={`${x}_${dz}_${i}`} position={[x, MARKING_Y, dz]}>{/* Fixed Z offset */}
                  <boxGeometry args={[0.24, 0.04, 4]} />
                  <primitive object={mats.centerLine} attach="material" />
                </mesh>
              )),
            )}

            {/* Solid median (between opposite directions) */}
            <mesh position={[medianX, MARKING_Y, seg.z]}>
              <boxGeometry args={[0.28, 0.04, BASE_SEGMENT_LENGTH * 0.98]} />
              <primitive object={mats.laneLine} attach="material" />
            </mesh>

            {/* Guardrails on both shoulders (metal), with posts */}
            {[1, -1].map((s) => (
              <group key={s * 10 + i}>
                <mesh position={[s * railX, 0.6, seg.z]}>
                  <boxGeometry args={[0.18, 0.9, BASE_SEGMENT_LENGTH]} />
                  <primitive object={mats.rail} attach="material" />
                </mesh>
                {Array.from({ length: 4 }, (_, p) => (
                  <mesh
                    key={p}
                    position={[s * railX, 0.3, seg.z - BASE_SEGMENT_LENGTH / 2 + (p + 0.5) * (BASE_SEGMENT_LENGTH / 4)]}
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
          <group key={tree.key} position={[tree.x, GROUND_TOP, tree.z]} rotation={[0, 0, tree.rotation]} scale={tree.scale}>
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
