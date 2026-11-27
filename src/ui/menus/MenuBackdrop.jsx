import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Atmosphere } from '@/game/environment/Environment'
import { EndlessHighway } from '@/game/world/EndlessHighway'
import { sampleRoad, roadFrame } from '@/game/world/roadProfile'
import { PlayerCar } from '@/game/player/PlayerCar'
import { useSettingsStore } from '@/stores/useSettingsStore'

// Preview the selected route with the same profile and atmosphere as the run.
export function MenuBackdrop() {
  const settings = useSettingsStore()
  const distanceRef = useRef(0)
  const carState = useRef({ speed: 100, lateralX: 2, steer: 0, yaw: 0, bodyRoll: 0, bodyPitch: 0 })
  useFrame(({camera}, dt) => {
    distanceRef.current += 28 * Math.min(dt, 1 / 30)
    const road = sampleRoad(distanceRef.current, 1, settings.environment)
    const ahead = roadFrame(14, distanceRef.current, 1, settings.environment)
    carState.current.roadHeading = road.heading
    carState.current.roadPitch = road.pitch
    camera.position.set(5, 4.5, -12)
    camera.lookAt(ahead.x, 1.2 + ahead.y, 14)
  })
  return <group>
    <Atmosphere settings={settings} />
    <EndlessHighway distanceRef={distanceRef} settings={settings} />
    <PlayerCar stateRef={carState} />
  </group>
}
export default MenuBackdrop
