import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allows LAN or tunneling
    port: 5173,
    strictPort: true, // Ensures the port doesn't randomly change
    allowedHosts: ['campusfrontend.loca.lt'], // Trust LocalTunnel subdomain
    hmr: {
      protocol: 'wss', // Use secure WebSocket
      host: 'campusfrontend.loca.lt', // Match your tunnel subdomain
    },
  },
});
