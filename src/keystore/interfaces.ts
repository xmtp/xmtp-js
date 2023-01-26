import { messageApi } from '@xmtp/proto'
import Ciphertext from '../crypto/Ciphertext'
import {
  SignedPublicKeyBundle,
  PublicKeyBundle,
} from '../crypto/PublicKeyBundle'
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
  // Full message bytes, including header
  payload: Uint8Array
  contentTopic: string
}

export type DecryptV1Response = ResultOrError<{
  // Right now, I am leaving out header extraction. Maybe we want that included too, IDK
  // Header does need to be parsed as part of decryption to verify, but maybe we want to parse that on both sides
  decrypted: Uint8Array
}>

export type DecryptV2Request = {
  payload: Uint8Array
  // Need to include contentTopic for the Keystore to know what topic key to use
  contentTopic: string
}

export type DecryptV2Response = ResultOrError<{
  // Either decrypted or error will be present
  decrypted: Uint8Array
}>

export type EncryptV1Request = {
  recipient: PublicKeyBundle
  message: Uint8Array
  headerBytes: Uint8Array
}

export type EncryptResponse = ResultOrError<{
  ciphertext: Ciphertext
}>

export type EncryptV2Request = {
  contentTopic: string
  message: Uint8Array
  headerBytes: Uint8Array
}

export type CreateInviteRequest = {
  recipient: SignedPublicKeyBundle
  createdAt: Date
  context: InvitationContext
}

export type SealedInvitation = {
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
  createInvite(req: CreateInviteRequest): Promise<SealedInvitation>
  // Get V2 conversations
  getV2Conversations(): Promise<ConversationReference[]>
  // Used for publishing the contact
  getPublicKeyBundle(): Promise<SignedPublicKeyBundle>
  // Technically duplicative of `getPublicKeyBundle`, but nice for ergonomics
  getWalletAddress(): Promise<string>
}
