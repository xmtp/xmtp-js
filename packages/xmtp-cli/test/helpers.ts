import { randomBytes } from "node:crypto";
import { join, resolve } from "node:path";
import { execa } from "execa";
import { generatePrivateKey } from "viem/accounts";

const CLI_PATH = resolve(import.meta.dirname, "../bin/run.js");
const TEST_DIR = resolve(import.meta.dirname, "../.test-data");

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function runCommand(
  args: string[],
  options: { env?: Record<string, string>; timeout?: number } = {},
): Promise<RunResult> {
  const result = await execa("node", [CLI_PATH, ...args], {
    env: { ...process.env, ...options.env },
    reject: false,
    timeout: options.timeout ?? 30000,
  });
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode ?? 0,
  };
}

export function parseJsonOutput<T>(output: string): T {
  return JSON.parse(output) as T;
}

/**
 * Returns a unique path for a test env file in the test directory.
 * Files here are cleaned up automatically by global teardown.
 */
export function getTestEnvPath(): string {
  return join(TEST_DIR, `.env-${randomBytes(8).toString("hex")}`);
}

/**
 * Creates a test identity with unique wallet and encryption keys.
 * The identity uses the 'local' environment for testing.
 */
export function createTestIdentity(): {
  walletKey: string;
  dbEncryptionKey: string;
  dbPath: string;
} {
  const walletKey = generatePrivateKey();
  const dbEncryptionKey = randomBytes(32).toString("hex");
  const dbPath = join(TEST_DIR, `test-${randomBytes(8).toString("hex")}.db3`);

  return { walletKey, dbEncryptionKey, dbPath };
}

/**
 * Gets the base flags for running commands with a test identity.
 */
export function getBaseFlags(identity: {
  walletKey: string;
  dbEncryptionKey: string;
  dbPath: string;
}): string[] {
  return [
    "--wallet-key",
    identity.walletKey,
    "--db-encryption-key",
    identity.dbEncryptionKey,
    "--db-path",
    identity.dbPath,
    "--env",
    "local",
  ];
}

/**
 * Runs a command with the test identity's base flags.
 */
export async function runWithIdentity(
  identity: {
    walletKey: string;
    dbEncryptionKey: string;
    dbPath: string;
  },
  args: string[],
  options?: { timeout?: number },
): Promise<RunResult> {
  return runCommand([...args, ...getBaseFlags(identity)], options);
}

/**
 * Creates a registered XMTP identity by running the client info command.
 * Returns the identity details including inbox ID.
 */
export async function createRegisteredIdentity(): Promise<{
  walletKey: string;
  dbEncryptionKey: string;
  dbPath: string;
  inboxId: string;
  address: string;
  installationId: string;
}> {
  const identity = createTestIdentity();

  // Run client info to register the client
  const result = await runWithIdentity(identity, ["client", "info", "--json"]);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to create registered identity: ${result.stderr}`);
  }

  const info = parseJsonOutput<{
    properties: {
      inboxId: string;
      address: string;
      installationId: string;
    };
  }>(result.stdout);

  return {
    ...identity,
    inboxId: info.properties.inboxId,
    address: info.properties.address,
    installationId: info.properties.installationId,
  };
}

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
