import { unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "fast-glob";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const teardown = async () => {
  const files = await glob("**/*.db3*", { cwd: __dirname });
  await Promise.all(files.map((file) => unlink(join(__dirname, file))));
};
