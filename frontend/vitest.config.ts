import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Merges the app Vite config with Vitest-specific settings so the test
// runner shares the same aliases, envDir, plugins, etc.
export default defineConfig(
  mergeConfig(
    viteConfig,
    defineConfig({
      test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        globals: true,
      },
    }),
  ),
);
