import { useSettingsStore } from '@/stores/useSettingsStore'

// Restrained audio settings panel. Reads/writes the settings store directly;
// the AudioManager singleton picks up volume changes every frame, so sliders
// take effect immediately without re-mounting sounds.
const CHANNELS = [
  { key: 'masterVolume', label: 'Master' },
  { key: 'engineVolume', label: 'Engine' },
  { key: 'effectsVolume', label: 'Effects' },
  { key: 'environmentVolume', label: 'Environment' },
  { key: 'musicVolume', label: 'Music' },
]

export function AudioSettings({ className = '' }) {
  const settings = useSettingsStore()
  const pct = (v) => `${Math.round(v * 100)}%`

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-300">Mute all</span>
        <button
          type="button"
          onClick={() => settings.toggleMuted()}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            settings.muted ? 'bg-slate-600' : 'bg-cyan-600'
          }`}
          aria-pressed={settings.muted}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              settings.muted ? 'translate-x-0.5' : 'translate-x-5'
            }`}
          />
        </button>
      </label>

      {CHANNELS.map(({ key, label }) => (
        <label key={key} className="block">
          <div className="flex justify-between text-sm text-slate-300 mb-1">
            <span>{label}</span>
            <span className="text-slate-500 tabular-nums">{pct(settings[key])}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings[key]}
            disabled={settings.muted}
            onChange={(e) => settings.setVolume(key, Number(e.target.value))}
            className="w-full accent-cyan-500 disabled:opacity-40"
          />
        </label>
      ))}
    </div>
  )
}

export default AudioSettings
