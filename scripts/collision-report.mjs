import { PLAYER_VEHICLES } from '../src/game/config/playerVehicles.js'
import { TRAFFIC } from '../src/game/config/trafficConfig.js'
import { DIFFICULTY } from '../src/game/config/difficultyConfig.js'
import { trafficDeltaZ, trafficStep } from '../src/game/traffic/trafficSimulation.js'

console.log('player,traffic,scenario,frame_dt_s,closing_speed_m_s,movement_per_update_m,half_length_sum_m,margin_m,result')
for (const p of PLAYER_VEHICLES) for (const v of TRAFFIC.types) for (const direction of [-1, 1]) for (const dt of [1 / 20, 1 / 30, 1 / 60]) {
  // Overtaking uses the slowest configured same-direction traffic, which yields
  // the maximum positive closing rate at a fixed player top speed.
  const speed = direction < 0 ? DIFFICULTY.traffic.oncomingSpeedMax : DIFFICULTY.traffic.sameDirectionSpeedMin
  const closing = (p.topSpeedKmh - speed * direction) / 3.6
  const movement = Math.abs(trafficDeltaZ(p.topSpeedKmh, { speed, direction }, dt))
  const half = (p.length + v.length) / 2
  // Strict AABB overlap covers (-half, +half), so its actual depth is 2*half.
  const margin = 2 * half - movement
  console.log([p.type, v.id, direction < 0 ? 'head-on' : 'same-direction', dt.toFixed(5), closing.toFixed(3), movement.toFixed(3), half.toFixed(3), margin.toFixed(3), movement < 2 * half ? 'PASS' : 'FAIL'].join(','))
}
// trafficDeltaZ already applies trafficStep's 1/30 s cap.
if (trafficStep(1 / 20) !== 1 / 30) throw new Error('Traffic dt cap changed')
