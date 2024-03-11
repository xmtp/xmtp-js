/***********************************************************************************************
 * DO NOT IMPORT THIS FILE DIRECTLY
 ***********************************************************************************************/

import {
  // eslint-disable-next-line camelcase
  generate_private_preferences_topic,
  // eslint-disable-next-line camelcase
  user_preferences_decrypt,
  // eslint-disable-next-line camelcase
  user_preferences_encrypt,
} from '@xmtp/user-preferences-bindings-wasm/bundler'
import type { PrivateKey } from './PrivateKey'

export async function userPreferencesEncrypt(
  identityKey: PrivateKey,
  payload: Uint8Array
) {
  const publicKey = identityKey.publicKey.secp256k1Uncompressed.bytes
  const privateKey = identityKey.secp256k1.bytes
  // eslint-disable-next-line camelcase
  return user_preferences_encrypt(publicKey, privateKey, payload)
}

export async function userPreferencesDecrypt(
  identityKey: PrivateKey,
  payload: Uint8Array
) {
  const publicKey = identityKey.publicKey.secp256k1Uncompressed.bytes
  const privateKey = identityKey.secp256k1.bytes
  // eslint-disable-next-line camelcase
  return user_preferences_decrypt(publicKey, privateKey, payload)
}

export async function generateUserPreferencesTopic(identityKey: PrivateKey) {
  const privateKey = identityKey.secp256k1.bytes
  // eslint-disable-next-line camelcase
  return generate_private_preferences_topic(privateKey)
}
