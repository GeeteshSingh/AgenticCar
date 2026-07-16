import { useRef } from 'react'
import { useMemo } from 'react'
import * as THREE from 'three'

// Sun disc visual. A small emissive sphere placed far away along the sun
// direction so the player can see a sun/moon in the sky.
export function SunDisc({ position = [60, 80, -120], color = '#fde68a', size = 14, ...props }) {
  const ref = useRef()
  const geometry = useMemo(() => new THREE.SphereGeometry(size, 24, 24), [size])
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color, fog: false }),
    [color],
  )
  return (
    <mesh ref={ref} position={position} frustumCulled={false} {...props}>
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

export default SunDisc
