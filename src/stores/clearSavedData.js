// Only keys owned by this application are removed; unrelated sites' storage is untouched.
export const SAVED_DATA_KEYS = ['agenticcar-settings', 'agenticcar-radio-v1', 'wayfound-demo-cart-v1']
export function clearSavedData(storage) {
  for (const key of SAVED_DATA_KEYS) storage.removeItem(key)
}
