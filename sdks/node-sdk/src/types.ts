import type { ContentCodec } from "@xmtp/content-type-primitives";
import {
  type Actions,
  type Attachment,
  type Backend,
  type ContentTypeId,
  type DeletedMessage,
  type GroupUpdated,
  type Intent,
  type LeaveRequest,
  type LogLevel,
  type MultiRemoteAttachment,
  type Reaction,
  type ReadReceipt,
  type RemoteAttachment,
  type TransactionReference,
  type WalletSendCalls,
} from "@xmtp/node-bindings";
import type { DecodedMessage } from "@/DecodedMessage";
import type { HexString } from "./utils/validation";

/**
 * XMTP environment
 */
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
   * The host of the XMTP Gateway for your application
   *
   * Only valid for `dev` and `production` environments
   *
   * @see https://docs.xmtp.org/fund-agents-apps/run-gateway
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
   *
   * @see https://docs.xmtp.org/chat-apps/list-stream-sync/history-sync
   */
  historySyncUrl?: string | null;
  /**
   * Disable device sync
   */
  disableDeviceSync?: boolean;
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
   * The nonce to use when generating an inbox ID
   * (default: undefined = 1)
   */
  nonce?: bigint;
};

export type ClientOptions = (NetworkOptions | { backend: Backend }) &
  DeviceSyncOptions &
  StorageOptions &
  ContentOptions &
  OtherOptions;

export type EnrichedReply<T = unknown, U = unknown> = {
  referenceId: string;
  content: T;
  contentType: ContentTypeId | undefined;
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
