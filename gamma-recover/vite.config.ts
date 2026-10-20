import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-dom/client'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          validation: ['zod'],
          styles: ['styled-components'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/test/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    clearMocks: true,
  },
});
