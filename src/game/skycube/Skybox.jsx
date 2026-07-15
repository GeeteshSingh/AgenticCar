import { useMemo } from 'react'
import * as THREE from 'three'

// Large inverted cube that surrounds the scene to act as a sky. Pure mesh
// primitive; color is driven by the day/night environment config.
export function Skybox({ color = '#8fb8e8' }) {
  const geometry = useMemo(() => new THREE.BoxGeometry(2000, 2000, 2000), [])
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color, side: THREE.BackSide, fog: false }),
    [color],
  )

  return (
    <mesh frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

export default Skybox
