import { defineConfig, mergeConfig } from "vite";
import { defineConfig as defineVitestConfig } from "vitest/config";

// https://vitejs.dev/config/
const viteConfig = defineConfig({});

const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    environment: "happy-dom",
  },
});

export default mergeConfig(viteConfig, vitestConfig);
