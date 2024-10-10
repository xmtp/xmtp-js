import type { ContentCodec } from "@xmtp/content-type-primitives";
import type {
  WasmCreateGroupOptions,
  WasmListConversationsOptions,
  WasmListMessagesOptions,
} from "@xmtp/client-bindings-wasm";
import type { ApiUrls } from "@/constants";

/**
 * Utility types
 */
type Newable = { new (...args: readonly unknown[]): unknown };
type AnyFn = (...args: unknown[]) => unknown;
type ClassProperties<C extends Newable> = {
  [K in keyof InstanceType<C> as InstanceType<C>[K] extends AnyFn
    ? never
    : K]: InstanceType<C>[K];
};

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
  codecs?: ContentCodec<any>[];
};

export type ClientOptions = NetworkOptions &
  EncryptionOptions &
  StorageOptions &
  ContentOptions;

export type ListConversationsOptions = ClassProperties<
  typeof WasmListConversationsOptions
>;

export type CreateGroupOptions = ClassProperties<typeof WasmCreateGroupOptions>;

export type ListMessagesOptions = ClassProperties<
  typeof WasmListMessagesOptions
>;
