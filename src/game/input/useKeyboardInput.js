import { useEffect, useRef } from 'react'

// Translates keyboard state into an abstract input-action object held in a
// ref (no React state churn). Also exposes a small edge-action queue for
// discrete presses (camera/pause toggle) so they fire exactly once.
//
// Keyboard map (per spec):
//   W / ArrowUp    -> accelerate
//   S / ArrowDown  -> brake (reverse only at very low speed, handled by controller)
//   A / ArrowLeft  -> steer left
//   D / ArrowRight -> steer right
//   Space          -> handbrake
//   C              -> toggle camera (edge)
//   Escape         -> pause/resume (edge)

export function useKeyboardInput({ enabled = true } = {}) {
  const actionsRef = useRef({
    accelerate: 0,
    brake: 0,
    steer: 0,
    handbrake: false,
  })
  const edgeQueueRef = useRef([])
  const pressedRef = useRef(new Set())

  useEffect(() => {
    if (!enabled) return

    const setKey = (code, isDown) => {
      const a = actionsRef.current
      // Steer is derived from the currently held steering keys so it always
      // returns to center when a key is released (even if the opposite key is
      // still held).
      const applySteer = () => {
        const left = pressedRef.current.has('ArrowLeft') || pressedRef.current.has('KeyA')
        const right = pressedRef.current.has('ArrowRight') || pressedRef.current.has('KeyD')
        a.steer = right && !left ? 1 : left && !right ? -1 : 0
      }
      switch (code) {
        case 'KeyW':
        case 'ArrowUp':
          a.accelerate = isDown ? 1 : 0
          break
        case 'KeyS':
        case 'ArrowDown':
          a.brake = isDown ? 1 : 0
          break
        case 'KeyA':
        case 'ArrowLeft':
        case 'KeyD':
        case 'ArrowRight':
          applySteer()
          break
        case 'Space':
          a.handbrake = isDown
          break
        case 'KeyC':
          if (isDown) edgeQueueRef.current.push('toggleCamera')
          break
        case 'Escape':
          if (isDown) edgeQueueRef.current.push('togglePause')
          break
        default:
          break
      }
    }

    const onKeyDown = (e) => {
      if (pressedRef.current.has(e.code)) return // ignore auto-repeat
      pressedRef.current.add(e.code)
      // Prevent page scroll on arrows/space during play
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault()
      }
      setKey(e.code, true)
    }
    const onKeyUp = (e) => {
      pressedRef.current.delete(e.code)
      setKey(e.code, false)
    }
    const onBlur = () => {
      // Release everything if focus is lost
      actionsRef.current = { accelerate: 0, brake: 0, steer: 0, handbrake: false }
      pressedRef.current.clear()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [enabled])

  const consumeEdgeActions = () => {
    const q = edgeQueueRef.current
    edgeQueueRef.current = []
    return q
  }

  return { actionsRef, consumeEdgeActions }
}
