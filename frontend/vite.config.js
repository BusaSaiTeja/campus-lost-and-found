import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();
const HOST = process.env.VITE_API_HOST || 'localhost';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: [HOST], // use process.env here
    hmr: {
      protocol: 'wss',
      host: HOST,
    },
  },
});
