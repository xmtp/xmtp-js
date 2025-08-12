import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import tsConfigPaths from "rollup-plugin-tsconfig-paths";

const external = [
  "@xmtp/node-sdk",
  "@xmtp/node-sdk/package.json",
  "fast-glob",
  "prettier",
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
    input: "src/bench/bench.ts",
    output: {
      file: "dist/bench/bench.js",
      format: "es",
      importAttributesKey: "with",
    },
    plugins,
    external,
  },
  {
    input: "src/bench/worker.ts",
    output: {
      file: "dist/bench/worker.js",
      format: "es",
      importAttributesKey: "with",
    },
    plugins,
    external,
  },
  {
    input: "src/streams/messages.ts",
    output: {
      file: "dist/streams/messages.js",
      format: "es",
      importAttributesKey: "with",
    },
    plugins,
    external,
  },
  {
    input: "src/streams/worker.ts",
    output: {
      file: "dist/streams/worker.js",
      format: "es",
      importAttributesKey: "with",
    },
    plugins,
    external,
  },
]);
