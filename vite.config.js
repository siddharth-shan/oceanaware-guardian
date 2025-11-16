import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { splitVendorChunkPlugin } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin()
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    include: ['./tests/__tests__/**/*.test.js', './tests/__tests__/**/*.spec.js', './tests/__tests__/**/*.test.jsx', './tests/__tests__/**/*.spec.jsx', './test-*.js'],
  },
  build: {
    outDir: 'dist', 
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          maps: ['react-leaflet', 'leaflet'],
          ui: ['lucide-react', 'framer-motion']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});