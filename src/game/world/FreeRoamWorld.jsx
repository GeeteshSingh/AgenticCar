import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useKeyboardInput } from '@/game/input/useKeyboardInput'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { FreeRoamTraffic } from './FreeRoamTraffic'
import { PlayerCar } from '@/game/player/PlayerCar'
import { Atmosphere } from '@/game/environment/Environment'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { stepFreeRoam, nearbyFreeRoamPlace } from './freeRoamMotion'

const ROAD_POSITIONS = [-320, -160, 0, 160, 320]

const look = new THREE.Vector3(), cameraPosition = new THREE.Vector3()

export function FreeRoamWorld() {
  const phase = useGameStore(s => s.phase)
  const settings = useSettingsStore()
  const { actionsRef, consumeEdgeActions } = useKeyboardInput({ enabled: phase === 'playing' || phase === 'paused' })
  const motion = useRef({x: 0, z: -55, heading: 0, speed: 0})
  const car = useRef(), carVisual = useRef({lateralX:0,yaw:0,bodyPitch:0,bodyRoll:0})
  const sign = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#f2cc7a'; ctx.fillRect(0,0,512,96)
    ctx.fillStyle = '#432719'; ctx.font = 'bold 55px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('CHAI  ·  चाय',256,67)
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
  useEffect(() => () => sign.dispose(), [sign])
  const marketAd = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 512
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#8f4125'; ctx.fillRect(0,0,1024,512)
    ctx.fillStyle = '#efbb59'; ctx.fillRect(24,24,976,464)
    ctx.fillStyle = '#244c3a'; ctx.fillRect(44,44,936,424)
    ctx.fillStyle = '#f3d590'; ctx.beginPath(); ctx.arc(790,245,135,0,Math.PI*2); ctx.fill()
    ctx.fillStyle = '#dd7044'; ctx.beginPath(); ctx.ellipse(790,250,68,88,-.3,0,Math.PI*2); ctx.fill()
    ctx.fillStyle = '#75a65b'; ctx.beginPath(); ctx.ellipse(830,162,36,17,-.6,0,Math.PI*2); ctx.fill()
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff4dd'; ctx.font = 'bold 72px sans-serif'; ctx.fillText('DESERT',88,170)
    ctx.fillText('MARKET',88,255); ctx.font = '36px sans-serif'; ctx.fillText('Take a break. Browse local.',88,322)
    ctx.font = '24px sans-serif'; ctx.fillText('FICTIONAL SHOP',88,410)
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture
  }, [])
  useEffect(() => () => marketAd.dispose(), [marketAd])
  const roads = useMemo(() => {
    const parts = ROAD_POSITIONS.flatMap(offset => {
      const vertical = new THREE.PlaneGeometry(12, 652); vertical.rotateX(-Math.PI / 2); vertical.translate(offset, .01, 0)
      const horizontal = new THREE.PlaneGeometry(652, 12); horizontal.rotateX(-Math.PI / 2); horizontal.translate(0, .012, offset)
      return [vertical, horizontal]
    })
    const merged = mergeGeometries(parts); parts.forEach(part => part.dispose()); return merged
  }, [])
  useEffect(() => () => roads.dispose(), [roads])
  const elapsed = useRef(0), total = useRef(0), lastNearby = useRef('')
  useEffect(() => () => useGameStore.setState({ nearbyPlace: '' }), [])
  useFrame(({camera}, dt) => {
    for (const action of consumeEdgeActions()) {
      if (action === 'togglePause') useGameStore.getState().togglePause()
    }
    if (useGameStore.getState().phase !== 'playing') return
    const previous = motion.current
    const current = stepFreeRoam(previous, actionsRef.current, dt)
    motion.current = current
    total.current += Math.hypot(current.x - previous.x, current.z - previous.z)
    if (car.current) car.current.position.set(current.x, 0, current.z)
    carVisual.current.yaw = current.heading
    const forwardX = Math.sin(current.heading), forwardZ = Math.cos(current.heading)
    cameraPosition.set(current.x - forwardX * 10, 5, current.z - forwardZ * 10)
    camera.position.lerp(cameraPosition, 1 - Math.exp(-Math.min(dt,.05) * 6))
    look.set(current.x + forwardX * 8, 1, current.z + forwardZ * 8)
    camera.lookAt(look)
    const nearby = nearbyFreeRoamPlace(current.x, current.z, current.speed)
    if (nearby !== lastNearby.current) { lastNearby.current = nearby; useGameStore.setState({nearbyPlace: nearby ? `${nearby} · parked nearby` : ''}) }
    elapsed.current += Math.min(dt, .05)
    if (elapsed.current >= .15) {
      elapsed.current = 0
      useGameStore.getState().updateStats({speedKmh:current.speed, distanceMeters:total.current, topSpeed:Math.max(useGameStore.getState().topSpeed, Math.abs(current.speed))})
    }
  })
  return <group>
    <Atmosphere settings={settings}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.08,0]}><planeGeometry args={[1600,1600]}/><meshStandardMaterial color="#cfad75" roughness={1}/></mesh>
    <mesh geometry={roads}><meshStandardMaterial color="#343b3e"/></mesh>
    <group position={[-28,0,164]}>
      <mesh position={[0,1.8,0]}><boxGeometry args={[9,3.6,7]}/><meshStandardMaterial color="#e4d1a0"/></mesh>
      <mesh position={[0,3.8,0]}><boxGeometry args={[11,.4,9]}/><meshStandardMaterial color="#ac442e"/></mesh>
      <mesh position={[0,2,-3.6]}><boxGeometry args={[4,1,.1]}/><meshBasicMaterial color="#cf6636"/></mesh>
    </group>
    <group position={[188,0,4]}>
      <mesh position={[0,2,0]}><boxGeometry args={[10,4,7]}/><meshStandardMaterial color="#d5aa72"/></mesh>
      <mesh position={[0,4.1,0]}><boxGeometry args={[11,.3,8]}/><meshStandardMaterial color="#664335"/></mesh>
      <mesh position={[0,1.7,-3.55]}><boxGeometry args={[5,2,.1]}/><meshStandardMaterial color="#533522"/></mesh>
    </group>
    <group position={[188,0,164]}>
      <mesh position={[0,2.3,0]}><boxGeometry args={[12,4.6,8]}/><meshStandardMaterial color="#dbb680"/></mesh>
      <mesh position={[0,4.7,0]}><boxGeometry args={[13,.3,9]}/><meshStandardMaterial color="#744e36"/></mesh>
      <mesh position={[0,2,-4.05]}><boxGeometry args={[4,2.8,.1]}/><meshStandardMaterial color="#3a4942"/></mesh>
      <mesh position={[0,8,-1]}><boxGeometry args={[16,6,.18]}/><meshBasicMaterial map={marketAd}/></mesh>
    </group>
    <group position={[28,0,4]}>
      <mesh position={[0,2,0]}><boxGeometry args={[8,4,6]}/><meshStandardMaterial color="#c48c57"/></mesh>
      <mesh position={[0,4.15,0]}><boxGeometry args={[9,.3,7]}/><meshStandardMaterial color="#804732"/></mesh>
      <mesh position={[0,1.8,-3.04]}><boxGeometry args={[3,2.5,.1]}/><meshStandardMaterial color="#6c4430"/></mesh>
      <mesh position={[0,3.2,-3.12]}><boxGeometry args={[6,.6,.12]}/><meshBasicMaterial map={sign}/></mesh>
    </group>
    <FreeRoamTraffic />
    <group ref={car}><PlayerCar stateRef={carVisual}/></group>
  </group>
}
