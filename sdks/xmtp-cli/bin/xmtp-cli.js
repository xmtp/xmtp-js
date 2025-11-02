#!/usr/bin/env node

// This is a simple wrapper that runs the TypeScript CLI using tsx
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cliPath = join(__dirname, "..", "index.ts");

// Try to find tsx in node_modules
const tsxPath = join(
  __dirname,
  "..",
  "..",
  "..",
  "node_modules",
  ".bin",
  "tsx",
);

const child = spawn(tsxPath, [cliPath, ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code) => {
  process.exit(code || 0);
});

child.on("error", (error) => {
  console.error(`Failed to start CLI: ${error.message}`);
  process.exit(1);
});
