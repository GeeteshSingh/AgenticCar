import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { TrafficVehicle } from '@/game/traffic/TrafficVehicle'
import { useGameStore } from '@/stores/useGameStore'

// Bounded ambient traffic on the prototype grid; it does not yet collide or turn.
const VEHICLES = [
  {axis:'z', road:0, direction:1, start:80, speed:10, color:'#a43b2e'},
  {axis:'z', road:0, direction:-1, start:220, speed:12, color:'#d6a547'},
  {axis:'x', road:0, direction:1, start:-120, speed:9, color:'#426b75'},
  {axis:'x', road:0, direction:-1, start:170, speed:11, color:'#e4d8c1'},
  {axis:'z', road:160, direction:1, start:-160, speed:8, color:'#b86835', type:'truck', width:2.4, length:7, height:2.6},
  {axis:'z', road:-160, direction:-1, start:80, speed:10, color:'#758665'},
  {axis:'x', road:160, direction:1, start:50, speed:9, color:'#c07146'},
  {axis:'x', road:-160, direction:-1, start:-220, speed:12, color:'#6c7883'},
]
const SPAN = 640
export function trafficAtTime(time) {
  return VEHICLES.map(v => {
    const p = ((v.start + v.direction * v.speed * time + SPAN / 2) % SPAN + SPAN) % SPAN - SPAN / 2
    const lane = v.road + (v.direction > 0 ? 2 : -2)
    return v.axis === 'z' ? { x:lane, z:p, halfX:5, halfZ:10 } : { x:p, z:lane, halfX:10, halfZ:5 }
  })
}
export function FreeRoamTraffic({ timeRef }) {
  const refs = useRef([]), time = useRef(0)
  useFrame((_, delta) => {
    if (useGameStore.getState().phase !== 'playing') return
    time.current += Math.min(delta, .05)
    if (timeRef) timeRef.current = time.current
    VEHICLES.forEach((vehicle, i) => {
      const group = refs.current[i]
      if (!group) return
      const position = ((vehicle.start + vehicle.direction * vehicle.speed * time.current + SPAN / 2) % SPAN + SPAN) % SPAN - SPAN / 2
      const lane = vehicle.road + (vehicle.direction > 0 ? 2 : -2)
      if (vehicle.axis === 'z') { group.position.set(lane, 0, position); group.rotation.y = vehicle.direction > 0 ? 0 : Math.PI }
      else { group.position.set(position, 0, lane); group.rotation.y = vehicle.direction > 0 ? Math.PI / 2 : -Math.PI / 2 }
    })
  })
  return <group>{VEHICLES.map((vehicle, i) => <group key={i} ref={node => { refs.current[i] = node }}><TrafficVehicle vehicleRef={vehicle} /></group>)}</group>
}
