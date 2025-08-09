import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['campusfrontend.loca.lt'],  // Add your localtunnel domain here
  },
});
