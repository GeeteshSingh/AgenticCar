import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGameStore, GAME_STATES } from '@/stores/useGameStore'

// Main menu. Two entry points (Mission / Endless) share the same
// startRun -> loading -> countdown -> playing flow defined by the store.
export function MainMenu() {
  const startRun = useGameStore((s) => s.startRun)

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
          HIGHWAY OBJECTIVE
        </h1>
        <p className="text-slate-400 text-lg">Semi-realistic 3D arcade highway driving</p>
      </div>

      <Card className="w-full max-w-md bg-slate-900/80 border-slate-700 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-cyan-400">Select Mode</CardTitle>
          <p className="text-slate-400 mt-2">Choose how you want to drive</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => startRun('mission')}
            className="w-full h-16 text-lg bg-blue-600 hover:bg-blue-500 border border-blue-500"
          >
            Mission Mode
          </Button>
          <Button
            onClick={() => startRun('endless')}
            className="w-full h-16 text-lg bg-cyan-600 hover:bg-cyan-500 border border-cyan-500"
          >
            Endless Mode
          </Button>
        </CardContent>
      </Card>

      <p className="mt-8 text-slate-500 text-sm max-w-md text-center">
        Desktop keyboard controls. Drive, overtake, dodge oncoming traffic, and
        survive. (3D gameplay lands in Phase 2.)
      </p>
    </div>
  )
}

export default MainMenu
