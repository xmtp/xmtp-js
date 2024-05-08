import { authn, keystore, privateKey, publicKey, signature } from '@xmtp/proto'
import type { Reader, Writer } from 'protobufjs/minimal'
import type { Flatten } from '@/utils/typedefs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type KeystoreRPCCodec<T = any> = {
  decode(input: Reader | Uint8Array, length?: number): T
  encode(message: T, writer?: Writer): Writer
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type KeystoreRPC<Request = any, Response = any> = {
  req: KeystoreRPCCodec<Request> | null
  res: KeystoreRPCCodec<Response>
}

type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

type Values<T> = {
  [K in keyof T]: T[K]
}[keyof T]

type ApiDefs = {
  [key: string]: KeystoreRPC
}

type ApiInterface = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (...args: any[]) => any
}

type OtherKeyStoreMethods = {
  /**
   * Get the account address of the wallet used to create the Keystore
   */
  getAccountAddress(): Promise<string>
}

type ExtractInterface<T extends ApiDefs> = Flatten<
  {
    [K in keyof T]: T[K] extends KeystoreRPC<infer Req, infer Res>
      ? T[K]['req'] extends null
        ? () => Promise<Res>
        : (req: Req) => Promise<Res>
      : never
  } & OtherKeyStoreMethods
>

type ExtractInterfaceRequestEncoders<T extends ApiDefs> = {
  [K in keyof T]: T[K]['req'] extends KeystoreRPCCodec
    ? T[K]['req']['encode']
    : never
}

type ExtractInterfaceResponseDecoders<T extends ApiDefs> = {
  [K in keyof T]: T[K]['res'] extends KeystoreRPCCodec
    ? T[K]['res']['decode']
    : never
}

type ExtractInterfaceRequestValues<T extends ApiInterface> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? Parameters<T[K]>[0]
    : never
}

export const apiDefs = {
  /**
   * Decrypt a batch of V1 messages
   */
  decryptV1: {
    req: keystore.DecryptV1Request,
    res: keystore.DecryptResponse,
  },
  /**
   * Decrypt a batch of V2 messages
   */
  decryptV2: {
    req: keystore.DecryptV2Request,
    res: keystore.DecryptResponse,
  },
  /**
   * Encrypt a batch of V1 messages
   */
  encryptV1: {
    req: keystore.EncryptV1Request,
    res: keystore.EncryptResponse,
  },
  /**
   * Encrypt a batch of V2 messages
   */
  encryptV2: {
    req: keystore.EncryptV2Request,
    res: keystore.EncryptResponse,
  },
  /**
   * Take a batch of invite messages and store the `TopicKeys` for later use in
   * decrypting messages
   */
  saveInvites: {
    req: keystore.SaveInvitesRequest,
    res: keystore.SaveInvitesResponse,
  },
  /**
   * Create a sealed/encrypted invite and store the Topic keys in the Keystore
   * for later use. The returned invite payload must be sent to the network for
   * the other party to be able to communicate.
   */
  createInvite: {
    req: keystore.CreateInviteRequest,
    res: keystore.CreateInviteResponse,
  },
  /**
   * Create an XMTP auth token to be used as a header on XMTP API requests
   */
  createAuthToken: {
    req: keystore.CreateAuthTokenRequest,
    res: authn.Token,
  },
  /**
   * Sign the provided digest with either the `IdentityKey` or a specified
   * `PreKey`
   */
  signDigest: {
    req: keystore.SignDigestRequest,
    res: signature.Signature,
  },
  /**
   * Get the `PublicKeyBundle` associated with the Keystore's private keys
   */
  getPublicKeyBundle: {
    req: null,
    res: publicKey.PublicKeyBundle,
  },
  /**
   * Export the private keys. May throw an error if the keystore implementation
   * does not allow this operation
   */
  getPrivateKeyBundle: {
    req: null,
    res: privateKey.PrivateKeyBundleV1,
  },
  /**
   * Save V1 Conversations
   */
  saveV1Conversations: {
    req: keystore.SaveV1ConversationsRequest,
    res: keystore.SaveV1ConversationsResponse,
  },
  /**
   * Get a list of V1 conversations
   */
  getV1Conversations: {
    req: null,
    res: keystore.GetConversationsResponse,
  },
  /**
   * Get a list of V2 conversations
   */
  getV2Conversations: {
    req: null,
    res: keystore.GetConversationsResponse,
  },
  /**
   * Get a refresh job from the persistence
   */
  getRefreshJob: {
    req: keystore.GetRefreshJobRequest,
    res: keystore.GetRefreshJobResponse,
  },
  /**
   * Sets the time of a refresh job
   */
  setRefreshJob: {
    req: keystore.SetRefeshJobRequest,
    res: keystore.SetRefreshJobResponse,
  },
  /**
   * Encrypt a batch of messages to yourself
   */
  selfEncrypt: {
    req: keystore.SelfEncryptRequest,
    res: keystore.SelfEncryptResponse,
  },
  /**
   * Decrypt a batch of messages to yourself
   */
  selfDecrypt: {
    req: keystore.SelfDecryptRequest,
    res: keystore.DecryptResponse,
  },
  /**
   * Get the private preferences topic identifier
   */
  getPrivatePreferencesTopicIdentifier: {
    req: null,
    res: keystore.GetPrivatePreferencesTopicIdentifierResponse,
  },
  /**
   * Returns the conversation HMAC keys for the current, previous, and next
   * 30 day periods since the epoch
   */
  getV2ConversationHmacKeys: {
    req: keystore.GetConversationHmacKeysRequest,
    res: keystore.GetConversationHmacKeysResponse,
  },
}

