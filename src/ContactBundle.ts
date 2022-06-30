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
    const decoded = proto.ContactBundle.decode(bytes)
    if (!decoded.v1?.keyBundle?.identityKey) {
      throw new Error('missing keyBundle')
    }
    if (!decoded.v1?.keyBundle?.preKey) {
      throw new Error('missing pre-key')
    }
    return new ContactBundle(
      new PublicKeyBundle(
        new PublicKey(decoded.v1?.keyBundle?.identityKey),
        new PublicKey(decoded.v1?.keyBundle?.preKey)
      )
    )
  }
}
