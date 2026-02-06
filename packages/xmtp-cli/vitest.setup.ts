import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const TEST_DIR = resolve(__dirname, ".test-data");

export const setup = async () => {
  await mkdir(TEST_DIR, { recursive: true });
};

export const teardown = async () => {
  await rm(TEST_DIR, { recursive: true, force: true });
};
