import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD } from '@/game/config/gameConfig'
import { roadFrame, terrainHeight, WORLD_PALETTES } from './roadProfile'

const LENGTH = 48
const COUNT = 16
const STEPS = 12
const WIDTHS = [-320, -180, -100, -55, -26, -10, 10, 26, 55, 100, 180, 320]
const TEMP = new THREE.Object3D()

// Fixed geometry pools; positions are rewritten in place. Adjacent strips
// sample identical absolute coordinates at their seam, including on recycle.
function makeStrip(offsets, steps = STEPS) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array((steps + 1) * offsets.length * 3)
  const indices = []
  for (let z = 0; z < steps; z++) {
    for (let x = 0; x < offsets.length - 1; x++) {
      const a = z * offsets.length + x
      indices.push(a, a + offsets.length, a + 1, a + 1, a + offsets.length, a + offsets.length + 1)
    }
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage))
  geometry.setIndex(indices)
  return geometry
}

function writeStrip(geometry, offsets, start, distance, environment, lift, terrain = false, frames) {
  const points = geometry.attributes.position.array
  for (let i = 0; i <= STEPS; i++) {
    const z = start + i * LENGTH / STEPS
    const frame = frames ? frames[i] : roadFrame(z, distance)
    for (let j = 0; j < offsets.length; j++) {
      const k = (i * offsets.length + j) * 3
      points[k] = frame.x + offsets[j]
      points[k + 1] = frame.y + lift + (terrain ? terrainHeight(offsets[j], distance + z, environment) : 0)
      points[k + 2] = z
    }
  }
  geometry.attributes.position.needsUpdate = true
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
}

