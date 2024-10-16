import {
  generate_private_preferences_topic,
  user_preferences_decrypt,
  user_preferences_encrypt,
} from "@xmtp/user-preferences-bindings-wasm";
import type { PrivateKey } from "@/crypto/PrivateKey";

// eslint-disable-next-line @typescript-eslint/require-await
export async function userPreferencesEncrypt(
  identityKey: PrivateKey,
  payload: Uint8Array,
) {
  const publicKey = identityKey.publicKey.secp256k1Uncompressed.bytes;
  const privateKey = identityKey.secp256k1.bytes;

  return user_preferences_encrypt(publicKey, privateKey, payload);
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function userPreferencesDecrypt(
  identityKey: PrivateKey,
  payload: Uint8Array,
) {
  const publicKey = identityKey.publicKey.secp256k1Uncompressed.bytes;
  const privateKey = identityKey.secp256k1.bytes;

  return user_preferences_decrypt(publicKey, privateKey, payload);
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function generateUserPreferencesTopic(identityKey: PrivateKey) {
  const privateKey = identityKey.secp256k1.bytes;

  return generate_private_preferences_topic(privateKey);
}
