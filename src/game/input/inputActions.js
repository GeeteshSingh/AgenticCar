// Abstract input-action interface. Vehicle/traffic/camera systems consume
// this shape and never read raw keyboard codes, so touch/gamepad input can
// feed the same actions later without touching movement logic.

export const createInputActions = () => ({
  accelerate: 0, // 0..1
  brake: 0, // 0..1
  steer: 0, // -1..1 (left negative, right positive)
  handbrake: false,
})

// Maps a request to one-shot edge actions that should fire once per press.
// e.g. camera toggle, pause toggle.
export const EDGE_ACTIONS = {
  TOGGLE_CAMERA: 'toggleCamera',
  TOGGLE_PAUSE: 'togglePause',
}
