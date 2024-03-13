import { contact, publicKey } from '@xmtp/proto'
import {
  PublicKeyBundle,
  SignedPublicKeyBundle,
} from '@/crypto/PublicKeyBundle'

// Decodes contact bundles from the contact topic.
export function decodeContactBundle(
  bytes: Uint8Array
): PublicKeyBundle | SignedPublicKeyBundle {
  let cb: contact.ContactBundle
  try {
    cb = contact.ContactBundle.decode(bytes)
  } catch (e) {
    const pb = publicKey.PublicKeyBundle.decode(bytes)
    cb = { v1: { keyBundle: new PublicKeyBundle(pb) }, v2: undefined }
  }
  if (cb.v1?.keyBundle) {
    return new PublicKeyBundle(cb.v1.keyBundle)
  }
  if (cb.v2?.keyBundle) {
    return new SignedPublicKeyBundle(cb.v2.keyBundle)
  }
  throw new Error('unknown or invalid contact bundle')
}

// Encodes public key bundle for the contact topic.
export function encodeContactBundle(
  bundle: PublicKeyBundle | SignedPublicKeyBundle
): Uint8Array {
  if (bundle instanceof PublicKeyBundle) {
    return contact.ContactBundle.encode({
      v1: { keyBundle: bundle },
      v2: undefined,
    }).finish()
  } else {
    return contact.ContactBundle.encode({
      v1: undefined,
      v2: { keyBundle: bundle },
    }).finish()
  }
}
