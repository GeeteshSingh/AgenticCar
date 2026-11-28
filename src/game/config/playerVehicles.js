// Original vehicle designs inspired by familiar Indian road silhouettes.
export const PLAYER_VEHICLES = [
  {name:'Desert SUV',type:'suv',color:'#b84b36',width:1.95,length:4.1,height:1.9,topSpeedKmh:150},
  {name:'Highway truck',type:'truck',color:'#cf9e38',width:2.4,length:7,height:3,topSpeedKmh:100},
  {name:'Road bicycle',type:'cycle',color:'#43bfae',width:.65,length:1.9,height:1.4,topSpeedKmh:30,enginePower:11,freeAcceleration:1.2},
  {name:'City hatchback',type:'hatch',color:'#e8b74a',width:1.7,length:3.6,height:1.5,topSpeedKmh:150},
  {name:'Family sedan',type:'sedan',color:'#dfddd4',width:1.85,length:4.5,height:1.45,topSpeedKmh:160},
  {name:'Auto rickshaw',type:'auto',color:'#e6ba32',width:1.4,length:2.8,height:1.8,topSpeedKmh:60},
  {name:'Touring motorcycle',type:'bike',color:'#49667a',width:.8,length:2.2,height:1.4,topSpeedKmh:110},
  {name:'Intercity bus',type:'bus',color:'#ece4cc',width:2.4,length:8,height:2.9,topSpeedKmh:100},
  {name:'Farm pickup',type:'pickup',color:'#54816e',width:1.95,length:5,height:1.8,topSpeedKmh:140},
  {name:'Supercar',type:'supercar',color:'#e8c228',width:2.02,length:4.7,height:1.15,topSpeedKmh:400,enginePower:110},
]
export const CHEAT_VEHICLE_INDEX = 9
export const playerVehicle = index => PLAYER_VEHICLES[index] || PLAYER_VEHICLES[0]
export const vehicleTopSpeed = index => playerVehicle(index).topSpeedKmh
export function vehicleKey(code) {
  const match = /^(?:Digit|Numpad)([1-9])$/.exec(code)
  return match ? Number(match[1])-1 : null
}

// Two separate 1 key presses within one second; holding the key never counts.
export function createVehicleKeySelector() {
  let lastOne = -Infinity
  return {
    select(code, now) {
      const selected = vehicleKey(code)
      const cheat = selected === 0 && now - lastOne <= 1000 && now >= lastOne
      lastOne = selected === 0 && !cheat ? now : -Infinity
      return cheat ? CHEAT_VEHICLE_INDEX : selected
    },
    reset() { lastOne = -Infinity },
  }
}
