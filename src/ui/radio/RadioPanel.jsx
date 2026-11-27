import { useEffect, useRef, useState } from 'react'
import { Heart, SkipBack, SkipForward, Play, Pause, Square, Volume2, VolumeX } from 'lucide-react'
import { useRadioStore } from '../../stores/useRadioStore'
import { useGameStore } from '../../stores/useGameStore'
import { getCountries, recordStationClick, searchStations } from '../../game/audio/catalog'
import { createRadioPlayer } from '../../game/audio/player'
import { MAX_PLAYLIST_BYTES, parsePlaylist } from '../../game/audio/playlist'
import './radio.css'

const countryNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null
const countryName = code => countryNames?.of(code) || code
export function RadioPanel() {
  const radio = useRadioStore()
  const phase = useGameStore(s => s.phase)
  const playerRef = useRef(null), searchRef = useRef(null), serialRef = useRef(0)
  const [countries, setCountries] = useState([]), [results, setResults] = useState([])
  const [query, setQuery] = useState(''), [genre, setGenre] = useState(''), [language, setLanguage] = useState('')
  const [tab, setTab] = useState('discover'), [loading, setLoading] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [located, setLocated] = useState(null), [locating, setLocating] = useState(false)
  const panelRef = useRef(null), toggleRef = useRef(null)
  useEffect(() => {
    const player = createRadioPlayer({ audioElement: new Audio() })
    playerRef.current = player
    const state = useRadioStore.getState()
    player.setVolume(state.volume); player.setMuted(state.muted)
    const unsubscribe = player.subscribe(useRadioStore.getState().setPlayback)
    // These refs hold service handles, not DOM nodes; cancel the latest request on teardown.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    return () => { serialRef.current++; searchRef.current?.abort(); unsubscribe(); player.dispose(); playerRef.current = null }
  }, [])
  useEffect(() => {
    const onKeyDown = event => {
      if (event.code !== 'KeyP' || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return
      if (event.target instanceof HTMLElement && event.target.closest('input, select, textarea, [contenteditable]:not([contenteditable="false"])')) return
      const { selected, status, remember } = useRadioStore.getState()
      if (!selected || !playerRef.current) return
      event.preventDefault()
      if (status === 'playing' || status === 'loading') {
        serialRef.current++
        playerRef.current.pause()
      } else {
        const serial = ++serialRef.current
        playerRef.current.play(selected).then(played => {
          if (played && serial === serialRef.current) {
            remember(selected)
            recordStationClick(selected).catch(() => setNotice('Audio is playing. The directory could not record this station selection.'))
          }
        })
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])
  useEffect(() => { playerRef.current?.setVolume(radio.volume) }, [radio.volume])
  useEffect(() => { playerRef.current?.setMuted(radio.muted) }, [radio.muted])
  useEffect(() => {
    if (!radio.open) return
    const controller = new AbortController()
    getCountries({ signal: controller.signal }).then(setCountries).catch(err => { if (err.name !== 'AbortError') setNotice('Country list unavailable. Enter a two-letter country code to search.') })
    panelRef.current?.focus()
    return () => controller.abort()
  }, [radio.open])
  const close = () => {
    radio.setOpen(false)
    const phase = useGameStore.getState().phase
    const drivingCanvas = ['playing', 'paused'].includes(phase) ? document.querySelector('canvas[tabindex]') : null
    if (drivingCanvas) drivingCanvas.focus()
    else toggleRef.current?.focus()
  }
  const play = async station => {
    const serial = ++serialRef.current
    radio.select(station)
    if (await playerRef.current?.play(station)) {
      if (serial !== serialRef.current) return
      radio.remember(station)
      recordStationClick(station).catch(() => setNotice('Audio is playing. The directory could not record this station selection.'))
    }
  }
  const search = async event => {
    event?.preventDefault()
    searchRef.current?.abort()
    const controller = new AbortController(); searchRef.current = controller
    setLoading(true); setError(''); setNotice('')
    try {
      let stations = await searchStations({ query, countryCode: radio.location.countryCode, state: radio.location.state, city: radio.location.city, tag: genre, language, signal: controller.signal })
      if (located) {
        const distance = s => s.latitude === null || s.longitude === null ? Infinity : Math.hypot(s.latitude - located.latitude, (s.longitude - located.longitude) * Math.cos(located.latitude * Math.PI / 180))
        stations = [...stations].sort((a, b) => distance(a) - distance(b))
      }
      if (!controller.signal.aborted) { setResults(stations); setTab('discover') }
    } catch (err) { if (err.name !== 'AbortError') setError(err.message) }
    finally { if (!controller.signal.aborted) setLoading(false) }
  }
  const importPlaylist = async event => {
    const file = event.target.files?.[0]; event.target.value = ''
    if (!file) return
    setError(''); setNotice('')
    try {
      if (file.size > MAX_PLAYLIST_BYTES) throw new Error('Playlist must be smaller than 512 KB.')
      if (!/\.m3u8?$/i.test(file.name)) throw new Error('Choose an .m3u or .m3u8 station list.')
      const { stations, warnings } = parsePlaylist(await file.text(), { name: file.name })
      radio.setPlaylist(stations, file.name); setTab('playlist'); setNotice(`${stations.length} stations imported. ${warnings.join(' ')}`)
    } catch (err) { setError(err.message) }
  }
  const locate = () => {
    if (!navigator.geolocation) { setError('Geolocation is unavailable. Choose your radio location manually.'); return }
    setLocating(true); setError('')
    navigator.geolocation.getCurrentPosition(position => {
      setLocated({ latitude: position.coords.latitude, longitude: position.coords.longitude }); setLocating(false)
      setNotice('Location is used only on this device to sort search results with coordinates. Choose country/region manually; radio location is separate from the driving environment.')
    }, () => { setLocating(false); setError('Location could not be obtained. Choose country/region manually.') }, { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false })
  }
  const lists = { discover: results, favorites: radio.favorites, recent: radio.recent, playlist: radio.playlist }
  const stations = lists[tab], index = stations.findIndex(s => s.id === radio.selected?.id)
  const changeStation = direction => { if (stations.length) play(stations[(index + direction + stations.length) % stations.length]) }
  const locationField = (field, value) => radio.setLocation({ ...radio.location, [field]: value })
  return <div className={`radio-root ${['playing', 'paused'].includes(phase) ? 'radio-root-driving' : ''}`} onKeyDown={event => { if (radio.open) event.stopPropagation() }} onKeyUp={event => { if (radio.open) event.stopPropagation() }}>
    <button ref={toggleRef} className="radio-toggle" onClick={() => radio.open ? close() : radio.setOpen(true)} aria-expanded={radio.open} aria-controls="radio-panel">♫ {radio.status === 'playing' ? radio.selected?.name : 'Radio'} <span className="radio-state">{radio.status === 'loading' ? 'Connecting…' : ''}</span></button>
    {radio.open && <section id="radio-panel" ref={panelRef} tabIndex={-1} aria-label="Internet radio" className="radio-panel" onKeyDown={event => {
      if (event.key === 'Escape') { event.stopPropagation(); close() }
      event.stopPropagation()
    }} onKeyUp={event => event.stopPropagation()}>
      <header><div><small>ON THE ROAD</small><h2>Radio</h2></div><button onClick={close} aria-label="Close radio">×</button></header>
      <div className="radio-now">
        <div className="radio-now-title"><div><strong>{radio.selected?.name || 'Find your soundtrack'}</strong><small>{radio.selected ? [radio.selected.country, radio.selected.codec, radio.selected.bitrate ? `${radio.selected.bitrate} kbps` : ''].filter(Boolean).join(' · ') || 'Internet radio' : 'Choose a station below'}</small></div><span className="radio-live" aria-live="polite">{radio.status === 'playing' ? 'LIVE' : radio.status === 'loading' ? 'CONNECTING' : radio.status.toUpperCase()}</span></div>
        <div className="radio-live-rule" aria-hidden="true"><span /></div>
        <div className="radio-player-controls">
          <button disabled={!radio.selected} onClick={() => radio.toggleFavorite(radio.selected)} aria-label={radio.favorites.some(s => s.id === radio.selected?.id) ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={radio.favorites.some(s => s.id === radio.selected?.id)}><Heart size={19} fill={radio.favorites.some(s => s.id === radio.selected?.id) ? 'currentColor' : 'none'}/></button>
          <button onClick={() => changeStation(-1)} disabled={!stations.length} aria-label="Previous station"><SkipBack size={20}/></button>
          <button className="radio-main-play" disabled={!radio.selected} onClick={() => radio.status === 'playing' || radio.status === 'loading' ? playerRef.current?.pause() : play(radio.selected)} aria-label={radio.status === 'playing' || radio.status === 'loading' ? 'Pause radio' : 'Play radio'}>{radio.status === 'playing' || radio.status === 'loading' ? <Pause size={25} fill="currentColor"/> : <Play size={25} fill="currentColor"/>}</button>
          <button onClick={() => changeStation(1)} disabled={!stations.length} aria-label="Next station"><SkipForward size={20}/></button>
          <button disabled={!radio.selected} onClick={() => playerRef.current?.stop()} aria-label="Stop radio"><Square size={18}/></button>
        </div>
        <div className="radio-volume"><button onClick={() => radio.setMuted(!radio.muted)} aria-label={radio.muted ? 'Unmute radio' : 'Mute radio'}>{radio.muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button><label><span className="sr-only">Radio volume</span><input aria-label="Radio volume" type="range" min="0" max="1" step=".01" value={radio.volume} onChange={event => radio.setVolume(Number(event.target.value))} /></label><small>P play / pause</small></div>
      </div>
      {radio.playbackError && <p className="radio-error" role="alert">{radio.playbackError} {radio.selected && <button onClick={() => play(radio.selected)}>Retry</button>}</p>}
      <nav aria-label="Radio views">{[['discover', 'Discover'], ['favorites', 'Favorites'], ['recent', 'Recent'], ['playlist', 'Playlist']].map(([id, name]) => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{name}</button>)}</nav>
      {tab === 'discover' && <form onSubmit={search}>
        <label>Station name<input placeholder="Search radio stations" value={query} onChange={event => setQuery(event.target.value)} maxLength={120} /></label>
        <div className="radio-fields"><label>Country<select value={radio.location.countryCode} onChange={event => locationField('countryCode', event.target.value)}><option value="">All countries</option>{countries.map(c => <option key={c.code} value={c.code}>{countryName(c.code)}</option>)}</select></label><label>Or country code<input aria-label="Country code" placeholder="e.g. IN" maxLength={2} value={radio.location.countryCode} onChange={event => locationField('countryCode', event.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} /></label></div>
        <div className="radio-fields"><label>State / region<input value={radio.location.state} onChange={event => locationField('state', event.target.value)} placeholder="e.g. California" /></label><label>City / metadata<input value={radio.location.city} onChange={event => locationField('city', event.target.value)} placeholder="e.g. London" /></label></div>
        <div className="radio-fields"><label>Genre / tag<input value={genre} onChange={event => setGenre(event.target.value)} placeholder="jazz, ambient…" /></label><label>Language<input value={language} onChange={event => setLanguage(event.target.value)} placeholder="e.g. english" /></label></div>
        <p className="radio-hint">City matches names, regions and tags in up to 50 directory results; city metadata is incomplete. Only HTTPS streams are listed.</p>
        <div className="radio-actions"><button type="submit" disabled={loading}>{loading ? 'Searching…' : 'Find stations'}</button><button type="button" onClick={locate} disabled={locating}>{locating ? 'Locating…' : located ? 'Location enabled' : 'Use my location'}</button>{located && <button type="button" onClick={() => setLocated(null)}>Clear location</button>}</div>
      </form>}
      {tab === 'playlist' && <div className="radio-import"><label>Import audio M3U / M3U8<input type="file" accept=".m3u,.m3u8" onChange={importPlaylist} /></label><p className="radio-hint">Public HTTPS audio streams only. No video, credentials or media-segment playlists. HLS radio entries require radio="true" and native browser support (typically Safari).</p>{radio.playlistName && <div>{radio.playlistName} <button onClick={() => radio.setPlaylist([], '')}>Clear playlist</button></div>}</div>}
      {error && <p className="radio-error" role="alert">{error}</p>}{notice && <p className="radio-hint" role="status">{notice}</p>}{radio.persistenceError && <p className="radio-error" role="alert">{radio.persistenceError}</p>}
      <div className="radio-stations" aria-label="Stations" aria-busy={loading}>{stations.map(station => <article key={station.id} className={station.id === radio.selected?.id ? 'selected' : ''}>
        {station.logo ? <img src={station.logo} alt="" loading="lazy" referrerPolicy="no-referrer" onError={event => { event.currentTarget.style.display = 'none' }} /> : <span aria-hidden="true" className="radio-logo">♫</span>}
        <button className="radio-station" onClick={() => play(station)}><strong>{station.name}</strong><small>{[station.country, station.state, station.codec, station.bitrate ? `${station.bitrate} kbps` : '', station.online === true ? 'Directory: online' : ''].filter(Boolean).join(' · ')}</small></button>
        <button onClick={() => radio.toggleFavorite(station)} aria-label={`${radio.favorites.some(s => s.id === station.id) ? 'Remove' : 'Add'} ${station.name} ${radio.favorites.some(s => s.id === station.id) ? 'from' : 'to'} favorites`}>{radio.favorites.some(s => s.id === station.id) ? '★' : '☆'}</button>
      </article>)}{!stations.length && !loading && <p className="radio-hint">{tab === 'discover' ? 'Search to discover stations. Try fewer filters if no stations match.' : 'Nothing here yet.'}</p>}</div>
      <footer><a href="https://www.radio-browser.info/" target="_blank" rel="noreferrer">Directory: Radio Browser</a><span>Radio keeps playing through pause and restart. Press P to play or pause.</span></footer>
    </section>}
  </div>
}
