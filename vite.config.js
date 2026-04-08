import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src', // <-- set this to where your index.html lives
  build: {
    outDir: '../dist'
  }
})
