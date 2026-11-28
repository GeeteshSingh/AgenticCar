const runtime = [
  ['Three.js', 'MIT'], ['React / React DOM', 'MIT'], ['@react-three/fiber', 'MIT'],
  ['@react-three/drei', 'MIT'], ['@react-three/rapier', 'Not declared in installed package metadata'],
  ['@base-ui/react', 'MIT'], ['Geist font', 'OFL-1.1'], ['Framer Motion', 'MIT'],
  ['Howler', 'MIT'], ['tw-animate-css', 'MIT'], ['Zustand', 'MIT'],
]
const development = [
  ['@radix-ui/react-slot', 'MIT'], ['@tailwindcss/postcss', 'MIT'], ['@types/react', 'MIT'],
  ['@types/react-dom', 'MIT'], ['@vitejs/plugin-react', 'MIT'], ['Autoprefixer', 'MIT'],
  ['class-variance-authority', 'Apache-2.0'], ['clsx', 'MIT'], ['lucide-react', 'ISC'],
  ['Oxlint', 'MIT'], ['PostCSS', 'MIT'], ['tailwind-merge', 'MIT'], ['Tailwind CSS', 'MIT'],
  ['Vite', 'MIT'], ['shadcn', 'MIT'],
]
export function Credits() {
  return <details><summary>Credits &amp; licences</summary>
    <p>Thank you to Bruno Simon’s folio for inspiration.</p>
    <p>Direct dependencies, based on installed package metadata:</p>
    <h3>Runtime</h3><ul>{runtime.map(([name, licence]) => <li key={name}>{name}: {licence}</li>)}</ul>
    <h3>Development</h3><ul>{development.map(([name, licence]) => <li key={name}>{name}: {licence}</li>)}</ul>
  </details>
}
