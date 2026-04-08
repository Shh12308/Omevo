import { defineConfig } from 'vite'

export default defineConfig({
  root: '.', // <-- set this to where your index.html lives
  build: {
    outDir: '../dist'
  }
})
