import {
  PublicKeyBundle,
  encrypt,
  PrivateKeyBundleV1,
  Ciphertext,
  decrypt,
} from '../crypto'

export const decryptV1 = async (
  myKeys: PrivateKeyBundleV1,
  peerKeys: PublicKeyBundle,
  ciphertext: Ciphertext,
  headerBytes: Uint8Array,
  isSender: boolean
): Promise<Uint8Array> => {
  const secret = isSender
    ? await myKeys.sharedSecret(
        peerKeys,
        myKeys.getCurrentPreKey().publicKey, // assumes that the current preKey is what was used to encrypt
        false
      )
    : await myKeys.sharedSecret(
        myKeys.getPublicKeyBundle(),
        peerKeys.preKey,
        true
      )

  return decrypt(ciphertext, secret, headerBytes)
}

export const encryptV1 = async (
  keys: PrivateKeyBundleV1,
  recipient: PublicKeyBundle,
  message: Uint8Array,
  headerBytes: Uint8Array
): Promise<Ciphertext> => {
  const secret = await keys.sharedSecret(
    recipient,
    keys.getCurrentPreKey().publicKey,
    false // assumes that the sender is the party doing the encrypting
  )

  return encrypt(message, secret, headerBytes)
}

export const decryptV2 = (
  ciphertext: Ciphertext,
  secret: Uint8Array,
  headerBytes: Uint8Array
) => decrypt(ciphertext, secret, headerBytes)

export const encryptV2 = (
  payload: Uint8Array,
  secret: Uint8Array,
  headerBytes: Uint8Array
) => encrypt(payload, secret, headerBytes)
