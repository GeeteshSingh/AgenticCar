import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { brand } from './src/config/brand.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: 'brand-metadata',
    transformIndexHtml(html) {
      return html.replaceAll('%BRAND_NAME%', brand.name)
        .replaceAll('%BRAND_DESCRIPTION%', brand.description)
        .replaceAll('%BRAND_BACKGROUND%', brand.colors.background)
    },
  }],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
