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
  tsConfigPaths(),
  typescript({
    declaration: false,
    declarationMap: false,
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
  {
    input: "src/debug/index.ts",
    output: {
      file: "dist/debug.js",
      format: "es",
      sourcemap: true,
    },
    plugins,
    external,
  },
  {
    input: "src/debug/index.ts",
    output: {
      file: "dist/debug.d.ts",
      format: "es",
    },
    plugins: [tsConfigPaths(), dts()],
    external: ["node:events"],
  },
  {
    input: "src/middleware/index.ts",
    output: {
      file: "dist/middleware.js",
      format: "es",
      sourcemap: true,
    },
    plugins,
    external,
  },
  {
    input: "src/middleware/index.ts",
    output: {
      file: "dist/middleware.d.ts",
      format: "es",
    },
    plugins: [tsConfigPaths(), dts()],
    external: ["node:events"],
  },
  {
    input: "src/user/index.ts",
    output: {
      file: "dist/user.js",
      format: "es",
      sourcemap: true,
    },
    plugins,
    external,
  },
  {
    input: "src/user/index.ts",
    output: {
      file: "dist/user.d.ts",
      format: "es",
    },
    plugins: [tsConfigPaths(), dts()],
  },
  {
    input: "src/util/index.ts",
    output: {
      file: "dist/util.js",
      format: "es",
      sourcemap: true,
    },
    plugins,
    external,
  },
  {
    input: "src/util/index.ts",
    output: {
      file: "dist/util.d.ts",
      format: "es",
    },
    plugins: [tsConfigPaths(), dts()],
  },
]);
