import {
  PublicKeyBundle,
  encrypt,
  PrivateKeyBundleV1,
  decrypt,
  PrivateKey,
} from '../crypto'
import { ciphertext } from '@xmtp/proto'
import {
  // eslint-disable-next-line camelcase
  ecies_decrypt_k256_sha3_256,
  // eslint-disable-next-line camelcase
  ecies_encrypt_k256_sha3_256,
} from '@xmtp/ecies-bindings-wasm'

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

export async function selfEncrypt(
  identityKey: PrivateKey,
  payload: Uint8Array
) {
  const publicKey = identityKey.publicKey.secp256k1Uncompressed.bytes
  const privateKey = identityKey.secp256k1.bytes
  return ecies_encrypt_k256_sha3_256(publicKey, privateKey, payload)
}

export async function selfDecrypt(
  identityKey: PrivateKey,
  payload: Uint8Array
) {
  const publicKey = identityKey.publicKey.secp256k1Uncompressed.bytes
  const privateKey = identityKey.secp256k1.bytes
  return ecies_decrypt_k256_sha3_256(publicKey, privateKey, payload)
}
