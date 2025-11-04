import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import { dts } from "rollup-plugin-dts";
import tsConfigPaths from "rollup-plugin-tsconfig-paths";

const external = [
  "@xmtp/agent-sdk",
  "@xmtp/content-type-markdown",
  "@xmtp/content-type-reaction",
  "@xmtp/content-type-read-receipt",
  "@xmtp/content-type-remote-attachment",
  "@xmtp/content-type-reply",
  "@xmtp/content-type-text",
  "@xmtp/content-type-transaction-reference",
  "@xmtp/content-type-wallet-send-calls",
  "commander",
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
    input: "index.ts",
    output: {
      file: "dist/index.js",
      format: "es",
      sourcemap: true,
      importAttributesKey: "with",
      banner: "#!/usr/bin/env node",
    },
    plugins,
    external,
  },
  {
    input: "index.ts",
    output: {
      file: "dist/index.d.ts",
    },
    plugins: [tsConfigPaths(), dts()],
  },
  {
    input: "lib.ts",
    output: {
      file: "dist/lib.js",
      format: "es",
      sourcemap: true,
    },
    plugins,
    external,
  },
  {
    input: "lib.ts",
    output: {
      file: "dist/lib.d.ts",
    },
    plugins: [tsConfigPaths(), dts()],
  },
]);
