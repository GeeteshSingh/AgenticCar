import assert from 'node:assert/strict'
import { PRODUCTS, updateCart, restoreCart } from './src/ui/shop/catalog.js'
let cart = updateCart({}, PRODUCTS[0].id, 1)
assert.equal(cart.tea, 1)
cart = updateCart(cart, 'tea', -1)
assert.deepEqual(cart, {})
assert.deepEqual(updateCart({}, 'unknown', 1), {})
assert.deepEqual(restoreCart({tea:100, snack:-1, unknown:5}), {tea:20})
assert.deepEqual(restoreCart(null), {})
console.log('Demo cart validates products, quantities and saved data')
