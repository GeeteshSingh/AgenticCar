import { createRealRoute } from './realRoute.js'

// Synthetic geometry for trying the route machinery; these are not real-world coordinates.
export const tharPrototype = createRealRoute([
  {x:0, z:0, y:0}, {x:15, z:600, y:1}, {x:70, z:1200, y:4},
  {x:25, z:1800, y:2}, {x:-25, z:2400, y:3}, {x:0, z:3000, y:0},
])
