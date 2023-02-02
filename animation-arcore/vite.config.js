// vite.config.js
import { defineConfig } from 'vite'
// vite.config.js
import mkcert from 'vite-plugin-mkcert'

// vite.config.js
export default {
  base: './',
  // config options
  build: {
    outDir: '../.'
  },
  plugins: [ mkcert() ],
  server: { https: true }
}