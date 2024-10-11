/// <reference types="vitest" />
import { defineConfig, mergeConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig as defineVitestConfig } from "vitest/config";

// https://vitejs.dev/config/
const viteConfig = defineConfig({
  plugins: [tsconfigPaths()],
});

const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    testTimeout: 120000,
    hookTimeout: 60000,
    globalSetup: ["./vitest.setup.ts"],
  },
});

export default mergeConfig(viteConfig, vitestConfig);
