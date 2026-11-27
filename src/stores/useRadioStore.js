import { create } from 'zustand'
import { normalizeStation } from '../game/audio/catalog.js'
const KEY = 'agenticcar-radio-v1'
const cleanStations = value => Array.isArray(value) ? value.slice(0, 100).map(normalizeStation).filter(Boolean) : []
function restore() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { favorites: cleanStations(raw.favorites), recent: cleanStations(raw.recent).slice(0, 20), playlist: cleanStations(raw.playlist), selected: raw.selected ? normalizeStation(raw.selected) : null,
      volume: Number.isFinite(raw.volume) ? Math.max(0, Math.min(1, raw.volume)) : .5,
      muted: !!raw.muted, location: { countryCode: String(raw.location?.countryCode || '').slice(0, 2), state: String(raw.location?.state || '').slice(0, 100), city: String(raw.location?.city || '').slice(0, 100) }, playlistName: String(raw.playlistName || '').slice(0, 150) }
  } catch { return { favorites: [], recent: [], playlist: [], selected: null, volume: .5, muted: false, location: { countryCode: '', state: '', city: '' }, playlistName: '' } }
}
export const useRadioStore = create((set, get) => {
  const save = patch => {
    set(patch)
    const { favorites, recent, playlist, selected, volume, muted, location, playlistName } = get()
    try { localStorage.setItem(KEY, JSON.stringify({ favorites, recent, playlist, selected, volume, muted, location, playlistName })); set({ persistenceError: '' }) }
    catch { set({ persistenceError: 'Preferences could not be saved. This session still works; browser storage may be disabled or full.' }) }
  }
  return { ...restore(), open: false, persistenceError: '', status: 'idle', playbackError: '',
    setOpen: open => set({ open }),
    setPlayback: snapshot => set({ status: snapshot.status, playbackError: snapshot.errorCode }),
    select: station => save({ selected: station }),
    remember: station => save({ recent: [station, ...get().recent.filter(s => s.id !== station.id)].slice(0, 20) }),
    setVolume: volume => save({ volume }), setMuted: muted => save({ muted }),
    setLocation: location => save({ location }),
    setPlaylist: (playlist, playlistName) => save({ playlist, playlistName }),
    toggleFavorite: station => save({ favorites: get().favorites.some(s => s.id === station.id) ? get().favorites.filter(s => s.id !== station.id) : [station, ...get().favorites].slice(0, 100) }),
  }
})
