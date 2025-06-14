import { defineConfig } from 'vite';

export default defineConfig({
  base: '/your-repo-name/', // Replace with your GitHub repo name
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  terserOptions: {
    format: {
      comments: false // Set to false to remove comments
    }
  },
  server: {
    open: true
  }
});
