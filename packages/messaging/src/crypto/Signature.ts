import * as proto from '../../src/proto/messaging';
import * as secp from '@noble/secp256k1';
import PublicKey from './PublicKey';

// Signature represents an ECDSA signature with recovery bit.
export default class Signature implements proto.Signature {
  ecdsaCompact: proto.Signature_ECDSACompact | undefined;

  constructor(obj: proto.Signature) {
    if (!obj.ecdsaCompact) {
      throw new Error('invalid signature');
    }
    if (obj.ecdsaCompact.bytes.length !== 64) {
      throw new Error(
        `invalid signature length: ${obj.ecdsaCompact.bytes.length}`
      );
    }
    this.ecdsaCompact = obj.ecdsaCompact;
    if (obj.ecdsaCompact.recovery !== 0 && obj.ecdsaCompact.recovery !== 1) {
      throw new Error(`invalid recovery bit: ${obj.ecdsaCompact.recovery}`);
    }
    this.ecdsaCompact.recovery = obj.ecdsaCompact.recovery;
  }

  // If the signature is valid for the provided digest
  // then return the public key that validates it.
  // Otherwise return undefined.
  getPublicKey(digest: Uint8Array): PublicKey | undefined {
    if (!this.ecdsaCompact) {
      throw new Error('invalid signature');
    }
    const bytes = secp.recoverPublicKey(
      digest,
      this.ecdsaCompact.bytes,
      this.ecdsaCompact.recovery
    );
    return bytes
      ? new PublicKey({
          secp256k1Uncompressed: { bytes }
        })
      : undefined;
  }

  // If the signature is valid for the provided digest
  // return the address derived from te public key that validest it.
  // Otherwise return undefined.
  getEthereumAddress(digest: Uint8Array): string | undefined {
    const pub = this.getPublicKey(digest);
    if (!pub) {
      return undefined;
    }
    return pub.getEthereumAddress();
  }

  toBytes(): Uint8Array {
    return proto.Signature.encode(this).finish();
  }

  static fromBytes(bytes: Uint8Array): Signature {
    return new Signature(proto.Signature.decode(bytes));
  }
}
