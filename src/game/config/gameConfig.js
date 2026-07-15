// Global gameplay + world constants. Pure data only.

export const WORLD = {
  // Highway geometry (meters-ish units)
  laneCount: 4,
  laneWidth: 4,
  roadLength: 600, // length of a recycled segment pool window (z span)
  shoulderWidth: 2,
  // Total drivable width derived from lanes
  get roadWidth() {
    return this.laneCount * this.laneWidth
  },
  // How far ahead/behind the visible world extends
  viewDistance: 220,
  // Ground beyond the road for visual context
  groundWidth: 400,
  groundLength: 1200,
}

export const PHYSICS = {
  fixedTimestep: 1 / 60,
  maxSubSteps: 5,
}

// Lighting / environment defaults (day baseline; day-night arrives Phase 7)
export const ENVIRONMENT = {
  day: {
    sunPosition: [60, 90, 40],
    sunIntensity: 2.0,
    ambientIntensity: 0.85,
    skyColor: '#7db8f0',
    fogColor: '#bcd4ec',
    fogNear: 220,
    fogFar: 640,
  },
}
