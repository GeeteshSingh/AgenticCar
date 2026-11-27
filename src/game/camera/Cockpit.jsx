import { useEffect, useRef } from 'react'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { playerVehicle } from '@/game/config/playerVehicles'

// Camera-local, right-hand-drive cabin: no remote models or texture downloads.
export function Cockpit({ targetRef }) {
  const { camera, scene } = useThree()
  const wheel = useRef()
  const vehicle = useSettingsStore(s => s.vehicle)
  const open = ['cycle', 'bike'].includes(playerVehicle(vehicle).type)
  useEffect(() => {
    if (camera.parent) return
    scene.add(camera)
    return () => scene.remove(camera)
  }, [camera, scene])
  useFrame(() => { if (wheel.current) wheel.current.rotation.z = -(targetRef.current?.yaw || 0) * 5 })
  const panel = (position, size, color) => <mesh position={position}><boxGeometry args={size}/><meshBasicMaterial color={color}/></mesh>
  return createPortal(<group>
    {!open && <>
      {panel([0, -.49, -.85], [2.3, .36, .5], '#202930')}
      {panel([0, -.29, -.92], [2.2, .045, .4], '#59636a')}
      {[-1, 1].map(side => <mesh key={side} position={[side * .9, .12, -.9]} rotation={[0, 0, side * -.22]}><boxGeometry args={[.065, 1.2, .12]}/><meshBasicMaterial color="#252e34"/></mesh>)}
      {panel([0, .57, -.92], [1.9, .09, .12], '#252e34')}
      {panel([-.25, .42, -.95], [.28, .09, .035], '#252e34')}
      {panel([-.25, .42, -.925], [.24, .06, .01], '#91b3bc')}
      {panel([-.12, -.4, -.57], [.27, .13, .025], '#183d49')}
      {[-.05, .08].map(x => <mesh key={x} position={[x, -.37, -.55]}><circleGeometry args={[.035, 20]}/><meshBasicMaterial color="#91cdc6"/></mesh>)}
    </>}
    <group ref={wheel} position={[open ? 0 : .26, -.32, -.52]}>
      {open ? panel([0, 0, 0], [.7, .035, .035], '#707e88') : <>
        <mesh><torusGeometry args={[.17, .022, 10, 32]}/><meshBasicMaterial color="#12191f"/></mesh>
        {panel([0, -.065, 0], [.025, .14, .03], '#58666e')}
        {panel([0, 0, 0], [.31, .025, .03], '#58666e')}
        <mesh><circleGeometry args={[.055, 20]}/><meshBasicMaterial color="#27343d"/></mesh>
      </>}
    </group>
  </group>, camera)
}
