import KeyBundle from '../crypto/KeyBundle';
import * as proto from '../proto/messaging';

export class Header implements proto.Message_Header {
  sender: KeyBundle | undefined;
  recipient: KeyBundle | undefined;

  constructor(obj: proto.Message_Header) {
    if (obj.sender) {
      this.sender = new KeyBundle(obj.sender);
    }
    if (obj.recipient) {
      this.recipient = new KeyBundle(obj.recipient);
    }
  }

  toBytes(): Uint8Array {
    return proto.Message_Header.encode(this).finish();
  }

  static fromBytes(bytes: Uint8Array): Header {
    return new Header(proto.Message_Header.decode(bytes));
  }
}
