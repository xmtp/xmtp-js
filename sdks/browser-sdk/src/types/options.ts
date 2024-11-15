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
};

export type ClientOptions = NetworkOptions &
  StorageOptions &
  ContentOptions &
  OtherOptions;
