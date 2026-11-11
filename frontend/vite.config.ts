import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // /api viene girato al server Express: stessa origine, niente CORS
    proxy: { '/api': 'http://localhost:3001' },
  },
});
