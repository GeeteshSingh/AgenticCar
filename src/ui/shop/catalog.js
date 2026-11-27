export const PRODUCTS = [
  { id:'tea', name:'Desert masala chai', detail:'Loose-leaf tea · fictional item' },
  { id:'snack', name:'Roadside namkeen', detail:'Spiced snack · fictional item' },
  { id:'mango', name:'Mango drink', detail:'Fruit drink · fictional item' },
  { id:'water', name:'Water bottle', detail:'Drinking water · fictional item' },
]
export function updateCart(cart, id, change) {
  if (!PRODUCTS.some(product => product.id === id) || !Number.isInteger(change)) return cart
  const quantity = Math.max(0, Math.min(20, (cart[id] || 0) + change))
  const next = { ...cart }
  if (quantity) next[id] = quantity
  else delete next[id]
  return next
}
export function restoreCart(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return Object.fromEntries(PRODUCTS.filter(product => Number.isInteger(raw[product.id]) && raw[product.id] > 0)
    .map(product => [product.id, Math.min(20, raw[product.id])]))
}
