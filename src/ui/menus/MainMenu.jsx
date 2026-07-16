import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useGameStore } from '@/stores/useGameStore'
import { Canvas } from '@react-three/fiber'
import { MenuBackdrop } from '@/ui/menus/MenuBackdrop'
import { AudioSettings } from '@/ui/settings/AudioSettings'
import { GraphicsSettings } from '@/ui/settings/GraphicsSettings'
import { audioManager } from '@/game/audio/AudioManager'

// Polished landing page for the game. A live, calm 3D backdrop sits behind a
// modern hero + mode-selection card. Pure DOM/React (menu state only); the
// R3F backdrop renders its own self-driving scene for ambience.
export function MainMenu() {
  const startRun = useGameStore((s) => s.startRun)
  const [showAudio, setShowAudio] = useState(false)
  const [showGraphics, setShowGraphics] = useState(false)

  const handleStart = (mode) => {
    audioManager.unlock()
    audioManager.playUi()
    startRun(mode)
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Live 3D ambience backdrop */}
      <div className="absolute inset-0">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [0, 3, 9], fov: 58 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#9fc6ee']} />
          <fog attach="fog" args={['#aacbe8', 200, 560]} />
          <MenuBackdrop />
        </Canvas>
      </div>

      {/* Readability scrim */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/30 to-slate-950/80" />

      {/* Foreground content */}
      <div className="relative z-10 min-h-screen flex flex-col px-4 py-10">
        <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col justify-center">
          <div className="text-center mb-10">
            <span className="inline-block text-[11px] uppercase tracking-[0.3em] text-cyan-300/80 mb-3">
              Arcade Driving
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              HIGHWAY <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-sky-400">OBJECTIVE</span>
            </h1>
            <p className="mt-4 text-slate-200/90 text-base sm:text-lg max-w-2xl mx-auto">
              A serene, semi-realistic 3D highway drive. Overtake traffic, dodge
              oncoming cars, complete objectives, and chase a high score as the
              day rolls on.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ModeCard
              title="Mission Mode"
              tag="Structured"
              blurb="Progress through sequential objectives — distance, overtakes, speed, survival — and finish with integrity intact."
              onClick={() => handleStart('mission')}
              accent="from-blue-500/20 to-blue-500/5 border-blue-400/40"
              cta="Start Mission"
            />
            <ModeCard
              title="Endless Mode"
              tag="Arcade"
              blurb="Drive as far as you can. Traffic thickens, optional challenges rotate, and one mistake too many ends the run."
              onClick={() => handleStart('endless')}
              accent="from-cyan-500/20 to-cyan-500/5 border-cyan-400/40"
              cta="Start Endless"
            />
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => { audioManager.playUi(); setShowAudio((v) => !v) }}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              {showAudio ? 'Hide Audio Settings' : 'Audio Settings'}
            </Button>
          </div>
          {showAudio && (
            <div className="mx-auto mt-4 max-w-sm">
              <Card className="bg-slate-900/60 border-slate-700/70 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-cyan-300 text-lg">Audio</CardTitle>
                </CardHeader>
                <CardContent>
                  <AudioSettings />
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mt-4 flex justify-center">
            <Button
              onClick={() => { audioManager.playUi(); setShowGraphics((v) => !v) }}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              {showGraphics ? 'Hide Graphics Settings' : 'Graphics Settings'}
            </Button>
          </div>
          {showGraphics && (
            <div className="mx-auto mt-4 max-w-sm">
              <Card className="bg-slate-900/60 border-slate-700/70 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-cyan-300 text-lg">Graphics</CardTitle>
                </CardHeader>
                <CardContent>
                  <GraphicsSettings />
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mt-8">
            <Card className="bg-slate-900/60 border-slate-700/70 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-cyan-300 text-lg">Controls</CardTitle>
                <CardDescription>Desktop keyboard</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-sm text-slate-300">
                  <Key k="W / ↑" v="Accelerate (boost)" />
                  <Key k="S / ↓" v="Brake" />
                  <Key k="A / ←" v="Steer left" />
                  <Key k="D / →" v="Steer right" />
                  <Key k="Space" v="Handbrake" />
                  <Key k="C" v="Camera" />
                  <Key k="Esc" v="Pause" />
                  <Key k="Auto" v="Cruise drive" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <p className="text-center mt-8 text-xs text-slate-400/80">
          Built with React Three Fiber · Highway Objective
        </p>
      </div>
    </div>
  )
}

function ModeCard({ title, tag, blurb, onClick, accent, cta }) {
  return (
    <Card className={`bg-slate-900/55 backdrop-blur-md hover:bg-slate-900/75 transition-colors border bg-gradient-to-br ${accent}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl text-white">{title}</CardTitle>
          <span className="text-[10px] uppercase tracking-widest text-slate-300/80 border border-slate-500/40 rounded-full px-2 py-0.5">
            {tag}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-300/90 leading-relaxed">{blurb}</p>
        <Button
          onClick={onClick}
          className="w-full h-12 text-base bg-cyan-600 hover:bg-cyan-500 border border-cyan-400"
        >
          {cta}
        </Button>
      </CardContent>
    </Card>
  )
}

function Key({ k, v }) {
  return (
    <div className="flex items-center gap-2">
      <kbd className="rounded-md border border-slate-500/50 bg-slate-800/70 px-2 py-1 text-xs font-semibold text-cyan-200 min-w-[3.5rem] text-center">
        {k}
      </kbd>
      <span className="text-slate-300/90">{v}</span>
    </div>
  )
}

export default MainMenu
