import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { subscribeImpact } from '@/game/audio/impact'
import { useSettingsStore } from '@/stores/useSettingsStore'

// One fixed instanced pool; no per-frame allocations or per-particle meshes.
export function ImpactParticles({ playerStateRef }) {
  const mesh = useRef(), age = useRef(1), origin = useRef(0)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useEffect(() => subscribeImpact(() => {
    if (useSettingsStore.getState().reduceEffects || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    origin.current = playerStateRef.current?.lateralX || 0
    age.current = 0
  }), [playerStateRef])
  useFrame((_, dt) => {
    const target = mesh.current
    if (!target) return
    age.current += Math.min(dt, .05)
    const active = age.current < .45
    target.count = active ? (useSettingsStore.getState().quality === 'high' ? 12 : 6) : 0
    if (!active) return
    for (let i = 0; i < target.count; i++) {
      const t = age.current, angle = i * 2.399
      dummy.position.set(origin.current + Math.cos(angle) * t * 4, .8 + t * (2 + i % 3) - t * t * 7, Math.sin(angle) * t * 3)
      dummy.scale.setScalar(Math.max(0, .12 * (1 - t / .45)))
      dummy.updateMatrix()
      target.setMatrixAt(i, dummy.matrix)
    }
    target.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={mesh} args={[null, null, 12]} count={0} frustumCulled={false}><sphereGeometry args={[1, 4, 3]} /><meshBasicMaterial color="#efbd73" /></instancedMesh>
}
