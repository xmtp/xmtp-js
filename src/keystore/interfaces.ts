import { keystore, publicKey, authn, privateKey, signature } from '@xmtp/proto'
import { WithoutUndefined } from '../utils/typedefs'

/**
 * A Keystore is responsible for holding the user's XMTP private keys and using them to encrypt/decrypt/sign messages.
 * Keystores are instantiated using a `KeystoreProvider`
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
   * Create multiple sealed/encrypted invites and store the Topic keys in the Keystore for later use.
   * The returned invite payload must be sent to the network for the other party to be able to communicate.
   */
  createInvites(
    req: keystore.CreateInvitesRequest
  ): Promise<keystore.CreateInviteResponse[]>
  /**
   * Create a sealed/encrypted invite for the given topic and store the Topic keys in the Keystore for later use.
   * The returned invite payload must be sent to the network for the other party to be able to communicate.
   */
  createInviteFromTopic(
    req: keystore.CreateInviteFromTopicRequest
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
   * Get a list of V2 conversations
   */
  getV2Conversations(): Promise<keystore.GetV2ConversationsResponse>
  /**
   * Get a list of group conversations
   */
  getGroupConversations(): Promise<keystore.GetV2ConversationsResponse>
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
}

export type TopicData = WithoutUndefined<keystore.TopicMap_TopicData>
