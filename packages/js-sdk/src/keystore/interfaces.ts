import type {
  authn,
  keystore,
  privateKey,
  publicKey,
  signature,
} from '@xmtp/proto'
import type { WithoutUndefined } from '@/utils/typedefs'

/**
 * A Keystore is responsible for holding the user's XMTP private keys and using them to encrypt/decrypt/sign messages.
 * Keystores are instantiated using a `KeystoreProvider`
 * @deprecated Use `KeystoreInterface` instead
 */
export interface Keystore {
  /**
   * Decrypt a batch of V1 messages
   */
  decryptV1(req: keystore.DecryptV1Request): Promise<keystore.DecryptResponse>
  /**
   * Decrypt a batch of V2 messages
   */
  decryptV2(req: keystore.DecryptV2Request): Promise<keystore.DecryptResponse>
  /**
   * Encrypt a batch of V1 messages
   */
  encryptV1(req: keystore.EncryptV1Request): Promise<keystore.EncryptResponse>
  /**
   * Encrypt a batch of V2 messages
   */
  encryptV2(req: keystore.EncryptV2Request): Promise<keystore.EncryptResponse>
  /**
   * Take a batch of invite messages and store the `TopicKeys` for later use in decrypting messages
   */
  saveInvites(
    req: keystore.SaveInvitesRequest
  ): Promise<keystore.SaveInvitesResponse>
  /**
   * Create a sealed/encrypted invite and store the Topic keys in the Keystore for later use.
   * The returned invite payload must be sent to the network for the other party to be able to communicate.
   */
  createInvite(
    req: keystore.CreateInviteRequest
  ): Promise<keystore.CreateInviteResponse>
  /**
   * Create an XMTP auth token to be used as a header on XMTP API requests
   */
  createAuthToken(req: keystore.CreateAuthTokenRequest): Promise<authn.Token>
  /**
   * Sign the provided digest with either the `IdentityKey` or a specified `PreKey`
   */
  signDigest(req: keystore.SignDigestRequest): Promise<signature.Signature>
  /**
   * Get a refresh job from the persistence
   */
  getRefreshJob(
    req: keystore.GetRefreshJobRequest
  ): Promise<keystore.GetRefreshJobResponse>
  /**
   * Sets the time of a refresh job
   */
  setRefreshJob(
    req: keystore.SetRefeshJobRequest
  ): Promise<keystore.SetRefreshJobResponse>
  /**
   * Save V1 Conversations
   */
  saveV1Conversations(
    req: keystore.SaveV1ConversationsRequest
  ): Promise<keystore.SaveV1ConversationsResponse>
  /**
   * Get a list of V1 conversations
   */
  getV1Conversations(): Promise<keystore.GetConversationsResponse>
  /**
   * Get a list of V2 conversations
   */
  getV2Conversations(): Promise<keystore.GetConversationsResponse>
  /**
   * Get the `PublicKeyBundle` associated with the Keystore's private keys
   */
  getPublicKeyBundle(): Promise<publicKey.PublicKeyBundle>
  /**
   * Export the private keys. May throw an error if the keystore implementation does not allow this operation
   */
  getPrivateKeyBundle(): Promise<privateKey.PrivateKeyBundleV1>
  /**
   * Get the account address of the wallet used to create the Keystore
   */
  getAccountAddress(): Promise<string>
  /**
   * Encrypt a batch of messages to yourself
   */
  selfEncrypt(
    req: keystore.SelfEncryptRequest
  ): Promise<keystore.SelfEncryptResponse>
  /**
   * Decrypt a batch of messages to yourself
   */
  selfDecrypt(
    req: keystore.SelfDecryptRequest
  ): Promise<keystore.DecryptResponse>
  /**
   * Get the private preferences topic identifier
   */
  getPrivatePreferencesTopicIdentifier(): Promise<keystore.GetPrivatePreferencesTopicIdentifierResponse>
  /**
   * Returns the conversation HMAC keys for the current, previous, and next
   * 30 day periods since the epoch
   */
  getV2ConversationHmacKeys(): Promise<keystore.GetConversationHmacKeysResponse>
}

export type TopicData = WithoutUndefined<keystore.TopicMap_TopicData>
