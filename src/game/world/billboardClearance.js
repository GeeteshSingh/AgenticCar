// Keep roadside objects away from the depth plane of each billboard.
export const BILLBOARD_SPACING = 400
export const BILLBOARD_OFFSET = 160
export const BILLBOARD_CLEARANCE = 35
export function nearBillboard(distance) {
  const nearest = Math.round((distance - BILLBOARD_OFFSET) / BILLBOARD_SPACING)
  return nearest >= 0 && Math.abs(distance - (nearest * BILLBOARD_SPACING + BILLBOARD_OFFSET)) < BILLBOARD_CLEARANCE
}