export function EndlessHighway({ scrollRef, distanceRef, settings = {} }) {
  const travelled = useRef(0)
  const trees = useRef()
  const trunks = useRef()
  const rocks = useRef()
  const environment = settings.environment || 'countryside'
  const palette = WORLD_PALETTES[environment] || WORLD_PALETTES.countryside
  const materials = useMemo(() => ({
    ground: new THREE.MeshStandardMaterial({ roughness: 1 }),
    shoulder: new THREE.MeshStandardMaterial({ roughness: 1 }),
    road: new THREE.MeshStandardMaterial({ color: '#333b43', roughness: 0.98 }),
    white: new THREE.MeshBasicMaterial({ color: '#e6e5ce' }),
    yellow: new THREE.MeshBasicMaterial({ color: '#efcc81' }),
    water: new THREE.MeshStandardMaterial({ color: '#559ba9', roughness: 0.35, metalness: 0.2 }),
  }), [])
  useEffect(() => {
    materials.ground.color.set(palette.ground)
    materials.shoulder.color.set(palette.shoulder)
  }, [materials, palette])
  useEffect(() => () => Object.values(materials).forEach((material) => material.dispose()), [materials])
  const half = WORLD.roadWidth / 2
  const strips = useMemo(() => Array.from({ length: COUNT }, () => ({
    ground: makeStrip(WIDTHS),
    water: makeStrip([26, 400]),
    road: makeStrip([-half, half]),
    shoulder: makeStrip([-10, -half, half, 10]),
    lines: [-half + 0.25, -4, 0, 4, half - 0.25].map((x) => ({ x, geometry: makeStrip([x - 0.065, x + 0.065]) })),
  })), [half])
  useEffect(() => () => {
    for (const strip of strips) {
      strip.ground.dispose(); strip.road.dispose(); strip.shoulder.dispose(); strip.water.dispose()
      for (const line of strip.lines) line.geometry.dispose()
    }
  }, [strips])

  useFrame((_, dt) => {
    if (distanceRef) travelled.current = distanceRef.current
    else travelled.current += Math.max(0, scrollRef?.current || 0) * Math.min(dt, 0.1)
    const distance = travelled.current
    const base = Math.floor(distance / LENGTH) * LENGTH - distance - LENGTH * 2
    for (let i = 0; i < COUNT; i++) {
      const start = base + i * LENGTH
      const strip = strips[i]
      const frames = Array.from({ length: STEPS + 1 }, (_, row) => roadFrame(start + row * LENGTH / STEPS, distance))
      if (environment === 'coast') writeStrip(strip.water, [26, 400], start, distance, environment, -3, false, frames)
      writeStrip(strip.ground, WIDTHS, start, distance, environment, -0.08, true, frames)
      writeStrip(strip.shoulder, [-10, -half, half, 10], start, distance, environment, -0.03, false, frames)
      writeStrip(strip.road, [-half, half], start, distance, environment, 0, false, frames)
      for (const line of strip.lines) {
        writeStrip(line.geometry, [line.x - 0.065, line.x + 0.065], start, distance, environment, 0.018, false, frames)
        // Turn off alternate quads in lane markers using degenerate triangles.
        if (Math.abs(line.x) !== half - 0.25) {
          const indices = line.geometry.index.array
          for (let row = 0; row < STEPS; row++) {
            const a = row * 2
            const hidden = ((Math.round((distance + start) / 4) + row) % 3 + 3) % 3 === 0
            indices.set(hidden ? [a, a, a, a, a, a] : [a, a + 2, a + 1, a + 1, a + 2, a + 3], row * 6)
          }
          line.geometry.index.needsUpdate = true
        }
      }
    }
    if (!trees.current || !trunks.current || !rocks.current) return
    const low = settings.quality === 'low'
    for (let i = 0; i < 240; i++) {
      const side = i % 2 === 0 ? -1 : 1
      const globalZ = (Math.floor(distance / 8) + Math.floor(i / 2) - 10) * 8
      const z = globalZ - distance
      const frame = roadFrame(z, distance)
      const cell = Math.floor(globalZ / 8)
      const hash = (n, m) => ((n % m) + m) % m
      const offset = side * (16 + hash(cell * 37, 60))
      const scale = 0.8 + hash(cell * 13, 10) / 10
      const visible = (!low || hash(cell, 3) === 0) && !(environment === 'coast' && side > 0) && !(environment === 'desert' && hash(cell, 5) !== 0)
      const y = frame.y + terrainHeight(offset, globalZ, environment)
      TEMP.position.set(frame.x + offset, y + scale * 3, z)
      TEMP.rotation.set(0, cell, 0)
      TEMP.scale.set(visible ? scale : 0, visible ? scale : 0, visible ? scale : 0)
      TEMP.updateMatrix(); trees.current.setMatrixAt(i, TEMP.matrix)
      TEMP.position.y = y + scale
      TEMP.scale.set(visible ? scale * 0.24 : 0, visible ? scale : 0, visible ? scale * 0.24 : 0)
      TEMP.updateMatrix(); trunks.current.setMatrixAt(i, TEMP.matrix)
      const rockOffset = side * (48 + hash(cell * 19, 220))
      TEMP.position.set(frame.x + rockOffset, frame.y + terrainHeight(rockOffset, globalZ, environment) - 3, z)
      TEMP.scale.set(7 + hash(cell, 8), 7 + hash(cell, 13), 8 + hash(cell, 5))
      TEMP.updateMatrix(); rocks.current.setMatrixAt(i, TEMP.matrix)
    }
    trees.current.instanceMatrix.needsUpdate = true
    trunks.current.instanceMatrix.needsUpdate = true
    rocks.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      {strips.map((strip, i) => <group key={i}>
        {environment === 'coast' && <mesh geometry={strip.water} material={materials.water} />}
        <mesh geometry={strip.ground} material={materials.ground} receiveShadow />
        <mesh geometry={strip.shoulder} material={materials.shoulder} receiveShadow />
        <mesh geometry={strip.road} material={materials.road} receiveShadow />
        {strip.lines.map((line) => <mesh key={line.x} geometry={line.geometry} material={line.x === 0 ? materials.yellow : materials.white} />)}
      </group>)}
      <instancedMesh ref={trees} args={[null, null, 240]} frustumCulled={false}>
        <coneGeometry args={[2.2, 6, 6]} /><meshStandardMaterial color={palette.foliage} roughness={1} />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[null, null, 240]} frustumCulled={false}>
        <cylinderGeometry args={[1, 1.4, 2, 5]} /><meshStandardMaterial color="#635244" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={rocks} args={[null, null, 240]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} /><meshStandardMaterial color={palette.hills} roughness={1} />
      </instancedMesh>

    </group>
  )
}

export default EndlessHighway
