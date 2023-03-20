import { keystore, publicKey, authn, privateKey, signature } from '@xmtp/proto'
import { WithoutUndefined } from '../utils/typedefs'

export interface Keystore {
  // Decrypt a batch of V1 messages
  decryptV1(req: keystore.DecryptV1Request): Promise<keystore.DecryptResponse>
  // Decrypt a batch of V2 messages
  decryptV2(req: keystore.DecryptV2Request): Promise<keystore.DecryptResponse>
  // Encrypt a batch of V1 messages
  encryptV1(req: keystore.EncryptV1Request): Promise<keystore.EncryptResponse>
  // Encrypt a batch of V2 messages
  encryptV2(req: keystore.EncryptV2Request): Promise<keystore.EncryptResponse>
  // Decrypt and save a batch of invite for later use in decrypting messages on the invite topic
  saveInvites(
    req: keystore.SaveInvitesRequest
  ): Promise<keystore.SaveInvitesResponse>
  // Create the sealed invite and store the Topic keys in the Keystore for later use
  createInvite(
    req: keystore.CreateInviteRequest
  ): Promise<keystore.CreateInviteResponse>
  // Get an API auth token
  createAuthToken(req: keystore.CreateAuthTokenRequest): Promise<authn.Token>
  // Sign the provided digest
  signDigest(req: keystore.SignDigestRequest): Promise<signature.Signature>
  // Get V2 conversations
  getV2Conversations(): Promise<keystore.ConversationReference[]>
  // Used for publishing the contact
  getPublicKeyBundle(): Promise<publicKey.PublicKeyBundle>
  // Export the private keys. May throw an error if the keystore does not allow this operation
  getPrivateKeyBundle(): Promise<privateKey.PrivateKeyBundleV1>
  // Technically duplicative of `getPublicKeyBundle`, but nice for ergonomics
  getAccountAddress(): Promise<string>
}

export type TopicData = WithoutUndefined<keystore.TopicMap_TopicData>
