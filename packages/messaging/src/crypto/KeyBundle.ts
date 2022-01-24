import * as proto from '../../src/proto/message';
import PublicKey from './PublicKey';

// KeyBundle packages all the keys that a participant should advertise.
// The PreKey must be signed by the IdentityKey.
// The IdentityKey can be signed by the wallet to authenticate it.
export default class KeyBundle implements proto.Message_KeyBundle {
  identityKey: PublicKey | undefined;
  preKey: PublicKey | undefined;

  constructor(obj: proto.Message_KeyBundle) {
    if (!obj.identityKey) {
      throw new Error('missing identity key');
    }
    if (!obj.preKey) {
      throw new Error('missing pre key');
    }
    this.identityKey = new PublicKey(obj.identityKey);
    this.preKey = new PublicKey(obj.preKey);
  }

  toBytes(): Uint8Array {
    return proto.Message_KeyBundle.encode(this).finish();
  }

  static fromBytes(bytes: Uint8Array): KeyBundle {
    return new KeyBundle(proto.Message_KeyBundle.decode(bytes));
  }
}
