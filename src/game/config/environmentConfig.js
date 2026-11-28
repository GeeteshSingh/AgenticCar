// Stored keys stay stable so existing preferences and saved runs remain valid.
export const INDIAN_ROUTES = {
  kashmir: { name: 'Jammu & Kashmir', region: 'Kashmir Valley · Himalayas', description: 'Mountain roads through pine forests and snowy peaks.', weather: 'clear', time: 'night' },
  forest: { name: 'Western Ghats', region: 'Maharashtra · Karnataka', description: 'Mist-covered green hills, broadleaf forests and winding climbs.', weather: 'fog', time: 'day' },
  thar_test: { name: 'Thar Road Prototype', region: 'Test route', description: 'Fictional free-roam test area with an intersection and chai stop; not real map data.', weather: 'clear', time: 'sunset' },
  desert: { name: 'Thar Desert', region: 'Rajasthan', description: 'Golden dunes, dry scrub and wide open desert horizons.', weather: 'clear', time: 'sunset' },
  coast: { name: 'Konkan Coast', region: 'Goa · Coastal Maharashtra', description: 'Palm-lined shores, warm sand and the Arabian Sea.', weather: 'clear', time: 'day' },
  countryside: { name: 'Deccan Plateau', region: 'Interior Karnataka · Maharashtra', description: 'Open farmland, reddish soil and weathered basalt hills.', weather: 'clear', time: 'sunrise' },
}
export const routeName = id => INDIAN_ROUTES[id]?.name || 'Indian highway'
