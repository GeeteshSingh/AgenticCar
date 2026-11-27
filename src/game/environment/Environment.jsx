import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD_PALETTES } from '@/game/world/roadProfile'

const TIME_PRESETS = {
  day: { sky: '#a0cbe3', fog: '#c1d3ce', sun: '#fff0c9', intensity: 2.1, ambient: 1.1, height: 150 },
  sunset: { sky: '#9e777a', fog: '#d6a38b', sun: '#ffd098', intensity: 1.4, ambient: 0.8, height: 32 },
  night: { sky: '#101e35', fog: '#1e3045', sun: '#b8d1f1', intensity: 0.55, ambient: 0.7, height: 120 },
  sunrise: { sky: '#bca0a5', fog: '#e2bfa3', sun: '#ffe2ad', intensity: 1.3, ambient: 0.9, height: 45 },
}

// Atmosphere is shared by the menu and game and owns its scene background,
// fog and lights. Settings changes blend instead of replacing the whole scene.
export function Atmosphere({ settings = {} }) {
  const { scene } = useThree()
  const ambient = useRef()
  const sun = useRef()
  const disc = useRef()
  const cycle = useRef(0)
  const colors = useMemo(() => ({ sky: new THREE.Color(), fog: new THREE.Color(), sun: new THREE.Color(), targetSky: new THREE.Color(), targetFog: new THREE.Color(), targetSun: new THREE.Color(), other: new THREE.Color() }), [])
  const fog = useMemo(() => new THREE.Fog(TIME_PRESETS.day.fog, 160, 600), [])
  useEffect(() => {
    const previousBackground = scene.background
    const previousFog = scene.fog
    colors.sky.set(TIME_PRESETS.day.sky)
    scene.background = colors.sky
    scene.fog = fog
    return () => { scene.background = previousBackground; scene.fog = previousFog }
  }, [scene, colors, fog])

  useFrame((_, dt) => {
    const blend = 1 - Math.exp(-Math.min(dt, 0.1) * 1.4)
    if (settings.cycle) cycle.current = (cycle.current + Math.min(dt, 0.1) / 360) % 4
    const names = ['day', 'sunset', 'night', 'sunrise']
    const a = settings.cycle ? TIME_PRESETS[names[Math.floor(cycle.current)]] : TIME_PRESETS[settings.time] || TIME_PRESETS.day
    const b = settings.cycle ? TIME_PRESETS[names[(Math.floor(cycle.current) + 1) % 4]] : a
    const t = settings.cycle ? cycle.current % 1 : 0
    colors.targetSky.set(a.sky).lerp(colors.other.set(b.sky), t)
    colors.targetFog.set(a.fog).lerp(colors.other.set(b.fog), t)
    colors.targetSun.set(a.sun).lerp(colors.other.set(b.sun), t)
    colors.sky.lerp(colors.targetSky, blend)
    fog.color.lerp(colors.targetFog, blend)
    const haze = settings.environment === 'forest' ? 0.72 : settings.environment === 'desert' ? 0.85 : 1
    fog.near += ((settings.weather === 'fog' ? 30 : settings.weather === 'rain' ? 60 : 160 * haze) - fog.near) * blend
    fog.far += ((settings.weather === 'fog' ? 220 : settings.weather === 'rain' ? 350 : 600 * haze) - fog.far) * blend
    if (ambient.current) ambient.current.intensity += ((a.ambient + (b.ambient - a.ambient) * t) - ambient.current.intensity) * blend
    if (sun.current) {
      sun.current.color.lerp(colors.targetSun, blend)
      sun.current.intensity += ((a.intensity + (b.intensity - a.intensity) * t) * (settings.weather === 'rain' ? 0.55 : 1) - sun.current.intensity) * blend
    }
    if (disc.current) {
      disc.current.material.color.lerp(colors.targetSun, blend)
      disc.current.position.y += ((a.height + (b.height - a.height) * t) - disc.current.position.y) * blend
    }
  })
  return <group>
    <hemisphereLight ref={ambient} args={['#cce2ef', '#4c5440', 1.1]} />
    <directionalLight ref={sun} position={[70, 100, 80]} intensity={2.1} castShadow={settings.quality !== 'low'} shadow-mapSize={[1024, 1024]} shadow-camera-left={-32} shadow-camera-right={32} shadow-camera-top={50} shadow-camera-bottom={-50} shadow-camera-far={250} />
    <mesh ref={disc} position={[-190, 150, 460]}>
      <sphereGeometry args={[17, 16, 12]} /><meshBasicMaterial color="#fff0c9" fog={false} />
    </mesh>
    <DistantScenery environment={settings.environment} />
    {settings.weather === 'rain' && <Rain />}
  </group>
}

function DistantScenery({ environment = 'countryside' }) {
  const palette = WORLD_PALETTES[environment] || WORLD_PALETTES.countryside
  return <group>
    {Array.from({ length: 18 }, (_, i) => {
      const angle = i / 18 * Math.PI * 2
      if (environment === 'coast' && Math.sin(angle) > 0.15) return null
      const height = environment === 'forest' ? 90 + (i * 17) % 100 : environment === 'desert' ? 12 + (i * 13) % 22 : environment === 'countryside' ? 24 + (i * 17) % 28 : 40 + (i * 17) % 50
      return <mesh key={i} position={[Math.sin(angle) * 470, 14, Math.cos(angle) * 470]} scale={[100, height, 90]}>
        <icosahedronGeometry args={[1, 0]} /><meshStandardMaterial color={palette.hills} roughness={1} />
      </mesh>
    })}
  </group>
}

function Rain() {
  const ref = useRef()
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const points = new Float32Array(600 * 6)
    for (let i = 0; i < 600; i++) {
      const k = i * 6
      const x = (i * 13.47 % 1) * 110 - 55
      const y = (i * 7.13 % 1) * 65
      const z = (i * 9.71 % 1) * 140 - 30
      points.set([x, y, z, x - 0.1, y + 1, z], k)
    }
    g.setAttribute('position', new THREE.BufferAttribute(points, 3).setUsage(THREE.DynamicDrawUsage))
    return g
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  useFrame((_, dt) => {
    const p = geometry.attributes.position.array
    for (let i = 0; i < p.length; i += 6) {
      p[i + 1] -= Math.min(dt, 0.1) * 30
      if (p[i + 1] < -10) p[i + 1] = 65
      p[i + 4] = p[i + 1] + 1
    }
    geometry.attributes.position.needsUpdate = true
  })
  return <lineSegments ref={ref} geometry={geometry} frustumCulled={false}><lineBasicMaterial color="#b7ced7" transparent opacity={0.32} /></lineSegments>
}

// Existing callers remain supported; the game uses Atmosphere with settings.
export function Environment({ settings }) {
  return <Atmosphere settings={settings} />
}
export default Environment
