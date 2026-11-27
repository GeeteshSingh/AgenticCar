import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Merge repeated parts per pooled vehicle so wheels and lights don't each add a draw call.
function mergedBoxes(boxes) {
  const parts = boxes.map(([x, y, z, w, h, l]) => {
    const geometry = new THREE.BoxGeometry(w, h, l)
    geometry.translate(x, y, z)
    return geometry
  })
  const merged = mergeGeometries(parts)
  parts.forEach(geometry => geometry.dispose())
  return merged
}
function wheels(w, l) {
  const parts = []
  for (const x of [-w * .46, w * .46]) for (const z of [-l * .32, l * .32]) {
    const wheel = new THREE.CylinderGeometry(.33, .33, .2, 10)
    wheel.rotateZ(Math.PI / 2); wheel.translate(x, .32, z); parts.push(wheel)
  }
  const merged = mergeGeometries(parts)
  parts.forEach(geometry => geometry.dispose())
  return merged
}
export function TrafficVehicle({ vehicleRef }) {
  const w = vehicleRef?.width ?? 2, l = vehicleRef?.length ?? 4, h = vehicleRef?.height ?? 1.4
  const color = vehicleRef?.color ?? '#ef4444', flashed = (vehicleRef?.flash ?? 0) > 0
  const type = vehicleRef?.type
  const parts = useMemo(() => ({
    wheels: wheels(w, l),
    headlights: mergedBoxes([-1, 1].map(side => [side * w * .32, h * .4, l / 2 + .02, .3, .12, .05])),
    taillights: mergedBoxes([-1, 1].map(side => [side * w * .32, h * .4, -l / 2 - .02, .3, .12, .05])),
  }), [w, l, h])
  useEffect(() => () => { parts.wheels.dispose(); parts.headlights.dispose(); parts.taillights.dispose() }, [parts])
  const truck = type === 'truck'
  return <group>
    <mesh castShadow position={[0, h * .3, 0]}><boxGeometry args={[w, h * .42, l]}/><meshStandardMaterial color={flashed ? '#fff' : color} metalness={.25} roughness={.55}/></mesh>
    <mesh castShadow position={[0, h * .72, truck ? l * .28 : -l * .04]}><boxGeometry args={[w * .84, h * .43, truck ? l * .24 : l * .5]}/><meshStandardMaterial color="#283c43" metalness={.3} roughness={.3}/></mesh>
    {truck && <mesh position={[0, h * .66, -l * .14]}><boxGeometry args={[w * .94, h * .7, l * .6]}/><meshStandardMaterial color="#a4a99a" roughness={.8}/></mesh>}
    <mesh geometry={parts.wheels}><meshStandardMaterial color="#171c1c" roughness={.9}/></mesh>
    <mesh geometry={parts.headlights}><meshStandardMaterial color="#f7e6c3" emissive="#bd9270" emissiveIntensity={.5}/></mesh>
    <mesh geometry={parts.taillights}><meshStandardMaterial color="#df4133" emissive="#c12f25" emissiveIntensity={.8}/></mesh>
  </group>
}
export default TrafficVehicle
