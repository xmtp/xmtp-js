import { contact, publicKey } from '@xmtp/proto'
import { PublicKeyBundle, SignedPublicKeyBundle } from './crypto'

// ContactBundle packages all the information which a client uses to advertise on the network.
export class ContactBundleV1 implements contact.ContactBundleV1 {
  keyBundle: PublicKeyBundle

  constructor(bundle: contact.ContactBundleV1) {
    if (!bundle.keyBundle) {
      throw new Error('missing keyBundle')
    }
    this.keyBundle = new PublicKeyBundle(bundle.keyBundle)
  }

  toBytes(): Uint8Array {
    return contact.ContactBundle.encode({
      v1: {
        keyBundle: this.keyBundle,
      },
      v2: undefined,
    }).finish()
  }
}

export class ContactBundleV2 implements contact.ContactBundleV2 {
  keyBundle: SignedPublicKeyBundle

  constructor(bundle: contact.ContactBundleV2) {
    if (!bundle.keyBundle) {
      throw new Error('missing keyBundle')
    }
    this.keyBundle = new SignedPublicKeyBundle(bundle.keyBundle)
  }

  toBytes(): Uint8Array {
    return contact.ContactBundle.encode({
      v1: undefined,
      v2: {
        keyBundle: this.keyBundle,
      },
    }).finish()
  }
}

type ContactBundle = ContactBundleV1 | ContactBundleV2
export default ContactBundle

export function DecodeContactBundle(bytes: Uint8Array): ContactBundle {
  let cb: contact.ContactBundle
  try {
    cb = contact.ContactBundle.decode(bytes)
  } catch (e) {
    const pb = publicKey.PublicKeyBundle.decode(bytes)
    cb = { v1: { keyBundle: new PublicKeyBundle(pb) }, v2: undefined }
  }
  if (cb.v1) {
    return new ContactBundleV1(cb.v1)
  }
  if (cb.v2) {
    return new ContactBundleV2(cb.v2)
  }
  throw new Error('unknown contact bundle version')
}
