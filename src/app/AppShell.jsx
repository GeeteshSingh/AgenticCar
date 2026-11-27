import { DrivingAudio } from '@/game/audio/DrivingAudio'
import { RadioPanel } from '@/ui/radio/RadioPanel'
import { SettingsPanel } from '@/ui/settings/SettingsPanel'
import { GameRouter } from '@/app/GameRouter'

// Top-level application shell. Composes the persistent UI chrome (dark
// background, full-viewport layout) with the phase-driven GameRouter.
// Per-frame and in-scene concerns live inside the R3F tree, not here.
export function AppShell() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <GameRouter />
      <SettingsPanel />
      <RadioPanel />
      <DrivingAudio />
    </div>
  )
}

export default AppShell
