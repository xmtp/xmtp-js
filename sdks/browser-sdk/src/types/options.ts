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
};

/**
 * Encryption options
 */
export type EncryptionOptions = {
  /**
   * Encryption key to use for the local DB
   */
  encryptionKey?: Uint8Array;
};

/**
 * Storage options
 */
export type StorageOptions = {
  /**
   * Path to the local DB
   */
  dbPath?: string;
};

export type ContentOptions = {
  /**
   * Allow configuring codecs for additional content types
   */
  codecs?: ContentCodec[];
};

export type OtherOptions = {
  /**
   * Enable logging of events between the client and worker
   */
  enableLogging?: boolean;
};

export type ClientOptions = NetworkOptions &
  EncryptionOptions &
  StorageOptions &
  ContentOptions &
  OtherOptions;
