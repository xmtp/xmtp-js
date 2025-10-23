import type { ContentCodec } from "@xmtp/content-type-primitives";
import type { LogLevel } from "@xmtp/node-bindings";
import type { ApiUrls } from "@/constants";
import type { HexString } from "./utils/validation";

/**
 * XMTP environment
 */
export type XmtpEnv = keyof typeof ApiUrls;

/**
 * Network options
 */
export type NetworkOptions = {
  /**
   * Specify which XMTP environment to connect to. (default: `dev`)
   *
   * @see https://docs.xmtp.org/chat-apps/core-messaging/create-a-client#xmtp-network-environments
   */
  env?: XmtpEnv;
  /**
   * apiUrl can be used to override the `env` flag and connect to a
   * specific endpoint
   */
  apiUrl?: string;
  /**
   * historySyncUrl can be used to override the `env` flag and connect to a
   * specific endpoint for syncing history
   *
   * @see https://docs.xmtp.org/chat-apps/list-stream-sync/history-sync
   */
  historySyncUrl?: string | null;
};

/**
 * Storage options
 */
export type StorageOptions = {
  /**
   * Path to the local DB
   *
   * There are 4 value types that can be used to specify the database path:
   *
   * - `undefined` (or excluded from the client options)
   *    The database will be created in the current working directory and is based on
   *    the XMTP environment and client inbox ID.
   *    Example: `xmtp-dev-<inbox-id>.db3`
   *
   * - `null`
   *    No database will be created and all data will be lost once the client disconnects.
   *
   * - `string`
   *    The given path will be used to create the database.
   *    Example: `./my-db.db3`
   *
   * - `function`
   *    A callback function that receives the inbox ID and returns a string path.
   *    Example: `(inboxId) => string`
   */
  dbPath?: string | null | ((inboxId: string) => string);
  /**
   * Encryption key for the local DB (32 bytes, hex)
   *
   * @see https://docs.xmtp.org/chat-apps/core-messaging/create-a-client#view-an-encrypted-database
   */
  dbEncryptionKey?: Uint8Array | HexString;
};

export type ContentOptions = {
  /**
   * Allow configuring codecs for additional content types
   */
  codecs?: ContentCodec[];
};

export type OtherOptions = {
  /**
   * Enable structured JSON logging
   */
  structuredLogging?: boolean;
  /**
   * Logging level
   */
  loggingLevel?: LogLevel;
  /**
   * Disable automatic registration when creating a client
   */
  disableAutoRegister?: boolean;
  /**
   * Disable device sync
   */
  disableDeviceSync?: boolean;
  /**
   * Custom app version
   */
  appVersion?: string;
  /**
   * Should debug events be tracked
   * (default: false)
   */
  debugEventsEnabled?: boolean;
};

export type ClientOptions = NetworkOptions &
  StorageOptions &
  ContentOptions &
  OtherOptions;
