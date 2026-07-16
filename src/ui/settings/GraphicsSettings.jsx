import { useSettingsStore } from '@/stores/useSettingsStore'
import { GRAPHICS_PRESETS } from '@/game/config/graphicsConfig'

// Graphics / performance settings panel. Lets the player pick a fixed quality
// or 'auto' (runtime adapts the tier). Reads/writes the settings store; the
// resolved preset is applied by GameCanvas immediately.
const OPTIONS = [
  { key: 'auto', label: 'Auto' },
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
]

export function GraphicsSettings({ className = '' }) {
  const graphicsQuality = useSettingsStore((s) => s.graphicsQuality)
  const autoTier = useSettingsStore((s) => s.autoTier)
  const setGraphicsQuality = useSettingsStore((s) => s.setGraphicsQuality)

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => {
          const active = graphicsQuality === o.key
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => setGraphicsQuality(o.key)}
              className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                active
                  ? 'bg-cyan-600 border-cyan-400 text-white'
                  : 'bg-slate-800/70 border-slate-600 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      {graphicsQuality === 'auto' && (
        <p className="text-xs text-slate-500">
          Auto mode — currently {' '}
          <span className="text-cyan-300">{GRAPHICS_PRESETS[autoTier]?.label}</span>. Adjusts
          automatically to keep frame rate smooth.
        </p>
      )}
    </div>
  )
}

export default GraphicsSettings
