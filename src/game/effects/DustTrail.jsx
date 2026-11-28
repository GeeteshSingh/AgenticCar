import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

export function DustTrail({ playerStateRef }) {
  const mesh = useRef(), time = useRef(0)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const reducedMotion = useMemo(() => window.matchMedia?.('(prefers-reduced-motion: reduce)'), [])
  useFrame((_, dt) => {
    const target = mesh.current, state = playerStateRef.current, settings = useSettingsStore.getState()
    if (!target || !state) return
    const reduced = settings.reduceEffects || reducedMotion?.matches
    const enabled = !reduced && settings.quality !== 'low' && useGameStore.getState().phase === 'playing' && Math.abs(state.speed) > 90
    target.count = enabled ? (settings.quality === 'high' ? 8 : 4) : 0
    if (!enabled) return
    time.current += Math.min(dt, .05)
    for (let i = 0; i < target.count; i++) {
      const age = (time.current * 1.7 + i / target.count) % 1
      dummy.position.set(state.lateralX + (i % 2 ? .8 : -.8) * (1 + age), .18 + age * .45, -1 - age * 5)
      dummy.scale.setScalar(.12 + age * .25)
      dummy.updateMatrix(); target.setMatrixAt(i, dummy.matrix)
    }
    target.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={mesh} args={[null, null, 8]} count={0} frustumCulled={false}><sphereGeometry args={[1, 4, 3]} /><meshBasicMaterial color="#aa9a7e" transparent opacity={.25} depthWrite={false} /></instancedMesh>
}
