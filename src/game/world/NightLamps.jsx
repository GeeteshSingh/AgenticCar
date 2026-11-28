import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { roadFrame, terrainHeight } from './roadProfile'
import { nearBillboard } from './billboardClearance'

// A small fixed pool follows the road; emissive lamps avoid per-lamp lights.
export function NightLamps({ distanceRef, environment, time, cycle }) {
  const group = useRef()
  useFrame(() => {
    if (!group.current) return
    const distance = distanceRef.current || 0
    group.current.children.forEach((lamp, index) => {
      const absolute = (Math.floor(distance / 45) + index - 1) * 45
      lamp.visible = !nearBillboard(absolute)
      const z = absolute - distance, offset = index % 2 ? -10 : 10
      const road = roadFrame(z, distance, 1, environment)
      lamp.position.set(road.x + offset, road.y + terrainHeight(offset, absolute, environment), z)
      lamp.rotation.y = road.heading + (offset < 0 ? Math.PI : 0)
    })
  })
  if (time !== 'night' && !cycle) return null
  return <group ref={group}>{Array.from({ length: 8 }, (_, index) => <group key={index}>
    <mesh position={[0,3.2,0]}><cylinderGeometry args={[.08,.12,6.4,6]}/><meshStandardMaterial color="#59636a"/></mesh>
    <mesh position={[-.6,6.3,0]}><boxGeometry args={[1.3,.12,.12]}/><meshStandardMaterial color="#59636a"/></mesh>
    <mesh position={[-1.15,6.2,0]}><sphereGeometry args={[.23,8,6]}/><meshBasicMaterial color="#ffe4a4"/></mesh>
  </group>)}</group>
}
