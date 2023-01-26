import { MessageV1 } from '../Message'
import { buildDirectMessageTopic } from '../utils'
import { ErrorCode, KeystoreError } from './errors'
import {
  PublicKeyBundle,
  encrypt,
  PrivateKeyBundleV1,
  Ciphertext,
} from '../crypto'

export async function decryptV1(
  keys: PrivateKeyBundleV1,
  payload: Uint8Array,
  contentTopic: string
): Promise<Uint8Array> {
  const decoded = await MessageV1.fromBytes(payload)
  const { senderAddress, recipientAddress } = decoded

  // Filter for topics
  if (
    !senderAddress ||
    !recipientAddress ||
    !contentTopic ||
    buildDirectMessageTopic(senderAddress, recipientAddress) !== contentTopic
  ) {
    throw new KeystoreError(
      ErrorCode.VALIDATION_FAILED,
      'Headers do not match intended recipient'
    )
  }
  return decoded.decrypt(keys)
}

export async function encryptV1(
  keys: PrivateKeyBundleV1,
  recipient: PublicKeyBundle,
  message: Uint8Array,
  headerBytes: Uint8Array
): Promise<Ciphertext> {
  const secret = await keys.sharedSecret(
    recipient,
    keys.getCurrentPreKey().publicKey,
    false // assumes that the sender is the party doing the encrypting
  )

  return encrypt(message, secret, headerBytes)
}
