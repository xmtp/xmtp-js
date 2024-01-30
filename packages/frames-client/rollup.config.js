import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import tsConfigPaths from "rollup-plugin-tsconfig-paths";
import terser from "@rollup/plugin-terser";
import filesize from "rollup-plugin-filesize";

export default defineConfig([
  {
    input: "src/index.ts",
    output: {
      file: "lib/index.js",
      format: "es",
      sourcemap: true,
    },
    plugins: [
      tsConfigPaths(),
      typescript({
        declaration: false,
        declarationMap: false,
      }),
      terser(),
      filesize({
        showMinifiedSize: false,
      }),
    ],
    external: [],
  },
  {
    input: "src/index.ts",
    output: {
      file: "lib/index.d.ts",
      format: "es",
    },
    plugins: [tsConfigPaths(), dts()],
  },
]);
