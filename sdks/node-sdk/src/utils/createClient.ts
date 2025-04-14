import { join } from "node:path";
import process from "node:process";
import {
  createClient as createNodeClient,
  LogLevel,
  type Identifier,
  type LogOptions,
} from "@xmtp/node-bindings";
import { ApiUrls, HistorySyncUrls } from "@/constants";
import type { ClientOptions } from "@/types";
import { generateInboxId, getInboxIdForIdentifier } from "@/utils/inboxId";

export const createClient = async (
  identifier: Identifier,
  options?: ClientOptions,
) => {
  const env = options?.env || "dev";
  const host = options?.apiUrl || ApiUrls[env];
  const isSecure = host.startsWith("https");
  const inboxId =
    (await getInboxIdForIdentifier(identifier, env)) ||
    generateInboxId(identifier);
  const dbPath =
    options?.dbPath === undefined
      ? join(process.cwd(), `xmtp-${env}-${inboxId}.db3`)
      : options.dbPath;

  const logOptions: LogOptions = {
    structured: options?.structuredLogging ?? false,
    level: options?.loggingLevel ?? LogLevel.off,
  };
  const historySyncUrl = options?.historySyncUrl || HistorySyncUrls[env];

  return createNodeClient(
    host,
    isSecure,
    dbPath,
    inboxId,
    identifier,
    options?.dbEncryptionKey,
    historySyncUrl,
    logOptions,
  );
};
