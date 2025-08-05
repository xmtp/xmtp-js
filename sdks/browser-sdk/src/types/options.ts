import type { ContentCodec } from "@xmtp/content-type-primitives";
import type { ApiUrls } from "@/constants";

export type XmtpEnv = keyof typeof ApiUrls;

/**
 * Network options
 */
export type NetworkOptions = {
  /**
   * Specify which XMTP environment to connect to. (default: `dev`)
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
   */
  historySyncUrl?: string | null;
};

export type ContentOptions = {
  /**
   * Allow configuring codecs for additional content types
   */
  codecs?: ContentCodec[];
};

/**
 * Storage options
 */
export type StorageOptions = {
  /**
   * Path to the local DB
   *
   * There are 3 value types that can be used to specify the database path:
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
   */
  dbPath?: string | null;
  /**
   * Encryption key for the local DB
   */
  dbEncryptionKey?: Uint8Array;
};

export type OtherOptions = {
  /**
   * Enable structured JSON logging
   */
  structuredLogging?: boolean;
  /**
   * Enable performance metrics
   */
  performanceLogging?: boolean;
  /**
   * Logging level
   */
  loggingLevel?: "off" | "error" | "warn" | "info" | "debug" | "trace";
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
  ContentOptions &
  StorageOptions &
  OtherOptions;
