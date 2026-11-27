import * as THREE from 'three'
import { useGameStore } from '@/stores/useGameStore'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { playerVehicle } from '@/game/config/playerVehicles'

function Box({position, size, color, metalness=.25, ...props}) {
  return <RoundedBox args={size} radius={.06} smoothness={2} position={position} castShadow {...props}><meshStandardMaterial color={color} metalness={metalness} roughness={.35}/></RoundedBox>
}
function Tube({a,b,r=.035,color='#282d31'}) {
  const mid=a.map((v,i)=>(v+b[i])/2), direction=b.map((v,i)=>v-a[i])
  const length=Math.hypot(...direction)
  return <mesh position={mid} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), new THREE.Vector3(...direction).normalize())} castShadow><cylinderGeometry args={[r,r,length,10]}/><meshStandardMaterial color={color} metalness={.6} roughness={.3}/></mesh>
}
function Wheel({position,radius=.38,thin=false}) {
  const ref=useRef()
  useFrame((_,dt)=>{if(ref.current && useGameStore.getState().phase === 'playing')ref.current.rotation.x+=Math.min(dt,.05)*useGameStore.getState().speedKmh/3.6/radius})
  return <group position={position} ref={ref}><mesh rotation={[0,Math.PI/2,0]} castShadow><torusGeometry args={[radius,thin?.035:.105,8,24]}/><meshStandardMaterial color="#161b20" roughness={.85}/></mesh><mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[radius*.7,radius*.7,thin?.025:.17,12]}/><meshStandardMaterial color="#9ba8af" metalness={.8} roughness={.23} wireframe={thin}/></mesh></group>
}
export function PlayerCar({stateRef}) {
  const ref=useRef()
  const index=useSettingsStore(s=>s.vehicle)
  const v=playerVehicle(index), w=v.width,l=v.length,h=v.height
  useFrame(()=>{const s=stateRef.current;if(!ref.current)return;ref.current.position.x=s.lateralX;ref.current.rotation.set(s.bodyPitch-(s.roadPitch||0),s.yaw+(s.roadHeading||0),s.bodyRoll)})
  const two=v.type==='cycle'||v.type==='bike'
  return <group ref={ref} key={index}>
    {two ? <>
      <Wheel position={[0,.4,-l*.34]} radius={.38} thin={v.type==='cycle'}/><Wheel position={[0,.4,l*.34]} radius={.38} thin={v.type==='cycle'}/>
      {[[[0,.4,-l*.34],[0,.55,0]],[[0,.55,0],[0,1,-.3]],[[0,1,-.3],[0,.4,-l*.34]],[[0,.55,0],[0,1,.45]],[[0,1,.45],[0,1,-.3]],[[0,1,.45],[0,.4,l*.34]]].map(([a,b],i)=><Tube key={i} a={a} b={b} color={v.color} r={v.type==='bike'?.08:.035}/>)}
      <Tube a={[-.32,1.15,.45]} b={[.32,1.15,.45]}/><Box size={[.34,.12,.45]} position={[0,1.08,-.3]} color="#252930"/>
      {v.type==='bike'&&<Box size={[.38,.35,.55]} position={[0,.75,0]} color={v.color}/>}
    </> : <>
      <Box size={[w,.35,l]} position={[0,.55,0]} color={v.color}/>
      <Box size={[w*.9,.22,l*.94]} position={[0,.32,0]} color="#293039"/>
      {v.type==='supercar' ? <>
        <Box size={[w*.78,.28,l*.42]} position={[0,.78,-l*.08]} color="#172c34"/>
        <Box size={[w*.84,.09,l*.3]} position={[0,.59,l*.32]} color={v.color}/>
        <Box size={[w*.9,.08,.22]} position={[0,.94,-l*.43]} color="#222a2e"/>
      </> : v.type==='truck' ? <>
        <Box size={[w,h*.45,l*.27]} position={[0,h*.35,l*.32]} color={v.color}/>
        <Box size={[w*.86,h*.22,.06]} position={[0,h*.48,l*.46]} color="#233c47"/>
        <Box size={[w*.96,h*.65,l*.62]} position={[0,h*.48,-l*.16]} color="#a1a8a0"/>
        {[-.4,-.2,0,.2].map(z=><Box key={z} size={[w*1.01,.06,.08]} position={[0,h*.78,l*z]} color="#d3d5ca"/>)}
      </> : <>
        <Box size={[w*.86,h*.52,v.type==='bus'?l*.88:l*.49]} position={[0,h*.65,-l*.1]} color={v.type==='auto'?'#263a31':v.color}/>
        <Box size={[w*.8,h*.27,.06]} position={[0,h*.73,v.type==='bus'?l*.35:l*.15]} color="#273f4b"/>
        <Box size={[w*.78,h*.26,.06]} position={[0,h*.73,v.type==='bus'?-l*.54:-l*.35]} color="#273f4b"/>
        {[-1,1].map(side=><Box key={side} size={[.05,h*.25,v.type==='bus'?l*.75:l*.38]} position={[side*w*.44,h*.73,-l*.12]} color="#273f4b"/>)}
        <Box size={[w*.94,.12,v.type==='pickup'?l*.36:l*.4]} position={[0,h*.5,l*.3]} color={v.color}/>
        {v.type==='suv'&&<Wheel position={[0,.95,-l*.55]} radius={.37}/>}
      </>}
      {[-1,1].map(side=><group key={side}>
        {(v.type==='auto'?[-1]:[1,-1]).map(end=><Wheel key={end} position={[side*w*.48,.38,end*l*.33]}/>)}
        <Box size={[.28,.16,.08]} position={[side*w*.32,.65,l*.51]} color="#fff1c3"/>
        <Box size={[.28,.16,.08]} position={[side*w*.32,.65,-l*.51]} color="#e34d3e"/>
        <Box size={[.18,.12,.23]} position={[side*w*.53,h*.72,l*.13]} color={v.color}/>
      </group>)}
      {v.type==='auto'&&<Wheel position={[0,.38,l*.33]}/>}
      <Box size={[w*.9,.15,.13]} position={[0,.4,l*.52]} color="#5b6570"/>
      <Box size={[.6,.16,.02]} position={[0,.55,-l*.53]} color="#f0eccf"/>
      {[-.2,0,.2].map(x=><Box key={x} size={[.04,.2,.05]} position={[x,.64,l*.52]} color="#202831"/>)}
    </>}
  </group>
}
export default PlayerCar
