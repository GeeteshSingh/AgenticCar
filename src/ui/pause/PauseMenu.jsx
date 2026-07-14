import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGameStore } from '@/stores/useGameStore'

// Pause overlay shown when phase === 'paused'. Restart/return-to-menu are
// stubs until results + reset land in Phase 4; for now resume is primary.
export function PauseMenu() {
  const resume = useGameStore((s) => s.resume)
  const returnToMenu = useGameStore((s) => s.returnToMenu)

  return (
    <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
      <Card className="w-full max-w-sm bg-slate-900/90 border-slate-700">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-cyan-400">PAUSED</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={resume} className="w-full h-12 bg-cyan-600 hover:bg-cyan-500">
            Resume
          </Button>
          <Button
            onClick={returnToMenu}
            variant="outline"
            className="w-full h-12 border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Return to Menu
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default PauseMenu
