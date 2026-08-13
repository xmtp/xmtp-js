import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../../src/utils/config.js";

const originalEnv = process.env.XMTP_ENV;
const temporaryPaths: string[] = [];

afterEach(async () => {
  if (originalEnv === undefined) {
    delete process.env.XMTP_ENV;
  } else {
    process.env.XMTP_ENV = originalEnv;
  }

  await Promise.all(
    temporaryPaths
      .splice(0)
      .map((path) => rm(path, { recursive: true })),
  );
});

describe("loadConfig", () => {
  it("prefers an explicitly selected env file over the process environment", async () => {
    process.env.XMTP_ENV = "production";
    const directory = await mkdtemp(join(tmpdir(), "xmtp-cli-config-"));
    temporaryPaths.push(directory);
    const envFile = join(directory, ".env");
    await writeFile(envFile, "XMTP_ENV=dev\n");

    await expect(loadConfig(envFile)).resolves.toMatchObject({ env: "dev" });
  });
});
