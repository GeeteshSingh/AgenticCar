import { Component, createElement } from 'react'

export function ChunkErrorFallback({ onClose }) {
  return createElement('div', { role: 'alert', style: { position: 'fixed', inset: 0, zIndex: 70, display: 'grid', placeContent: 'center', gap: 12, background: '#0f172a', color: '#f1f5f9', textAlign: 'center', padding: 24 } },
    createElement('p', null, 'Could not load this part of the game. Check your connection and retry.'),
    createElement('button', { type: 'button', onClick: () => window.location.reload(), style: { padding: 12, background: '#d7e8d9', color: '#16322b', borderRadius: 8 } }, 'Retry (reload page)'),
    onClose && createElement('button', { type: 'button', onClick: onClose, style: { padding: 12, color: '#fff' } }, 'Close and resume'))
}
export class ChunkBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? createElement(ChunkErrorFallback, { onClose: this.props.onClose }) : this.props.children }
}
