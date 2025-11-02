#!/usr/bin/env node

// This is a simple wrapper that runs the compiled CLI
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cliPath = join(__dirname, "..", "dist", "index.js");

// Execute the compiled CLI
import(cliPath);
