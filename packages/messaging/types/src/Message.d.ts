import * as proto from './proto/message';
import Ciphertext from './crypto/Ciphertext';
import { PublicKeyBundle, PrivateKeyBundle } from './crypto';
export default class Message implements proto.Message {
    header: proto.Message_Header | undefined;
    ciphertext: Ciphertext | undefined;
    decrypted: string | undefined;
    constructor(obj: proto.Message);
    toBytes(): Uint8Array;
    static fromBytes(bytes: Uint8Array): Message;
    static encode(sender: PrivateKeyBundle, recipient: PublicKeyBundle, message: string): Promise<Message>;
    static decode(recipient: PrivateKeyBundle, bytes: Uint8Array): Promise<Message>;
    static encrypt(plain: Uint8Array, sender: PrivateKeyBundle, recipient: PublicKeyBundle): Promise<Ciphertext>;
    static decrypt(encrypted: Ciphertext, sender: PublicKeyBundle, recipient: PrivateKeyBundle): Promise<Uint8Array>;
}
//# sourceMappingURL=Message.d.ts.map