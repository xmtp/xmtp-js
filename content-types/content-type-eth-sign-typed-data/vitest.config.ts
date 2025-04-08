import { defineConfig } from "vitest/config.js";

export default defineConfig({
  test: {
    globals: true,
    globalSetup: ["./vitest.setup.ts"],
  },
});
