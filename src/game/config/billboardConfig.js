// Fictional examples only; no ads, tracking, or affiliate links are active.
export const BILLBOARDS = [
  {id:'chai', name:'Mile Chai', tagline:'A warm stop ahead', hindi:'हर सफ़र में चाय', color:'#9b3e27'},
  {id:'trail', name:'Monsoon Trail', tagline:'Find your next turn', hindi:'सफ़र अभी बाकी है', color:'#1c6656'},
  {id:'mango', name:'Mango Mile', tagline:'A little sunshine', hindi:'आम का मौसम', color:'#a55a0a'},
  {id:'camp', name:'Starfield Camp', tagline:'Stay under the stars', hindi:'तारों के नीचे', color:'#3b5486'},
  {id:'coffee', name:'Roadside Roast', tagline:'Coffee for the journey', hindi:'रास्ते की ताज़गी', color:'#754c35'},
  {id:'river', name:'Riverbend', tagline:'Take the scenic route', hindi:'रास्ता है ख़ूबसूरत', color:'#28758a'},
]
export function findBillboard(cell) { return BILLBOARDS[((cell % BILLBOARDS.length) + BILLBOARDS.length) % BILLBOARDS.length] }
