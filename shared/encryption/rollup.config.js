import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { resolveExtensions } from "@xmtp/rollup-plugin-resolve-extensions";
import { defineConfig } from "rollup";
import { dts } from "rollup-plugin-dts";
import filesize from "rollup-plugin-filesize";
import tsConfigPaths from "rollup-plugin-tsconfig-paths";

const external = ["@xmtp/proto", "node:crypto"];

const plugins = [
  tsConfigPaths(),
  typescript({
    declaration: false,
    declarationMap: false,
  }),
  filesize({
    showMinifiedSize: false,
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
      file: "dist/index.cjs",
      format: "cjs",
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
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/browser/index.js",
      format: "es",
      sourcemap: true,
    },
    plugins: [
      resolveExtensions({ extensions: [".browser"] }),
      terser(),
      ...plugins,
    ],
    external,
  },
]);
