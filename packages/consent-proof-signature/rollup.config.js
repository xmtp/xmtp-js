import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import { dts } from "rollup-plugin-dts";
import filesize from "rollup-plugin-filesize";

const plugins = [
  typescript({
    declaration: false,
    declarationMap: false,
  }),
  filesize({
    showMinifiedSize: false,
  }),
];

const external = ["@xmtp/proto", "node:crypto", "long"];

export default defineConfig([
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "es",
      sourcemap: true,
    },
    external,
    plugins,
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.cjs",
      format: "cjs",
      sourcemap: true,
    },
    external,
    plugins,
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/browser/index.js",
      format: "es",
      sourcemap: true,
    },
    external,
    plugins: [terser(), ...plugins],
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
]);
