import { messageApi, ciphertext, publicKey } from '@xmtp/proto'
import { InvitationContext } from '../Invitation'
import { ErrorCode } from './errors'

type KeystoreError = {
  error: string
  code: ErrorCode
}

export type ResultOrError<T> = T | KeystoreError

export type ConversationReference = {
  topic: string
  createdAt: Date
  context?: InvitationContext
}

export type DecryptV1Request = {
  payload: ciphertext.Ciphertext
  peerKeys: publicKey.PublicKeyBundle
  headerBytes: Uint8Array
  isSender: boolean
}

export type DecryptV1Response = ResultOrError<{
  decrypted: Uint8Array
}>

export type DecryptV2Request = {
  payload: ciphertext.Ciphertext
  headerBytes: Uint8Array
  // Need to include contentTopic for the Keystore to know what topic key to use
  contentTopic: string
}

export type DecryptV2Response = ResultOrError<{
  decrypted: Uint8Array
}>

export type EncryptV1Request = {
  recipient: publicKey.PublicKeyBundle
  payload: Uint8Array
  headerBytes: Uint8Array
}

export type EncryptResponse = ResultOrError<{
  ciphertext: ciphertext.Ciphertext
}>

export type EncryptV2Request = {
  contentTopic: string
  message: Uint8Array
  headerBytes: Uint8Array
}

export type CreateInviteRequest = {
  recipient: publicKey.SignedPublicKeyBundle
  createdAt: Date
  context?: InvitationContext
}

export type CreateInviteResponse = {
  conversation: ConversationReference
  // The full bytes of the sealed invitation, which can then be published to the API
  payload: Uint8Array
}

export interface Keystore {
  // Decrypt a batch of V1 messages
  decryptV1(req: DecryptV1Request[]): Promise<DecryptV1Response[]>
  // Decrypt a batch of V2 messages
  decryptV2(req: DecryptV2Request[]): Promise<DecryptV2Response[]>
  // Encrypt a batch of V1 messages
  encryptV1(req: EncryptV1Request[]): Promise<EncryptResponse[]>
  // Encrypt a batch of V2 messages
  encryptV2(req: EncryptV2Request[]): Promise<EncryptResponse[]>
  // Decrypt and save a batch of invite for later use in decrypting messages on the invite topic
  saveInvites(
    req: messageApi.Envelope[]
  ): Promise<ResultOrError<ConversationReference>[]>
  // Create the sealed invite and store the Topic keys in the Keystore for later use
  createInvite(req: CreateInviteRequest): Promise<CreateInviteResponse>
  // Get V2 conversations
  getV2Conversations(): Promise<ConversationReference[]>
  // Used for publishing the contact
  getPublicKeyBundle(): Promise<publicKey.SignedPublicKeyBundle>
  // Technically duplicative of `getPublicKeyBundle`, but nice for ergonomics
  getWalletAddress(): Promise<string>
}
