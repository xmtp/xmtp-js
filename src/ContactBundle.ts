import { contact, publicKey } from '@xmtp/proto'
import { PublicKeyBundle, SignedPublicKeyBundle } from './crypto'

// This is the primary function for reading contact bundles off the wire.
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
