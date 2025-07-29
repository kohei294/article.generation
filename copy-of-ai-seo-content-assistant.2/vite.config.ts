import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This proxy configuration is for LOCAL DEVELOPMENT ONLY.
    // It forwards any requests made to /api/... from the Vite dev server (e.g., localhost:5173)
    // to the Vercel serverless functions, which are expected to be running on port 3000.
    // To use this, run `vercel dev` in your terminal, which starts both the Vite server
    // and the serverless function environment.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})