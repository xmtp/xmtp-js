import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig as defineVitestConfig} from "vitest/config";

// https://vitejs.dev/config/
const viteConfig = defineConfig({
  plugins: [tsconfigPaths(), react(), basicSsl()],
  optimizeDeps: {
    exclude: ["@xmtp/wasm-bindings"],
  },
  build: {
    sourcemap: true,
  },
  server: {
    allowedHosts: true,
  },
});

const vitestConfig = defineVitestConfig({
  test: {
    browser: {
      provider: playwright(),
      enabled: true,
      headless: true,
      screenshotFailures: false,
      instances: [
        {
          browser: "chromium",
        },
      ],
    },
    testTimeout: 120000,
  },
});

export default mergeConfig(viteConfig, vitestConfig);
