import * as proto from '../../src/proto/message';
import PublicKey from './PublicKey';

// KeyBundle packages all the keys that a participant should advertise.
// The PreKey must be signed by the IdentityKey.
// The IdentityKey can be signed by the wallet to authenticate it.
export default class KeyBundle {
  identityKey: PublicKey;
  preKey: PublicKey;
  constructor(identityKey: PublicKey, preKey: PublicKey) {
    this.identityKey = identityKey;
    this.preKey = preKey;
  }

  // protobuf serialization methods
  static decode(bytes: Uint8Array): KeyBundle {
    return KeyBundle.fromDecoded(proto.Message_Participant.decode(bytes));
  }

  static fromDecoded(mp: proto.Message_Participant): KeyBundle {
    if (!mp.identityKey) {
      throw new Error('missing identityKey');
    }
    const identityKey = PublicKey.fromDecoded(mp.identityKey);
    if (!mp.preKey) {
      throw new Error('missing preKey');
    }
    const preKey = PublicKey.fromDecoded(mp.preKey);
    return new KeyBundle(identityKey, preKey);
  }

  encode(): Uint8Array {
    return proto.Message_Participant.encode(this.toBeEncoded()).finish();
  }

  toBeEncoded(): proto.Message_Participant {
    return {
      identityKey: this.identityKey.toBeEncoded(),
      preKey: this.preKey.toBeEncoded()
    };
  }
}
