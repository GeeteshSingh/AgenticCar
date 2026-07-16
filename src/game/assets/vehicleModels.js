// Maps game vehicle archetypes (and the player) to GLB model files and the
// color tints applied on load. All GLBs live in /public/vehicles and are
// served at /vehicles/<file>. VehicleModel auto-fits each to its target dims,
// so exact native scale is irrelevant here.

export const VEHICLE_GLB_FILES = [
  'normalcar1.glb',
  'normalcar2.glb',
  'sportscar.glb',
  'sportscar2.glb',
  'suv.glb',
  'taxi.glb',
  'cop.glb',
  'cop2.glb',
]

// Traffic archetype -> model file. Variation comes from both the file and the
// per-type color tint defined in trafficConfig.
export const TRAFFIC_MODEL_BY_TYPE = {
  sedan: 'normalcar1.glb',
  truck: 'suv.glb',
  van: 'taxi.glb',
  sport: 'sportscar.glb',
}

// Player vehicle uses the sleek sports car.
export const PLAYER_MODEL_FILE = 'sportscar2.glb'

export function modelFileForTrafficType(type) {
  return TRAFFIC_MODEL_BY_TYPE[type] || 'normalcar2.glb'
}
