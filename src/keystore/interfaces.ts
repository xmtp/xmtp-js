import { keystore, publicKey } from '@xmtp/proto'
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
  // Get V2 conversations
  getV2Conversations(): Promise<keystore.ConversationReference[]>
  // Used for publishing the contact
  getPublicKeyBundle(): Promise<publicKey.SignedPublicKeyBundle>
  // Technically duplicative of `getPublicKeyBundle`, but nice for ergonomics
  getAccountAddress(): Promise<string>
}
