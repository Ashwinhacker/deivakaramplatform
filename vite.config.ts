import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import backendApp from './server/index.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'backend-api-middleware',
      configureServer(server) {
        server.middlewares.use(backendApp);
      }
    }
  ],
  server: {
    host: true, // Listen on all network addresses (0.0.0.0) for mobile access
    port: 5173
  }
})
