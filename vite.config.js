import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/RPG_HP/',           // <- ajoute cette ligne
  plugins: [react()],
  server: {
    open: true
  }
});
