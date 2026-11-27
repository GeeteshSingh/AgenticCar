import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { findBillboard } from '@/game/config/billboardConfig'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useGameStore } from '@/stores/useGameStore'
import { roadFrame, terrainHeight } from './roadProfile'

const SPACING = 400
const worldPosition = new THREE.Vector3()
const projection = new THREE.Matrix4()
const frustum = new THREE.Frustum()

export function Billboards({ distanceRef, environment }) {
  return <group>{Array.from({ length: 3 }, (_, slot) => <Billboard key={slot} slot={slot} distanceRef={distanceRef} environment={environment}/>)}</group>
}
function Billboard({ slot, distanceRef, environment }) {
  const group = useRef(), cellRef = useRef(-1), seenTime = useRef(0), eligible = useRef(false), lastDistance = useRef(0)
  const { camera, gl } = useThree()
  const quality = useSettingsStore(s => s.quality)
  const label = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = quality === 'low' ? 1024 : 2048; canvas.height = canvas.width / 2
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy())
    return { canvas, texture }
  }, [gl, quality])
  useEffect(() => { cellRef.current = -1; return () => label.texture.dispose() }, [label])
  useFrame((_, delta) => {
    if (!group.current) return
    if (useGameStore.getState().phase !== 'playing') { group.current.visible = false; return }
    group.current.visible = true
    const distance = distanceRef.current || 0
    const cell = Math.floor((distance + 100) / SPACING) + slot
    if (cell < 0) return
    if (cell !== cellRef.current) {
      cellRef.current = cell; seenTime.current = 0; eligible.current = false
      const brand = findBillboard(cell), ctx = label.canvas.getContext('2d')
      ctx.setTransform(label.canvas.width / 1024, 0, 0, label.canvas.height / 512, 0, 0)
      ctx.fillStyle = '#f6ead1'; ctx.fillRect(0, 0, 1024, 512)
      ctx.fillStyle = brand.color; ctx.fillRect(12, 12, 1000, 488)
      ctx.strokeStyle = '#f7e3b9'; ctx.lineWidth = 5; ctx.strokeRect(28, 28, 968, 456)
      ctx.fillStyle = '#f6ead1'; ctx.fillRect(0, 360, 1024, 2)
      ctx.textAlign = 'left'; ctx.fillStyle = '#fff8e8'; ctx.font = '700 80px sans-serif'; ctx.fillText(brand.name, 68, 165, 890)
      ctx.font = '600 56px sans-serif'; ctx.fillText(brand.hindi, 68, 245, 890)
      ctx.font = '44px sans-serif'; ctx.fillText(brand.tagline, 68, 312, 890)
      ctx.font = '24px sans-serif'; ctx.fillText('आपका सफ़र, आपकी राह', 68, 423, 600)
      ctx.textAlign = 'right'; ctx.font = '24px sans-serif'; ctx.fillText('FICTIONAL SPONSORED EXAMPLE', 954, 462, 540)
      label.texture.needsUpdate = true
    }
    const absolute = cell * SPACING + 160, z = absolute - distance, offset = 21
    const road = roadFrame(z, distance, 1, environment)
    group.current.position.set(road.x + offset, road.y + terrainHeight(offset, absolute, environment), z)
    group.current.rotation.y = road.heading
    group.current.updateWorldMatrix(true, false)
    worldPosition.set(0, 7, 0).applyMatrix4(group.current.matrixWorld)
    projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); frustum.setFromProjectionMatrix(projection)
    if (z > 0 && z < 110 && frustum.containsPoint(worldPosition)) seenTime.current += Math.min(delta, .1)
    if (seenTime.current >= .5) eligible.current = true
    if (eligible.current && lastDistance.current < absolute && distance >= absolute) {
      const brand = findBillboard(cell)
      useGameStore.getState().recordRoadFind({ id: brand.id, name: brand.name, tagline: brand.tagline, distance: absolute })
      eligible.current = false
    }
    lastDistance.current = distance
  })
  return <group ref={group} visible={false}>
    {[-3,3].map(x => <mesh key={`short-support-${x}`} position={[x, .95, .5]}><boxGeometry args={[.18,1.9,.18]}/><meshStandardMaterial color="#48545a"/></mesh>)}
    <mesh position={[0,7,0]} rotation={[0,Math.PI,0]}><planeGeometry args={[20,10]}/><meshBasicMaterial map={label.texture} side={THREE.DoubleSide}/></mesh>
  </group>
}
