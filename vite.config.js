import { defineConfig } from 'vite';

export default defineConfig({
  base: '/law-treetep/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist'
  }
});
