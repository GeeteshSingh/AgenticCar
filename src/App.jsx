import { AppShell } from '@/app/AppShell'

// Entry component. Delegates all composition to AppShell, which routes
// between the main menu and the 3D game session.
export default function App() {
  return <AppShell />
}
