import { defineConfig, mergeConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig as defineVitestConfig } from "vitest/config";

// https://vitejs.dev/config/
const viteConfig = defineConfig({
  plugins: [tsconfigPaths()],
});

const vitestConfig = defineVitestConfig({
  test: {
    browser: {
      provider: "playwright",
      enabled: true,
      name: "chromium",
    },
    globals: true,
    environment: "happy-dom",
  },
});

export default mergeConfig(viteConfig, vitestConfig);
