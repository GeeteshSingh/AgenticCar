export function shouldShowTouchControls({ coarse, fine, requested }) {
  return Boolean(requested || (coarse && !fine))
}
