import { create } from 'zustand'
const defaults = { environment: 'countryside', time: 'day', weather: 'clear', quality: 'medium', sensitivity: 1, cruise: true, engineVolume: 0.12, camera: 'chase', cycle: false }
function restore() {
  try { return JSON.parse(localStorage.getItem('agenticcar-settings') || '{}') } catch { return {} }
}
const choices = {environment: ['countryside','forest','desert','coast'], time: ['day','sunset','night','sunrise'], weather: ['clear','fog','rain'], quality: ['low','medium','high'], camera: ['chase','hood']}
function sanitize(values) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) values = {}
  const out = { ...defaults }
  for (const [key, list] of Object.entries(choices)) if (list.includes(values[key])) out[key] = values[key]
  if (Number.isFinite(values.sensitivity)) out.sensitivity = Math.max(.4, Math.min(2, values.sensitivity))
  if (Number.isFinite(values.engineVolume)) out.engineVolume = Math.max(0, Math.min(1, values.engineVolume))
  for (const key of ['cruise','cycle']) if (typeof values[key] === 'boolean') out[key] = values[key]
  return out
}
export const useSettingsStore = create((set, get) => ({
  ...sanitize(restore()),
  persistenceError: '',
  audioError: '',
  setSetting: (key, value) => {
    const next = sanitize({ ...get(), [key]: value })
    set(next)
    try { localStorage.setItem('agenticcar-settings', JSON.stringify(next)); set({persistenceError: ''}) } catch { set({persistenceError: 'Settings could not be saved. Your changes work for this session only.'}) }
  },
}))
