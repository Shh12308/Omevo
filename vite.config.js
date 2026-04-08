import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',          // project root
  build: {
    outDir: 'dist',   // inside project root
    emptyOutDir: true // cleans dist before build
  }
})
