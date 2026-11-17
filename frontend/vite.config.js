import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'

// In development the Django server runs on :8000. Proxying keeps the browser
// on one origin, the same way Vercel serves the app in production.
const backend = 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  // Read VITE_* variables from the .env file in the repo root.
  envDir: '..',
  server: {
    proxy: {
      '/api': backend,
      '/admin': backend,
      '/static': backend,
    },
  },
})
