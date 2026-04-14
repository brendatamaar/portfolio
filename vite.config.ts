import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@portfolio/shared': path.resolve(__dirname, 'shared'),
    },
  },
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/motion') ||
            id.includes('node_modules/framer-motion')
          ) {
            return 'vendor-motion'
          }
          if (
            id.includes('node_modules/@tanstack/react-router') ||
            id.includes('node_modules/@tanstack/router-core')
          ) {
            return 'vendor-router'
          }
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/')
          ) {
            return 'vendor-react'
          }
        },
      },
    },
  },
})
