import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// ARCHIVED PROTOTYPE — DO NOT USE AS THE ACTIVE GAME RUNTIME.
// This is the original 2D canvas three-lane driving game kept as a visual
// reference for the 3D migration (Highway Objective). The active game now
// lives under src/game and src/app. See src/app/AppShell.jsx.

const ROAD_WIDTH = 600
const ROAD_HEIGHT = 800
const LANES = 3
const LANE_WIDTH = ROAD_WIDTH / LANES

const CAR_WIDTH = 60
const CAR_HEIGHT = 100

const OBSTACLE_TYPES = [
  { color: '#ef4444', width: 60, height: 100, points: 10 },
  { color: '#f97316', width: 70, height: 120, points: 15 },
  { color: '#eab308', width: 50, height: 80, points: 20 },
]

export function Legacy2DCarGame() {
  const [gameState, setGameState] = useState('menu')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [speed, setSpeed] = useState(5)
  const [playerLane, setPlayerLane] = useState(1)
  const [obstacles, setObstacles] = useState([])
  const [particles, setParticles] = useState([])
  const [roadOffset, setRoadOffset] = useState(0)
  const [difficulty, setDifficulty] = useState('normal')
  const animationFrameRef = useRef(null)
  const canvasRef = useRef(null)
  const lastTimeRef = useRef(0)

  const difficulties = {
    easy: { baseSpeed: 3, spawnRate: 2000, speedIncrease: 0.0003 },
    normal: { baseSpeed: 5, spawnRate: 1500, speedIncrease: 0.0005 },
    hard: { baseSpeed: 7, spawnRate: 1000, speedIncrease: 0.0008 },
  }

  const getLaneX = (lane) => lane * LANE_WIDTH + LANE_WIDTH / 2 - CAR_WIDTH / 2

  const createObstacle = () => {
    const lane = Math.floor(Math.random() * LANES)
    const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)]
    return {
      id: Date.now() + Math.random(),
      lane,
      y: -type.height,
      ...type,
    }
  }

  const createParticles = (x, y, color) => {
    const newParticles = []
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: x + CAR_WIDTH / 2,
        y: y + CAR_HEIGHT / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 2,
        color,
        life: 1,
        size: Math.random() * 6 + 2,
      })
    }
    return newParticles
  }

  const checkCollision = (playerX, playerY, obstacle) => {
    const obstacleX = getLaneX(obstacle.lane)
    return (
      playerX < obstacleX + obstacle.width &&
      playerX + CAR_WIDTH > obstacleX &&
      playerY < obstacle.y + obstacle.height &&
      playerY + CAR_HEIGHT > obstacle.y
    )
  }

  const gameLoop = (timestamp) => {
    if (gameState !== 'playing') return

    const deltaTime = timestamp - lastTimeRef.current
    lastTimeRef.current = timestamp

    const config = difficulties[difficulty]
    const currentSpeed = speed + timestamp * config.speedIncrease
    setSpeed(currentSpeed)

    setRoadOffset((prev) => (prev + currentSpeed) % 80)

    setObstacles((prev) => {
      const updated = prev.map((obs) => ({
        ...obs,
        y: obs.y + currentSpeed,
      })).filter((obs) => obs.y < ROAD_HEIGHT + 100)

      const playerX = getLaneX(playerLane)
      const playerY = ROAD_HEIGHT - CAR_HEIGHT - 50

      for (const obs of updated) {
        if (checkCollision(playerX, playerY, obs)) {
          const newParticles = createParticles(playerX, playerY, obs.color)
          setParticles((p) => [...p, ...newParticles])
          setGameState('gameover')
          if (score > highScore) setHighScore(score)
          return []
        }
      }

      const passed = updated.filter((obs) => obs.y > ROAD_HEIGHT - CAR_HEIGHT - 50 && !obs.scored)
      if (passed.length > 0) {
        const points = passed.reduce((sum, obs) => sum + obs.points, 0)
        setScore((s) => s + points)
        updated.forEach((obs) => {
          if (passed.includes(obs)) obs.scored = true
        })
      }

      return updated
    })

    if (Math.random() < deltaTime / config.spawnRate) {
      setObstacles((prev) => [...prev, createObstacle()])
    }

    setParticles((prev) => {
      return prev
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.3,
          life: p.life - 0.02,
          size: p.size * 0.98,
        }))
        .filter((p) => p.life > 0)
    })

    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }

  const startGame = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty)
    const config = difficulties[selectedDifficulty]
    setGameState('playing')
    setScore(0)
    setSpeed(config.baseSpeed)
    setPlayerLane(1)
    setObstacles([])
    setParticles([])
    setRoadOffset(0)
    lastTimeRef.current = performance.now()
    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }

  const handleKeyDown = (e) => {
    if (gameState !== 'playing') return
    if (e.key === 'ArrowLeft' && playerLane > 0) {
      setPlayerLane((prev) => prev - 1)
    } else if (e.key === 'ArrowRight' && playerLane < LANES - 1) {
      setPlayerLane((prev) => prev + 1)
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState, playerLane])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const drawRoad = (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, ROAD_HEIGHT)
    gradient.addColorStop(0, '#0f172a')
    gradient.addColorStop(0.5, '#1e293b')
    gradient.addColorStop(1, '#0f172a')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, ROAD_WIDTH, ROAD_HEIGHT)

    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, ROAD_WIDTH, ROAD_HEIGHT)

    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 4
    ctx.setLineDash([40, 40])
    ctx.lineDashOffset = -roadOffset
    for (let i = 1; i < LANES; i++) {
      const x = i * LANE_WIDTH
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, ROAD_HEIGHT)
      ctx.stroke()
    }
    ctx.setLineDash([])

    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, ROAD_HEIGHT)
    ctx.moveTo(ROAD_WIDTH, 0)
    ctx.lineTo(ROAD_WIDTH, ROAD_HEIGHT)
    ctx.stroke()
  }

  const drawCar = (ctx, x, y, isPlayer = true) => {
    const width = CAR_WIDTH
    const height = CAR_HEIGHT
    const radius = 8

    if (isPlayer) {
      const bodyGradient = ctx.createLinearGradient(x, y, x, y + height)
      bodyGradient.addColorStop(0, '#22d3ee')
      bodyGradient.addColorStop(0.5, '#06b6d4')
      bodyGradient.addColorStop(1, '#0891b2')
      ctx.shadowColor = '#22d3ee'
      ctx.shadowBlur = 20
      ctx.fillStyle = bodyGradient
      ctx.beginPath()
      ctx.roundRect(x, y + 15, width, height - 15, radius)
      ctx.fill()
      ctx.fillStyle = '#06b6d4'
      ctx.beginPath()
      ctx.roundRect(x + 5, y, width - 10, 25, { upperLeft: radius, upperRight: radius, lowerLeft: 0, lowerRight: 0 })
      ctx.fill()
      ctx.fillStyle = '#0f172a'
      ctx.beginPath()
      ctx.roundRect(x + 8, y + 5, width - 16, 35, 4)
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }

  const render = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, ROAD_WIDTH, ROAD_HEIGHT)
    drawRoad(ctx)
    const playerX = getLaneX(playerLane)
    const playerY = ROAD_HEIGHT - CAR_HEIGHT - 50
    drawCar(ctx, playerX, playerY, true)
  }

  useEffect(() => {
    const renderLoop = () => {
      render()
      requestAnimationFrame(renderLoop)
    }
    renderLoop()
  }, [obstacles, particles, playerLane, roadOffset, speed, gameState])

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
            NITRO RUSH (ARCHIVED)
          </h1>
        </div>
        <Card className="w-full max-w-md bg-slate-900/80 border-slate-700 backdrop-blur-sm">
          <CardContent className="space-y-4 text-center">
            <Button onClick={() => startGame('normal')} className="w-full h-14 text-lg bg-cyan-600 hover:bg-cyan-500">
              Launch 2D reference (deprecated)
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <canvas ref={canvasRef} width={ROAD_WIDTH} height={ROAD_HEIGHT} className="border-2 border-slate-700 rounded-lg" />
    </div>
  )
}

export default Legacy2DCarGame
