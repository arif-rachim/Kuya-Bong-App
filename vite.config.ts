import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' supaya aset berfungsi di static hosting sub-folder (mis. GitHub Pages)
// dan saat dibungkus Capacitor (file:// di WebView).
export default defineConfig({
  plugins: [react()],
  base: './',
})
