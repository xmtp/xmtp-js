import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import tsConfigPaths from "rollup-plugin-tsconfig-paths";

const external = [
  "cors",
  "express",
  "helmet",
  "express-rate-limit",
  "pinata",
  "web3bio-profile-kit/types",
  "web3bio-profile-kit/utils",
  "zod",
  "date-fns",
  "@prisma/client",
  "node:querystring",
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
      sourcemap: false,
      importAttributesKey: "with",
    },
    plugins,
    external,
  },
]);
