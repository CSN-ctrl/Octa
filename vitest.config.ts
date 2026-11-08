import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'api/_lib/**/*.{test,spec}.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/ChaosStar/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/pages/Login.tsx',
        'src/pages/ResetPassword.tsx',
        'src/pages/AccountSecurity.tsx',
        'src/components/ErrorBoundary.tsx',
      ],
      // Floors match the current focused file list; Login.tsx is lightly covered.
      // Raise these as you add tests (target: 65%+ for lines/statements when feasible).
      thresholds: {
        lines: 48,
        statements: 47,
        functions: 45,
        branches: 36,
      },
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

