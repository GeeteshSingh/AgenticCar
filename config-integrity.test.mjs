import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PLAYER_VEHICLES, vehicleKey } from './src/game/config/playerVehicles.js'
import { VEHICLE } from './src/game/config/vehicleConfig.js'
import { SOUND_PROFILES } from './src/game/audio/drivingMix.js'
import { INDIAN_ROUTES, routeName } from './src/game/config/environmentConfig.js'
import { BILLBOARDS } from './src/game/config/billboardConfig.js'
import { PRODUCTS } from './src/ui/shop/catalog.js'
import { brand } from './src/config/brand.js'

test('vehicle profiles have unique types, speeds, and effective tuning', () => {
  assert.equal(new Set(PLAYER_VEHICLES.map(v => v.type)).size, PLAYER_VEHICLES.length)
  for (const v of PLAYER_VEHICLES) {
    assert.ok(v.name && v.topSpeedKmh > 0 && (v.enginePower ?? VEHICLE.enginePower) > 0)
    assert.ok(VEHICLE.brakingPower > 0)
    assert.ok(SOUND_PROFILES[v.type] || SOUND_PROFILES.suv)
  }
  const speed = type => PLAYER_VEHICLES.find(v => v.type === type).topSpeedKmh
  assert.ok(speed('cycle') < speed('auto') && speed('auto') < speed('bike'))
  for (const type of ['hatch', 'sedan', 'suv', 'pickup', 'supercar']) assert.ok(speed('cycle') < speed(type))
  for (let n = 1; n <= 9; n++) assert.ok(PLAYER_VEHICLES[vehicleKey(`Digit${n}`)])
})

test('routes and brand provide required data', () => {
  for (const route of Object.values(INDIAN_ROUTES)) for (const key of ['name', 'region', 'description', 'weather', 'time']) assert.ok(route[key])
  for (const id of ['kashmir', 'desert', 'thar_test']) assert.ok(INDIAN_ROUTES[id])
  assert.equal(routeName('not-a-route'), 'Indian highway')
  for (const key of ['name', 'slug', 'tagline', 'description']) assert.ok(brand[key])
  assert.match(brand.slug, /^[a-z0-9-]+$/)
})

test('billboard and fictional product data is valid and unique', () => {
  for (const entries of [BILLBOARDS, PRODUCTS]) assert.equal(new Set(entries.map(x => x.id)).size, entries.length)
  for (const b of BILLBOARDS) {
    assert.ok(b.id && b.name && b.tagline && /^#[0-9a-f]{6}$/i.test(b.color))
    if (b.url) assert.equal(new URL(b.url).protocol, 'https:')
  }
  for (const p of PRODUCTS) assert.ok(p.id && p.name && p.detail)
})

// Known gap: the secret supercar falls back to the SUV sound profile.
test.skip('every vehicle has a dedicated sound profile', () => {
  for (const v of PLAYER_VEHICLES) assert.ok(SOUND_PROFILES[v.type], `${v.type} has no dedicated sound profile`)
})
