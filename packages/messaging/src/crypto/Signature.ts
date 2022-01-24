import * as proto from '../../src/proto/message';
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

  // decode serialized Signature
  static decode(bytes: Uint8Array): Signature {
    const sig = proto.Signature.decode(bytes);
    return Signature.fromDecoded(sig);
  }

  // build Signature from proto.Signature structure
  static fromDecoded(sig: proto.Signature): Signature {
    if (sig.ecdsaCompact) {
      return new Signature(sig);
    }
    throw new Error('unrecognized signature');
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
    return bytes ? PublicKey.fromBytes(bytes) : undefined;
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

  // serialize Signature into bytes
  encode(): Uint8Array {
    return proto.Signature.encode(this.toBeEncoded()).finish();
  }

  // build proto.Signature from Signature
  toBeEncoded(): proto.Signature {
    if (!this.ecdsaCompact) {
      throw new Error('invalid signature');
    }
    return {
      ecdsaCompact: {
        bytes: this.ecdsaCompact.bytes,
        recovery: this.ecdsaCompact.recovery
      }
    };
  }
}
