import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      strict: false,
      allow: ['..'],
    },
    watch: {
      ignored: [
        '**/android/**',
        '**/.git/**',
        '**/dist/**',
        '**/node_modules/**',
        '**/*.sqlite*',
        '**/.env*',
      ],
    },
  },
});
