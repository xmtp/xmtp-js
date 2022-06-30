import * as proto from '../src/proto/messaging'
import { PublicKeyBundle } from './crypto'
import PublicKey from './crypto/PublicKey'

// ContactBundle packages all the infromation which a client uses to advertise on the network.
export default class ContactBundle implements proto.ContactBundleV1 {
  keyBundle: PublicKeyBundle

  constructor(publicKeyBundle: PublicKeyBundle) {
    if (!publicKeyBundle) {
      throw new Error('missing keyBundle')
    }
    this.keyBundle = publicKeyBundle
  }

  toBytes(): Uint8Array {
    return proto.ContactBundle.encode({
      v1: {
        keyBundle: this.keyBundle,
      },
    }).finish()
  }

  static fromBytes(bytes: Uint8Array): ContactBundle {
    const bundle = this.decodeV1(bytes)

    if (!bundle) {
      throw new Error('could not parse bundle')
    }

    if (!bundle.identityKey) {
      throw new Error('missing keyBundle')
    }
    if (!bundle.preKey) {
      throw new Error('missing pre-key')
    }
    return new ContactBundle(
      new PublicKeyBundle(
        new PublicKey(bundle.identityKey),
        new PublicKey(bundle.preKey)
      )
    )
  }

  static decodeV1(bytes: Uint8Array): proto.PublicKeyBundle | undefined {
    try {
      const b = proto.ContactBundle.decode(bytes)
      return b.v1?.keyBundle
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('invalid wire type')) {
        // Adds a default fallback for older versions of the proto
        const legacyBundle = proto.ContactBundleV1.decode(bytes)
        return legacyBundle.keyBundle
      }
      throw new Error("Couldn't decode contact bundle:" + e)
    }
  }
}
