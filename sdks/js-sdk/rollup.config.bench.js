import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import tsConfigPaths from "rollup-plugin-tsconfig-paths";

const external = [
  "@noble/secp256k1",
  "@xmtp/proto",
  "@xmtp/user-preferences-bindings-wasm",
  "assert",
  "async-mutex",
  "benny",
  "crypto",
  "elliptic",
  "ethers",
  "long",
  "viem",
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
    input: "bench/index.ts",
    output: {
      file: "dist/bench/index.cjs",
      format: "cjs",
    },
    plugins,
    external,
  },
]);
