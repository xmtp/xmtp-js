/// <reference types="vitest" />
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, type Plugin } from "vitest/config";

// https://vitejs.dev/config/
const vitestConfig = defineConfig({
  plugins: [tsconfigPaths() as Plugin],
  test: {
    globals: true,
  },
});

export default vitestConfig;
