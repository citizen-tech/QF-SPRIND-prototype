import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // MUSS dem Repository-Namen entsprechen, sonst laden die Assets auf GitHub Pages nicht.
  base: '/QF-SPRIND-prototype/',
});
