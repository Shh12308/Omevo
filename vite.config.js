import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',      // makes paths relative for Vercel
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
