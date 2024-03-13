import type { ciphertext } from '@xmtp/proto'
import { decrypt, encrypt } from '@/crypto/encryption'
import type { PrivateKeyBundleV1 } from '@/crypto/PrivateKeyBundle'
import type { PublicKeyBundle } from '@/crypto/PublicKeyBundle'

export const decryptV1 = async (
  myKeys: PrivateKeyBundleV1,
  peerKeys: PublicKeyBundle,
  ciphertext: ciphertext.Ciphertext,
  headerBytes: Uint8Array,
  isSender: boolean
): Promise<Uint8Array> => {
  const secret = await myKeys.sharedSecret(
    peerKeys,
    myKeys.getCurrentPreKey().publicKey, // assumes that the current preKey is what was used to encrypt
    !isSender
  )

  return decrypt(ciphertext, secret, headerBytes)
}

export const encryptV1 = async (
  keys: PrivateKeyBundleV1,
  recipient: PublicKeyBundle,
  message: Uint8Array,
  headerBytes: Uint8Array
): Promise<ciphertext.Ciphertext> => {
  const secret = await keys.sharedSecret(
    recipient,
    keys.getCurrentPreKey().publicKey,
    false // assumes that the sender is the party doing the encrypting
  )

  return encrypt(message, secret, headerBytes)
}

export const decryptV2 = (
  ciphertext: ciphertext.Ciphertext,
  secret: Uint8Array,
  headerBytes: Uint8Array
) => decrypt(ciphertext, secret, headerBytes)

export const encryptV2 = (
  payload: Uint8Array,
  secret: Uint8Array,
  headerBytes: Uint8Array
) => encrypt(payload, secret, headerBytes)
