import assert from 'node:assert/strict'
import {PLAYER_VEHICLES,vehicleKey,playerVehicle} from './src/game/config/playerVehicles.js'
assert.equal(PLAYER_VEHICLES.length,9)
for(let i=0;i<9;i++) {
 assert.equal(vehicleKey(`Digit${i+1}`),i)
 assert.equal(vehicleKey(`Numpad${i+1}`),i)
 const v=playerVehicle(i)
 assert.ok(v.width>0 && v.width<4 && v.length>0 && v.maxSpeed>0)
}
assert.equal(vehicleKey('Digit0'),null)
assert.equal(vehicleKey('KeyW'),null)
assert.equal(playerVehicle(2).maxSpeed,35)
assert.equal(playerVehicle(99),PLAYER_VEHICLES[0])
console.log('Vehicle selection and profile tests passed')
