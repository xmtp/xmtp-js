import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import { dts } from "rollup-plugin-dts";
import tsConfigPaths from "rollup-plugin-tsconfig-paths";

const external = [
  "node:path",
  "node:process",
  "node:util/types",
  "@xmtp/content-type-group-updated",
  "@xmtp/content-type-primitives",
  "@xmtp/content-type-text",
  "@xmtp/node-bindings",
  "@xmtp/node-bindings/version.json",
];

const plugins = [
  tsConfigPaths(),
  typescript({
    declaration: false,
    declarationMap: false,
  }),
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
      sourcemap: true,
      importAttributesKey: "with",
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
  },
]);
