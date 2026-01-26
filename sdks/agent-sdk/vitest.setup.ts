import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { glob } from "fast-glob";

export const teardown = async () => {
  const files = await glob("**/*.db3*", { cwd: import.meta.dirname });
  await Promise.all(
    files.map((file) => unlink(join(import.meta.dirname, file))),
  );
};
