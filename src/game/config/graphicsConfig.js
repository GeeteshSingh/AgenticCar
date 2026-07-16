// Phase 9: graphics presets + auto performance tier thresholds.
// Low/Medium/High trade visual fidelity for frame rate. 'auto' resolves to a
// tier and can step down at runtime if the measured FPS drops below target.

export const GRAPHICS_TIERS = ['low', 'medium', 'high']

// Each preset describes how the scene should be configured. GameCanvas reads
// these to set the R3F Canvas props; GameWorld reads shadowMapSize to size the
// directional light's shadow buffer.
export const GRAPHICS_PRESETS = {
  low: {
    label: 'Low',
    dpr: [1, 1], // clamp to 1x; cheapest
    shadows: false,
    antialias: false,
    shadowMapSize: 0, // no shadows
    fogFar: 420,
  },
  medium: {
    label: 'Medium',
    dpr: [1, 1.5],
    shadows: true,
    antialias: true,
    shadowMapSize: 1024,
    fogFar: 520,
  },
  high: {
    label: 'High',
    dpr: [1, 2],
    shadows: true,
    antialias: true,
    shadowMapSize: 2048,
    fogFar: 640,
  },
}

// Resolve the effective preset given the user's choice and (for auto) the
// current runtime tier. Falls back to 'high' for unknown input.
export function resolvePreset(graphicsQuality, autoTier) {
  if (graphicsQuality === 'auto') {
    return GRAPHICS_PRESETS[autoTier] || GRAPHICS_PRESETS.high
  }
  return GRAPHICS_PRESETS[graphicsQuality] || GRAPHICS_PRESETS.high
}

// Auto-tier hysteresis. Returns the next tier to switch to, or null to keep
// the current one. Steps down one tier if sustained FPS is too low; steps up
// only when comfortably above target for a while.
export const AUTO_TIER = {
  // FPS we try to hold in auto mode.
  targetFps: 50,
  // Below this for the down-window => drop a tier.
  downFps: 40,
  // Above this for the up-window => try raising a tier.
  upFps: 58,
  // Number of consecutive samples required before changing tier.
  downSamples: 90, // ~1.5s at 60fps
  upSamples: 240, // ~4s at 60fps
}

// Given current tier and a rolling FPS estimate, decide the next tier.
export function nextAutoTier(currentTier, fps, lowCount, highCount) {
  const idx = GRAPHICS_TIERS.indexOf(currentTier)
  if (fps <= AUTO_TIER.downFps && lowCount >= AUTO_TIER.downSamples && idx > 0) {
    return GRAPHICS_TIERS[idx - 1]
  }
  if (fps >= AUTO_TIER.upFps && highCount >= AUTO_TIER.upSamples && idx < GRAPHICS_TIERS.length - 1) {
    return GRAPHICS_TIERS[idx + 1]
  }
  return null
}
