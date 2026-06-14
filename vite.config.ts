import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' so assets resolve on static hosting sub-folders (e.g. GitHub Pages)
// and when wrapped in Capacitor (file:// in the WebView).
export default defineConfig({
  plugins: [react()],
  base: './',
})
