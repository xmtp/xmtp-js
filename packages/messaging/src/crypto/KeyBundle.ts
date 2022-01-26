import * as proto from '../../src/proto/message';
import PublicKey from './PublicKey';

// KeyBundle packages all the keys that a participant should advertise.
// The PreKey must be signed by the IdentityKey.
// The IdentityKey can be signed by the wallet to authenticate it.
export default class KeyBundle implements proto.Message_KeyBundle {
  identityKey: PublicKey | undefined;
  preKey: PublicKey | undefined;

  constructor(
    identityKey: PublicKey | undefined,
    preKey: PublicKey | undefined
  ) {
    if (!identityKey) {
      throw new Error('missing identity key');
    }
    if (!preKey) {
      throw new Error('missing pre key');
    }
    this.identityKey = identityKey;
    this.preKey = preKey;
  }

  toBytes(): Uint8Array {
    return proto.Message_KeyBundle.encode(this).finish();
  }

  static fromBytes(bytes: Uint8Array): KeyBundle {
    const decoded = proto.Message_KeyBundle.decode(bytes);
    if (!decoded.identityKey) {
      throw new Error('missing identity key');
    }
    if (!decoded.preKey) {
      throw new Error('missing pre key');
    }
    return new KeyBundle(
      new PublicKey(decoded.identityKey),
      new PublicKey(decoded.preKey)
    );
  }
}
