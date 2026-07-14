import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { TrafficVehicle } from '@/game/traffic/TrafficVehicle'
import { trySpawnVehicle, spawnInterval, maxActiveVehicles, resetSpawnCounter } from '@/game/traffic/trafficSpawner'
import { TRAFFIC, laneCenterX } from '@/game/config/trafficConfig'
import { KMH_TO_MS, VEHICLE } from '@/game/config/vehicleConfig'
import { difficultyFromProgress } from '@/game/config/difficultyConfig'
import { assessCollision } from '@/game/collision/collisionSeverity'

// Manages a fixed pool of traffic vehicles. No create/destroy churn: a pool of
// N ref-states is recycled. Each pooled vehicle carries an `active` flag and a
// `rev` (revision) counter so the React mesh re-renders only when a slot is
// (re)used, never per animation frame.
//
// The player car is fixed near z=0 and only moves laterally. Traffic scrolls
// toward -z based on relative speed: same-direction cars are overtaken (drift
// past 0), oncoming cars approach at the combined speed.
//
// Collision detection: AABB overlap between the player (z~0, x=lateralX) and
// each active vehicle. On overlap, calls onCollision(assessment) once per
// vehicle (guarded by the vehicle's `hit` flag) so the host can apply damage,
// shake, and effects. The hit vehicle is recycled immediately to avoid
// re-triggering.
export function TrafficManager({ playerStateRef, playerSpeedRef, distanceRef, survivalRef, active, runToken, onCollision, cooldownRef, vehiclesRef }) {
  const poolRef = useRef(
    Array.from({ length: TRAFFIC.poolSize }, () => ({
      id: null,
      lane: 0,
      direction: 1,
      type: 'sedan',
      color: '#ef4444',
      width: 2,
      length: 4,
      height: 1.4,
      z: TRAFFIC.despawnDistance - 100,
      x: 0,
      speed: 0,
      active: false,
      hit: false,
      flash: 0,
      rev: 0,
    })),
  )
  const spawnTimerRef = useRef(0)
  const [, forceRender] = useState(0)

  const lastToken = useRef(null)
  if (active && lastToken.current !== runToken) {
    lastToken.current = runToken
    resetSpawnCounter()
    for (const v of poolRef.current) {
      v.active = false
      v.id = null
      v.hit = false
      v.flash = 0
      v.z = TRAFFIC.despawnDistance - 100
    }
    forceRender((n) => n + 1)
  }

  const laneX = (lane) => laneCenterX(lane)

  useFrame((_, dt) => {
    if (!active) return
    const playerSpeed = playerSpeedRef?.current ?? 0
    const playerMs = Math.max(0, playerSpeed) * KMH_TO_MS
    const t = difficultyFromProgress(distanceRef?.current ?? 0, survivalRef?.current ?? 0)
    const playerX = playerStateRef?.current?.lateralX ?? 0
    const inCooldown = (cooldownRef?.current ?? 0) > 0

    let changed = false
    for (const v of poolRef.current) {
      if (!v.active) continue
      const trafficMs = v.speed * KMH_TO_MS * v.direction
      const dz = -(playerMs - trafficMs) * dt
      v.z += dz
      if (v.flash > 0) v.flash = Math.max(0, v.flash - dt)

      if (v.z < TRAFFIC.despawnDistance) {
        v.active = false
        v.id = null
        v.hit = false
        changed = true
        continue
      }

      // Collision check (AABB on x/z)
      const halfPW = VEHICLE.width / 2
      const halfPL = VEHICLE.length / 2
      const halfVW = v.width / 2
      const halfVL = v.length / 2
      const overlapX = Math.abs(playerX - v.x) < halfPW + halfVW
      const overlapZ = Math.abs(0 - v.z) < halfPL + halfVL
      if (overlapX && overlapZ && !v.hit && !inCooldown) {
        v.hit = true
        v.flash = 0.25
        const assessment = assessCollision({
          playerSpeed,
          trafficSpeed: v.speed,
          direction: v.direction,
          impactKind: 'front',
        })
        assessment.vehicleId = v.id
        if (onCollision) onCollision(assessment)
        v.active = false
        v.id = null
        changed = true
      }
    }

    spawnTimerRef.current += dt
    const interval = spawnInterval(t)
    const cap = maxActiveVehicles(t)
    const activeCount = poolRef.current.reduce((n, v) => (v.active ? n + 1 : n), 0)
    if (spawnTimerRef.current >= interval && activeCount < cap) {
      spawnTimerRef.current = 0
      const spec = trySpawnVehicle({
        activeVehicles: poolRef.current
          .filter((v) => v.active)
          .map((v) => ({ lane: v.lane, z: v.z, length: v.length })),
        t,
        playerZ: 0,
      })
      if (spec) {
        const slot = poolRef.current.find((v) => !v.active)
        if (slot) {
          Object.assign(slot, spec, { active: true, hit: false, flash: 0, x: laneX(spec.lane), rev: slot.rev + 1 })
          changed = true
        }
      }
    }

    if (changed) forceRender((n) => n + 1)
    if (vehiclesRef) vehiclesRef.current = poolRef.current
  })

  return (
    <group>
      {poolRef.current.map((v, i) => (
        <PoolSlot key={i} vehicle={v} />
      ))}
    </group>
  )
}

function PoolSlot({ vehicle }) {
  const groupRef = useRef()
  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    g.visible = vehicle.active
    g.position.z = vehicle.z
    g.position.x = vehicle.x
    g.rotation.y = vehicle.direction < 0 ? Math.PI : 0
  })
  return (
    <group ref={groupRef} visible={false}>
      {vehicle.active && (
        <TrafficVehicle vehicleRef={vehicle} flash={vehicle.flash} rev={vehicle.rev} />
      )}
    </group>
  )
}

export default TrafficManager
