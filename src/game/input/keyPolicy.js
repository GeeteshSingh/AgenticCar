const codes = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD','KeyH','KeyC','KeyP','KeyM','KeyR','Escape', ...Array.from({length:9}, (_, i) => `Digit${i+1}`), ...Array.from({length:9}, (_, i) => `Numpad${i+1}`)])
export function shouldPreventGameKey(event, canvasFocused) {
  return canvasFocused && !event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing && codes.has(event.code)
}
