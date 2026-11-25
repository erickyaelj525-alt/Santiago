import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración de Vite para Apiario Digital.
// El proxy '/api' -> http://localhost:4000 evita problemas de CORS en desarrollo.
// El backend monta sus rutas bajo el prefijo /api, así que reescribimos la URL.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        // El target ya expone /api, por lo que no reescribimos el path.
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          maps: ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    globals: true,
  },
});
