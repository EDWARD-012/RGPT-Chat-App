import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr' // <-- 1. Import the plugin

export default defineConfig({
  plugins: [react(), svgr()], // <-- 2. Add svgr() here
})