import { AppShell } from '@/app/AppShell'
import { useEffect } from 'react'

// Entry component. Delegates all composition to AppShell, which routes
// between the main menu and the 3D game session.
export default function App() {
  useEffect(() => { document.getElementById('boot-screen')?.remove() }, [])
  return <AppShell />
}
