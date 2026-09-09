import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/vite-project/',
  server: {
    host: true, // Exposes server to network (http://192.168.1.11:5173)
  },
})