export type KeystoreApiDefs = typeof apiDefs
export type KeystoreApiMethods = keyof KeystoreApiDefs
export type KeystoreInterface = ExtractInterface<KeystoreApiDefs>
export type KeystoreApiEntries = Entries<KeystoreApiDefs>
export type KeystoreApiRequestEncoders =
  ExtractInterfaceRequestEncoders<KeystoreApiDefs>
export type KeystoreApiResponseDecoders =
  ExtractInterfaceResponseDecoders<KeystoreApiDefs>
export type KeystoreInterfaceRequestValues =
  ExtractInterfaceRequestValues<KeystoreInterface>
export type KeystoreApiRequestValues = Values<KeystoreInterfaceRequestValues>

export const snapApiDefs = {
  ...apiDefs,
  getKeystoreStatus: {
    req: keystore.GetKeystoreStatusRequest,
    res: keystore.GetKeystoreStatusResponse,
  },
  initKeystore: {
    req: keystore.InitKeystoreRequest,
    res: keystore.InitKeystoreResponse,
  },
}

export type SnapKeystoreApiDefs = typeof snapApiDefs
export type SnapKeystoreApiMethods = keyof SnapKeystoreApiDefs
export type SnapKeystoreInterface = ExtractInterface<SnapKeystoreApiDefs>
export type SnapKeystoreApiEntries = Entries<SnapKeystoreApiDefs>
export type SnapKeystoreApiRequestEncoders =
  ExtractInterfaceRequestEncoders<SnapKeystoreApiDefs>
export type SnapKeystoreApiResponseDecoders =
  ExtractInterfaceResponseDecoders<SnapKeystoreApiDefs>
export type SnapKeystoreInterfaceRequestValues =
  ExtractInterfaceRequestValues<SnapKeystoreInterface>
export type SnapKeystoreApiRequestValues =
  Values<SnapKeystoreInterfaceRequestValues>

/**
 * A Keystore is responsible for holding the user's XMTP private keys and using them to encrypt/decrypt/sign messages.
 * Keystores are instantiated using a `KeystoreProvider`
 */
export type KeystoreInterfaces = KeystoreInterface | SnapKeystoreInterface
