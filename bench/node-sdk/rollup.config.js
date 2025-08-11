import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import tsConfigPaths from "rollup-plugin-tsconfig-paths";

const external = [
  "@xmtp/node-sdk",
  "@xmtp/node-sdk/package.json",
  "fast-glob",
  "viem",
  "viem/accounts",
  "viem/chains",
  "node:path",
  "node:url",
  "node:worker_threads",
  "node:fs",
  "node:fs/promises",
  "node:process",
];

const plugins = [
  tsConfigPaths(),
  typescript(),
  json({
    preferConst: true,
  }),
];

export default defineConfig([
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "es",
      importAttributesKey: "with",
    },
    plugins,
    external,
  },
  {
    input: "src/worker.ts",
    output: {
      file: "dist/worker.js",
      format: "es",
      importAttributesKey: "with",
    },
    plugins,
    external,
  },
  {
    input: "src/setup.ts",
    output: {
      file: "dist/setup.js",
      format: "es",
    },
    plugins,
    external,
  },
]);
