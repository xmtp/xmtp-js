import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import terser from "@rollup/plugin-terser";
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
      file: "lib/index.js",
      format: "es",
      sourcemap: true,
    },
    external,
    plugins,
  },
  {
    input: "src/index.ts",
    output: {
      file: "lib/index.cjs",
      format: "cjs",
      sourcemap: true,
    },
    external,
    plugins,
  },
  {
    input: "src/index.ts",
    output: {
      file: "lib/browser/index.js",
      format: "es",
      sourcemap: true,
    },
    external,
    plugins: [terser(), ...plugins],
  },
  {
    input: "src/index.ts",
    output: {
      file: "lib/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
]);
