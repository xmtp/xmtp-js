import type {
  ContentCodec,
  ContentTypeId,
} from "@xmtp/content-type-primitives";
import type {
  Actions,
  Attachment,
  Backend,
  DeletedMessage,
  GroupUpdated,
  Intent,
  LeaveRequest,
  LogLevel,
  MultiRemoteAttachment,
  Reaction,
  ReadReceipt,
  RemoteAttachment,
  TransactionReference,
  WalletSendCalls,
} from "@xmtp/wasm-bindings";
import type { DecodedMessage } from "@/DecodedMessage";

export type XmtpEnv =
  | "local"
  | "dev"
  | "production"
  | "testnet-staging"
  | "testnet-dev"
  | "testnet"
  | "mainnet";

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
   * gatewayHost can be used to override the gateway endpoint
   */
  gatewayHost?: string;
  /**
   * Custom app version
   */
  appVersion?: string;
};

/**
 * Device sync options
 */
export type DeviceSyncOptions = {
  /**
   * historySyncUrl can be used to override the `env` flag and connect to a
   * specific endpoint for syncing history
   */
  historySyncUrl?: string | null;
  /**
   * Disable device sync
   */
  disableDeviceSync?: boolean;
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
  loggingLevel?: LogLevel;
  /**
   * Disable automatic registration when creating a client
   */
  disableAutoRegister?: boolean;
};

export type ClientOptions = (NetworkOptions | { backend: Backend }) &
  DeviceSyncOptions &
  ContentOptions &
  StorageOptions &
  OtherOptions;

export type EnrichedReply<T = unknown, U = unknown> = {
  referenceId: string;
  content: T;
  contentType: () => Promise<ContentTypeId | undefined>;
  inReplyTo: DecodedMessage<U> | null;
};

export type BuiltInContentTypes =
  | string // text, markdown
  | LeaveRequest
  | Reaction
  | ReadReceipt
  | Attachment
  | RemoteAttachment
  | TransactionReference
  | WalletSendCalls
  | Actions
  | Intent
  | MultiRemoteAttachment
  | GroupUpdated
  | DeletedMessage;

export type ExtractCodecContentTypes<C extends ContentCodec[] = []> =
  C extends readonly []
    ? BuiltInContentTypes
    : [...C][number] extends ContentCodec<infer T>
      ?
          | T
          | BuiltInContentTypes
          | EnrichedReply<T | BuiltInContentTypes, T | BuiltInContentTypes>
      : BuiltInContentTypes;
