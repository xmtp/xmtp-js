import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import { dts } from "rollup-plugin-dts";
import tsConfigPaths from "rollup-plugin-tsconfig-paths";

const external = [
  "@xmtp/content-type-primitives",
  "@xmtp/node-sdk",
  "node:events",
  "node:fs",
  "node:path",
  "node:querystring",
  "viem",
  "viem/accounts",
  "viem/chains",
];

const plugins = [
  json({
    preferConst: true,
  }),
  tsConfigPaths(),
  typescript({
    declaration: false,
    declarationMap: false,
    exclude: ["**/*.test.ts", "**/demo.ts"],
  }),
];

export default defineConfig([
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "es",
      sourcemap: true,
    },
    plugins,
    external,
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.d.ts",
      format: "es",
    },
    plugins: [tsConfigPaths(), dts()],
    external: ["node:events"],
  },
]);
