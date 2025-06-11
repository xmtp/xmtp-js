import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";

const plugins = [
  typescript({
    declaration: false,
    declarationMap: false,
  }),
];

const external = [
  "dotenv/config",
  "@xmtp/content-type-mini-app",
  "@xmtp/content-type-text",
  "@xmtp/node-sdk",
  "uint8array-extras",
  "viem",
  "viem/accounts",
  "viem/chains",
  "uuid",
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
]);
