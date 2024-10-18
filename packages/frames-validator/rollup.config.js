import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import { dts } from "rollup-plugin-dts";

const external = [
  "@noble/curves/abstract/utils",
  "@noble/curves/secp256k1",
  "@noble/hashes/sha256",
  "@xmtp/proto",
  "viem/utils",
];

const plugins = [
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
    plugins: [dts()],
  },
]);
