import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { roadFrame, terrainHeight } from './roadProfile'

const ROUTES = { thar_test: 'TEST ROUTE', kashmir: 'JAMMU & KASHMIR', countryside: 'DECCAN PLATEAU', forest: 'WESTERN GHATS', desert: 'THAR DESERT', coast: 'KONKAN COAST' }
const SPACING = 180
const COUNT = 5

// Original procedural wayfinding, not a replica of a real highway sign.
export function RouteLandmarks({ distanceRef, environment }) {
  return <group>{Array.from({ length: COUNT }, (_, i) => <Marker key={i} slot={i} distanceRef={distanceRef} environment={environment} />)}</group>
}

function Marker({ slot, distanceRef, environment }) {
  const ref = useRef()
  const previous = useRef('')
  const label = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 256
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
    return { canvas, texture }
  }, [])
  useEffect(() => () => label.texture.dispose(), [label])
  useFrame(() => {
    if (!ref.current) return
    const distance = distanceRef.current || 0
    const cell = Math.floor(distance / SPACING) + slot
    const absolute = cell * SPACING + 65
    const z = absolute - distance
    const frame = roadFrame(z, distance, 1, environment)
    const offset = 13
    ref.current.position.set(frame.x + offset, frame.y + terrainHeight(offset, absolute, environment), z)
    ref.current.rotation.y = frame.heading
    const key = `${environment}:${cell}`
    if (previous.current !== key) {
      previous.current = key
      const context = label.canvas.getContext('2d')
      context.fillStyle = '#135240'; context.fillRect(0, 0, 512, 256)
      context.strokeStyle = '#f5f1da'; context.lineWidth = 8; context.strokeRect(9, 9, 494, 238)
      context.textAlign = 'center'; context.fillStyle = '#f5f1da'; context.font = 'bold 32px sans-serif'
      context.fillText(ROUTES[environment] || ROUTES.countryside, 256, 65)
      context.font = '25px sans-serif'; context.fillText('भारत  ·  INDIA', 256, 112)
      context.font = 'bold 36px sans-serif'; context.fillText('KEEP LEFT', 256, 163)
      context.font = '24px sans-serif'; context.fillText(`${Math.floor(absolute / 1000)} km  •  SCENIC ROUTE`, 256, 211)
      label.texture.needsUpdate = true
    }
  })
  return <group ref={ref}>
    <mesh position={[0, 1.7, 0]}><cylinderGeometry args={[0.075, 0.075, 3.4, 5]} /><meshStandardMaterial color="#7a8586" /></mesh>
    <mesh position={[0, 3, 0]} rotation={[0, Math.PI, 0]}><planeGeometry args={[4.6, 2.3]} /><meshBasicMaterial map={label.texture} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0.9, 0.55, 0]}><boxGeometry args={[0.65, 1.1, 0.4]} /><meshStandardMaterial color="#f2efdc" /></mesh>
    <mesh position={[0.9, 1.14, 0]}><boxGeometry args={[0.67, 0.22, 0.42]} /><meshStandardMaterial color="#e2b53a" /></mesh>
  </group>
}
