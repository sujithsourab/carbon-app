import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react', '@types/leaflet-draw'],
  },
  resolve: {
    alias: {
      '@types/leaflet-draw': '/node_modules/@types/leaflet-draw/index.d.ts'
    }
  }
});