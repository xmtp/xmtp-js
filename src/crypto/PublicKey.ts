import * as proto from '../../src/proto/messaging'
import * as secp from '@noble/secp256k1'
import Signature from './Signature'
import { bytesToHex, hexToBytes } from './utils'
import * as ethers from 'ethers'
import { sha256 } from './encryption'

// PublicKey represents uncompressed secp256k1 public key,
// that can optionally be signed with another trusted key pair.
// PublicKeys can be generated through PrivateKey.generate()
export default class PublicKey implements proto.PublicKey {
  timestamp: number
  secp256k1Uncompressed: proto.PublicKey_Secp256k1Uncompresed // eslint-disable-line camelcase
  signature?: Signature

  constructor(obj: proto.PublicKey) {
    if (!obj?.secp256k1Uncompressed?.bytes) {
      throw new Error('invalid public key')
    }
    if (obj.secp256k1Uncompressed.bytes.length !== 65) {
      throw new Error(
        `invalid public key length: ${obj.secp256k1Uncompressed.bytes.length}`
      )
    }
    if (obj.secp256k1Uncompressed.bytes[0] !== 4) {
      throw new Error(
        `unrecognized public key prefix: ${obj.secp256k1Uncompressed.bytes[0]}`
      )
    }
    this.timestamp = obj.timestamp
    this.secp256k1Uncompressed = obj.secp256k1Uncompressed
    if (obj.signature) {
      this.signature = new Signature(obj.signature)
    }
  }

  generated(): Date | undefined {
    if (!this.timestamp) {
      return undefined
    }
    return new Date(this.timestamp)
  }

  // verify that Signature was created from provided digest using the corresponding PrivateKey
  verify(signature: Signature, digest: Uint8Array): boolean {
    if (!this.secp256k1Uncompressed) {
      return false
    }
    if (!signature.ecdsaCompact) {
      return false
    }
    return secp.verify(
      signature.ecdsaCompact.bytes,
      digest,
      this.secp256k1Uncompressed.bytes
    )
  }

  bytesToSign(): Uint8Array {
    return proto.PublicKey.encode({
      timestamp: this.timestamp,
      secp256k1Uncompressed: this.secp256k1Uncompressed,
    }).finish()
  }

  identitySigRequestText(): string {
    // Note that an update to this signature request text will require
    // addition of backward compatability for existing signatures
    // and/or a migration; otherwise clients will fail to verify previously
    // signed keys.
    return (
      'XMTP : Create Identity\n' +
      `${bytesToHex(this.bytesToSign())}\n` +
      '\n' +
      'For more info: https://xmtp.org/signatures/'
    )
  }

  // verify that the provided PublicKey was signed by the corresponding PrivateKey
  async verifyKey(pub: PublicKey): Promise<boolean> {
    if (typeof pub.signature === undefined) {
      return false
    }
    if (!pub.secp256k1Uncompressed) {
      return false
    }
    const digest = await sha256(pub.bytesToSign())
    return pub.signature ? this.verify(pub.signature, digest) : false
  }

  // sign the key using a wallet
  async signWithWallet(wallet: ethers.Signer): Promise<void> {
    if (!this.secp256k1Uncompressed) {
      throw new Error('missing public key')
    }
    const sigString = await wallet.signMessage(this.identitySigRequestText())
    const eSig = ethers.utils.splitSignature(sigString)
    const r = hexToBytes(eSig.r)
    const s = hexToBytes(eSig.s)
    const sigBytes = new Uint8Array(64)
    sigBytes.set(r)
    sigBytes.set(s, r.length)
    this.signature = new Signature({
      ecdsaCompact: {
        bytes: sigBytes,
        recovery: eSig.recoveryParam,
      },
    })
  }

  // Assume the key was signed by a wallet and
  // return the wallet address that validates
  // the signature for this key.
  walletSignatureAddress(): string {
    if (!this.signature) {
      throw new Error('key is not signed')
    }
    if (!this.secp256k1Uncompressed) {
      throw new Error('missing public key')
    }
    const digest = hexToBytes(
      ethers.utils.hashMessage(this.identitySigRequestText())
    )
    const pk = this.signature.getPublicKey(digest)
    if (!pk) {
      throw new Error('key signature is malformed')
    }
    return pk.getEthereumAddress()
  }

  // derive Ethereum address from this PublicKey
  getEthereumAddress(): string {
    if (!this.secp256k1Uncompressed) {
      throw new Error('missing public key')
    }
    return ethers.utils.computeAddress(this.secp256k1Uncompressed.bytes)
  }

  // is other the same/equivalent PublicKey?
  equals(other: PublicKey): boolean {
    if (!this.secp256k1Uncompressed || !other.secp256k1Uncompressed) {
      return !this.secp256k1Uncompressed && !other.secp256k1Uncompressed
    }
    for (let i = 0; i < this.secp256k1Uncompressed.bytes.length; i++) {
      if (
        this.secp256k1Uncompressed.bytes[i] !==
        other.secp256k1Uncompressed.bytes[i]
      ) {
        return false
      }
    }
    return true
  }

  toBytes(): Uint8Array {
    return proto.PublicKey.encode(this).finish()
  }

  static fromBytes(bytes: Uint8Array): PublicKey {
    return new PublicKey(proto.PublicKey.decode(bytes))
  }
}
