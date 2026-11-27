import assert from 'node:assert/strict'
import {PLAYER_VEHICLES,vehicleKey,playerVehicle,createVehicleKeySelector} from './src/game/config/playerVehicles.js'
assert.equal(PLAYER_VEHICLES.length,10)
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

const selector = createVehicleKeySelector()
assert.equal(selector.select('Digit1', 100), 0)
assert.equal(selector.select('Digit1', 800), 9)
assert.equal(playerVehicle(9).maxSpeed, 400)
assert.ok(playerVehicle(9).enginePower > 400 * .12 + 6)
assert.equal(selector.select('Numpad1', 2000), 0)
assert.equal(selector.select('Numpad1', 3200), 0)
selector.reset()
assert.equal(selector.select('Digit1', 3300), 0)
assert.equal(selector.select('Digit2', 3400), 1)
assert.equal(selector.select('Digit1', 3500), 0)
