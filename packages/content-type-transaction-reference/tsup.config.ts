import { defineConfig } from "tsup";
import externalGlobal from "esbuild-plugin-external-global";
import type { Plugin } from "esbuild";

export default defineConfig((options) => {
  const esbuildPlugins: Plugin[] = [];

  // for the browser bundle, replace `crypto` import with an object that
  // returns the browser's built-in crypto library
  if (options.platform === "browser") {
    esbuildPlugins.push(
      externalGlobal.externalGlobalPlugin({
        crypto: "{ webcrypto: window.crypto }",
      }),
    );
  }

  return {
    entry: options.entry ?? ["src/index.ts"],
    outDir:
      options.outDir ?? (options.platform === "browser" ? "dist/web" : "dist"),
    splitting: false,
    sourcemap: true,
    treeshake: true,
    clean: true,
    bundle: true,
    platform: options.platform ?? "node",
    minify: options.platform === "browser",
    dts: options.platform !== "browser",
    format:
      options.format ??
      (options.platform === "browser" ? ["esm"] : ["esm", "cjs"]),
    esbuildPlugins,
  };
});
