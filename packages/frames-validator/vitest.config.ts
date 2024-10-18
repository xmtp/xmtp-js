import { defineConfig, mergeConfig } from "vite";
import { defineConfig as defineVitestConfig } from "vitest/config";

// https://vitejs.dev/config/
const viteConfig = defineConfig({
  plugins: [],
});

const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    environment: "node",
  },
});

export default mergeConfig(viteConfig, vitestConfig);
