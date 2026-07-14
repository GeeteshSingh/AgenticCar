// Pure collision-severity + damage calculation. No React/three — testable.
//
// Inputs:
//   playerSpeed     km/h (current forward speed)
//   trafficSpeed    km/h (other vehicle's own speed)
//   direction       +1 same / -1 oncoming (relative to player)
//   impactPoint     'side' | 'front' (for light grazing vs head-on)
//
// Outputs a severity bucket and an integrity-damage amount.

export const SEVERITY = {
  NONE: 'none',
  LIGHT: 'light',
  MODERATE: 'moderate',
  SEVERE: 'severe',
}

// Impact (closing) speed in km/h. Oncoming traffic closes faster.
export function closingSpeed({ playerSpeed, trafficSpeed, direction }) {
  const p = Math.max(0, playerSpeed)
  const t = Math.max(0, trafficSpeed)
  // same direction: relative closing = player - traffic (overtaking)
  // oncoming: closing = player + traffic
  const rel = direction < 0 ? p + t : Math.max(0, p - t)
  return rel
}

// Classify severity from closing speed + impact kind.
export function classifySeverity({ closingKmh, impactKind }) {
  if (closingKmh < 25) return SEVERITY.LIGHT
  if (closingKmh < 80) return impactKind === 'side' ? SEVERITY.LIGHT : SEVERITY.MODERATE
  return SEVERITY.SEVERE
}

// Damage (integrity points 0..100) for a collision.
// Light: 5-10, Moderate: 15-30, Severe: 50-100. Scales within band by speed.
export function damageFor({ severity, closingKmh }) {
  const over = Math.max(0, closingKmh - 25) // beyond light threshold
  switch (severity) {
    case SEVERITY.LIGHT:
      return 5 + Math.min(5, over * 0.1) // ~5-10
    case SEVERITY.MODERATE:
      return 15 + Math.min(15, over * 0.2) // ~15-30
    case SEVERITY.SEVERE:
      return 50 + Math.min(50, over * 0.4) // ~50-100
    default:
      return 0
  }
}

// Convenience: full assessment from a collision event.
export function assessCollision({ playerSpeed, trafficSpeed, direction, impactKind = 'front' }) {
  const closingKmh = closingSpeed({ playerSpeed, trafficSpeed, direction })
  const severity = classifySeverity({ closingKmh, impactKind })
  const damage = damageFor({ severity, closingKmh })
  return { closingKmh, severity, damage }
}
