import {
  createClientWithBackend,
  DeviceSyncMode,
  generateInboxId,
  getInboxIdForIdentifier,
  type Backend,
  type Identifier,
} from "@xmtp/wasm-bindings";
import type { ClientOptions, NetworkOptions } from "@/types/options";
import { createBackend, envToString } from "@/utils/createBackend";

const networkOptionKeys = [
  "env",
  "apiUrl",
  "gatewayHost",
  "appVersion",
] as const;

const hasBackend = (options: object): options is { backend: Backend } => {
  return "backend" in options;
};

const resolveBackend = async (
  options?: Omit<ClientOptions, "codecs">,
): Promise<Backend> => {
  if (!options) {
    return createBackend();
  }

  if (hasBackend(options)) {
    // Validate that no NetworkOptions fields are also set
    const conflicting = networkOptionKeys.filter(
      (key) =>
        key in options && (options as Record<string, unknown>)[key] != null,
    );
    if (conflicting.length > 0) {
      throw new Error(
        `Cannot specify both 'backend' and network options (${conflicting.join(", ")}). ` +
          `Use either a pre-built Backend or network options, not both.`,
      );
    }
    return options.backend;
  }

  // No backend provided — build one from NetworkOptions
  return createBackend(options as NetworkOptions);
};

export const createClient = async (
  identifier: Identifier,
  options?: Omit<ClientOptions, "codecs">,
) => {
  const backend = await resolveBackend(options);

  const inboxId =
    (await getInboxIdForIdentifier(backend, identifier)) ||
    generateInboxId(identifier);

  const envString = envToString(backend.env);

  const dbPath =
    options?.dbPath === undefined
      ? `xmtp-${envString}-${inboxId}.db3`
      : options.dbPath;

  const isLogging =
    options &&
    (options.loggingLevel !== undefined ||
      options.structuredLogging ||
      options.performanceLogging);

  const deviceSyncMode = options?.disableDeviceSync
    ? DeviceSyncMode.Disabled
    : DeviceSyncMode.Enabled;

  const client = await createClientWithBackend(
    backend,
    inboxId,
    identifier,
    dbPath,
    options?.dbEncryptionKey,
    deviceSyncMode,
    isLogging
      ? {
          structured: options.structuredLogging ?? false,
          performance: options.performanceLogging ?? false,
          level: options.loggingLevel,
        }
      : undefined,
    undefined, // allowOffline
    undefined, // nonce
  );

  return { client, env: envString };
};
