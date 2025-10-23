import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // @see https://github.com/aleclarson/vite-tsconfig-paths/issues/176
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
  },
});
