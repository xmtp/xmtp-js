import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    testTimeout: 120000,
    hookTimeout: 60000,
    globalSetup: ["./vitest.setup.ts"],
  },
});
