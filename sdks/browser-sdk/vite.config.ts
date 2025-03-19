import { defineConfig, mergeConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig as defineVitestConfig } from "vitest/config";

// https://vitejs.dev/config/
const viteConfig = defineConfig({
  plugins: [tsconfigPaths()],
});

const vitestConfig = defineVitestConfig({
  optimizeDeps: {
    exclude: ["@xmtp/wasm-bindings"],
  },
  test: {
    browser: {
      provider: "playwright",
      enabled: true,
      name: "chromium",
      headless: true,
      screenshotFailures: false,
    },
    testTimeout: 120000,
  },
});

export default mergeConfig(viteConfig, vitestConfig);
