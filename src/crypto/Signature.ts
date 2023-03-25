import { signature } from '@xmtp/proto'
import Long from 'long'
import * as secp from '@noble/secp256k1'
import {
  PublicKey,
  UnsignedPublicKey,
  SignedPublicKey,
  AccountLinkedPublicKey,
} from './PublicKey'
import { SignedPrivateKey } from './PrivateKey'
import { utils } from 'ethers'
import { Signer } from '../types/Signer'
import { bytesToHex, equalBytes, hexToBytes } from './utils'
import { toUtf8Bytes } from 'ethers/lib/utils'
import { SiweMessage } from 'siwe'

// ECDSA signature with recovery bit.
export type ECDSACompactWithRecovery = {
  bytes: Uint8Array // compact representation [ R || S ], 64 bytes
  recovery: number // recovery bit
}

// Validate signature.
function ecdsaCheck(sig: ECDSACompactWithRecovery): void {
  if (sig.bytes.length !== 64) {
    throw new Error(`invalid signature length: ${sig.bytes.length}`)
  }
  if (sig.recovery !== 0 && sig.recovery !== 1) {
    throw new Error(`invalid recovery bit: ${sig.recovery}`)
  }
}

// Compare signatures.
function ecdsaEqual(
  a: ECDSACompactWithRecovery,
  b: ECDSACompactWithRecovery
): boolean {
  return a.recovery === b.recovery && equalBytes(a.bytes, b.bytes)
}

// Derive public key of the signer from the digest and the signature.
export function ecdsaSignerKey(
  digest: Uint8Array,
  signature: ECDSACompactWithRecovery
): UnsignedPublicKey | undefined {
  const bytes = secp.recoverPublicKey(
    digest,
    signature.bytes,
    signature.recovery
  )
  return bytes
    ? new UnsignedPublicKey({
        secp256k1Uncompressed: { bytes },
        createdNs: Long.fromNumber(0),
      })
    : undefined
}

export default class Signature implements signature.Signature {
  // SECP256k1/SHA256 ECDSA signature
  ecdsaCompact: ECDSACompactWithRecovery | undefined // eslint-disable-line camelcase
  // SECP256k1/keccak256 ECDSA signature created with Signer.signMessage (see WalletSigner)
  walletEcdsaCompact: ECDSACompactWithRecovery | undefined // eslint-disable-line camelcase

  constructor(obj: Partial<signature.Signature>) {
    if (obj.ecdsaCompact) {
      ecdsaCheck(obj.ecdsaCompact)
      this.ecdsaCompact = obj.ecdsaCompact
    } else if (obj.walletEcdsaCompact) {
      ecdsaCheck(obj.walletEcdsaCompact)
      this.walletEcdsaCompact = obj.walletEcdsaCompact
    } else {
      throw new Error('invalid signature')
    }
  }

  // Return the public key that validates provided key's signature.
  async signerKey(
    key: SignedPublicKey
  ): Promise<UnsignedPublicKey | undefined> {
    if (this.ecdsaCompact) {
      return SignedPrivateKey.signerKey(key, this.ecdsaCompact)
    } else if (this.walletEcdsaCompact) {
      return WalletSigner.signerKey(key, this.walletEcdsaCompact)
    } else {
      return undefined
    }
  }

  // LEGACY: Return the public key that validates this signature given the provided digest.
  // Return undefined if the signature is malformed.
  getPublicKey(digest: Uint8Array): PublicKey | undefined {
    if (!this.ecdsaCompact) {
      throw new Error('invalid signature')
    }
    const bytes = secp.recoverPublicKey(
      digest,
      this.ecdsaCompact.bytes,
      this.ecdsaCompact.recovery
    )
    return bytes
      ? new PublicKey({
          secp256k1Uncompressed: { bytes },
          timestamp: Long.fromNumber(0),
        })
      : undefined
  }

  // Is this the same/equivalent signature as other?
  equals(other: Signature): boolean {
    if (this.ecdsaCompact && other.ecdsaCompact) {
      return ecdsaEqual(this.ecdsaCompact, other.ecdsaCompact)
    }
    if (this.walletEcdsaCompact && other.walletEcdsaCompact) {
      return ecdsaEqual(this.walletEcdsaCompact, other.walletEcdsaCompact)
    }
    return false
  }

  toBytes(): Uint8Array {
    return signature.Signature.encode(this).finish()
  }

  static fromBytes(bytes: Uint8Array): Signature {
    return new Signature(signature.Signature.decode(bytes))
  }
}

class AccountLinkedStaticSignatureV1
  implements signature.AccountLinkedStaticSignature_V1
{
  text: Uint8Array
  signature: Signature
  private _walletEcdsaCompact: ECDSACompactWithRecovery

  constructor(obj: Partial<signature.AccountLinkedStaticSignature_V1>) {
    if (!obj.text || !obj.signature) {
      throw new Error('Invalid AccountLinkedStaticSignatureV1')
    }
    this.text = obj.text
    this.signature = new Signature(obj.signature)
    if (!this.signature.walletEcdsaCompact) {
      throw new Error(
        'Invalid AccountLinkedStaticSignatureV1 does not have ecdsaCompact'
      )
    }
    this._walletEcdsaCompact = this.signature.walletEcdsaCompact
  }

  public get walletEcdsaCompact(): ECDSACompactWithRecovery {
    return this._walletEcdsaCompact
  }
}

export class AccountLinkedStaticSignature
  extends AccountLinkedStaticSignatureV1
  implements signature.AccountLinkedStaticSignature
{
  v1: signature.AccountLinkedStaticSignature_V1

  constructor(obj: Partial<signature.AccountLinkedStaticSignature>) {
    if (!obj.v1) {
      throw new Error('Unsupported AccountLinkedStaticSignature version')
    }
    super(obj.v1)
    this.v1 = obj.v1
  }

  public static create(
    text: Uint8Array,
    signature: Signature
  ): AccountLinkedStaticSignature {
    return new AccountLinkedStaticSignature({
      v1: {
        text,
        signature,
      },
    })
  }
}

class AccountLinkedSIWESignatureV1
  implements signature.AccountLinkedSIWESignature_V1
{
  text: Uint8Array
  signature: Signature
  private _walletEcdsaCompact: ECDSACompactWithRecovery

  constructor(obj: Partial<signature.AccountLinkedStaticSignature_V1>) {
    if (!obj.text || !obj.signature) {
      throw new Error('Invalid AccountLinkedSIWESignatureV1')
    }
    this.text = obj.text
    this.signature = new Signature(obj.signature)
    if (!this.signature.walletEcdsaCompact) {
      throw new Error(
        'Invalid AccountLinkedSIWESignatureV1 does not have ecdsaCompact'
      )
    }
    this._walletEcdsaCompact = this.signature.walletEcdsaCompact
  }

  public get walletEcdsaCompact(): ECDSACompactWithRecovery {
    return this._walletEcdsaCompact
  }
}

export class AccountLinkedSIWESignature
  extends AccountLinkedSIWESignatureV1
  implements signature.AccountLinkedSIWESignature
{
  v1: signature.AccountLinkedSIWESignature_V1

  constructor(obj: Partial<signature.AccountLinkedSIWESignature>) {
    if (!obj.v1) {
      throw new Error('Unsupported AccountLinkedSIWESignature version')
    }
    super(obj.v1)
    this.v1 = obj.v1
  }

  public static create(
    text: Uint8Array,
    signature: Signature
  ): AccountLinkedSIWESignature {
    return new AccountLinkedSIWESignature({
      v1: {
        text,
        signature,
      },
    })
  }
}

// Deprecation in progress
// A signer that can be used to sign public keys.
export interface KeySigner {
  signKey(key: UnsignedPublicKey): Promise<SignedPublicKey>
}

export enum AccountLinkedRole {
  INBOX_KEY,
  SEND_KEY,
}

// A wallet based KeySigner.
export class WalletSigner implements KeySigner {
  wallet: Signer

  constructor(wallet: Signer) {
    this.wallet = wallet
  }

  static identitySigRequestText(keyBytes: Uint8Array): string {
    // Note that an update to this signature request text will require
    // addition of backward compatibility for existing signatures
    // and/or a migration; otherwise clients will fail to verify previously
    // signed keys.
    return (
      'XMTP : Create Identity\n' +
      `${bytesToHex(keyBytes)}\n` +
      '\n' +
      'For more info: https://xmtp.org/signatures/'
    )
  }

  static signerKey(
    key: SignedPublicKey,
    signature: ECDSACompactWithRecovery
  ): UnsignedPublicKey | undefined {
    const digest = hexToBytes(
      utils.hashMessage(this.identitySigRequestText(key.bytesToSign()))
    )
    return ecdsaSignerKey(digest, signature)
  }

  async signKey(key: UnsignedPublicKey): Promise<SignedPublicKey> {
    const keyBytes = key.toBytes()
    const sigString = await this.wallet.signMessage(
      WalletSigner.identitySigRequestText(keyBytes)
    )
    const eSig = utils.splitSignature(sigString)
    const r = hexToBytes(eSig.r)
    const s = hexToBytes(eSig.s)
    const sigBytes = new Uint8Array(64)
    sigBytes.set(r)
    sigBytes.set(s, r.length)
    const signature = new Signature({
      walletEcdsaCompact: {
        bytes: sigBytes,
        recovery: eSig.recoveryParam,
      },
    })
    return new SignedPublicKey({ keyBytes, signature })
  }
}

export interface AccountLinkSigner {
  signKeyWithRole(
    key: UnsignedPublicKey,
    role: AccountLinkedRole
  ): Promise<AccountLinkedPublicKey>
}

export class SIWEWalletAccountLinkSigner implements AccountLinkSigner {
  wallet: Signer

  constructor(wallet: Signer) {
    this.wallet = wallet
  }

  public static accountLinkedSIWERoleRequestText(
    role: AccountLinkedRole
  ): string {
    switch (role) {
      case AccountLinkedRole.INBOX_KEY:
        return 'AllowAllRead'
      case AccountLinkedRole.SEND_KEY:
        return 'GrantSendPermissions'
    }
  }

  public static accountLinkedSIWEResourceRoleText(
    keyBytes: Uint8Array,
    role: AccountLinkedRole
  ): string {
    return `https://xmtp.org/siwe/${SIWEWalletAccountLinkSigner.accountLinkedSIWERoleRequestText(
      role
    )}/secp256k1/${bytesToHex(keyBytes)}`
  }

  // Default SIWE text to be signed, most apps will NOT want to use this.
  // Most apps will want to include the resource string in their own SIWE to avoid
  // asking for multiple SIWE signatures.
  public static defaultAccountLinkSIWERequestText(
    key: UnsignedPublicKey,
    role: AccountLinkedRole,
    walletAddress: string
  ): string {
    // Create a SIWE message
    // - statement can be anything
    // - get the address from the signer
    // - add the resource string with keybytes
    const keyBytes = key.toBytes()
    const resource =
      SIWEWalletAccountLinkSigner.accountLinkedSIWEResourceRoleText(
        keyBytes,
        role
      )
    const siwe = new SiweMessage({
      statement: 'XMTP Account Link with Role: ' + role,
      address: walletAddress,
      domain: 'xmtp.org',
      version: '1',
      uri: 'https://xmtp.org',
      chainId: 1,
      resources: [resource],
    })
    return siwe.prepareMessage()
  }

  // NOTE: this will NOT be used in practice, mostly here for demonstration purposes
  // in reality, the SDK consumer will likely use their login SIWE with the role resource
  // and pass it directly down into the client
  public async signKeyWithRole(
    key: UnsignedPublicKey,
    role: AccountLinkedRole
  ): Promise<AccountLinkedPublicKey> {
    const keyBytes = key.toBytes()
    const siweMessageBytes = toUtf8Bytes(
      SIWEWalletAccountLinkSigner.defaultAccountLinkSIWERequestText(
        key,
        role,
        await this.wallet.getAddress()
      )
    )
    const sigString = await this.wallet.signMessage(siweMessageBytes)
    const eSig = utils.splitSignature(sigString)
    const r = hexToBytes(eSig.r)
    const s = hexToBytes(eSig.s)
    const sigBytes = new Uint8Array(64)
    sigBytes.set(r)
    sigBytes.set(s, r.length)
    const signature = new Signature({
      walletEcdsaCompact: {
        bytes: sigBytes,
        recovery: eSig.recoveryParam,
      },
    })
    return AccountLinkedPublicKey.create(
      keyBytes,
      undefined,
      AccountLinkedSIWESignature.create(siweMessageBytes, signature)
    )
  }
}

export class StaticWalletAccountLinkSigner implements AccountLinkSigner {
  wallet: Signer

  constructor(wallet: Signer) {
    this.wallet = wallet
  }

  public static accountLinkedRoleRequestText(role: AccountLinkedRole): string {
    switch (role) {
      case AccountLinkedRole.INBOX_KEY:
        return 'Create Identity'
      case AccountLinkedRole.SEND_KEY:
        return 'Grant Send Permissions'
    }
  }

  public static accountLinkRequestText(
    keyBytes: Uint8Array,
    role: AccountLinkedRole
  ): string {
    // Note that an update to this signature request text will require
    // addition of backward compatibility for existing signatures
    // and/or a migration; otherwise clients will fail to verify previously
    // signed keys.
    return (
      `XMTP : ${StaticWalletAccountLinkSigner.accountLinkedRoleRequestText(
        role
      )}\n` +
      `${bytesToHex(keyBytes)}\n` +
      '\n' +
      'For more info: https://xmtp.org/signatures/'
    )
  }

  public async signKeyWithRole(
    key: UnsignedPublicKey,
    role: AccountLinkedRole
  ): Promise<AccountLinkedPublicKey> {
    const keyBytes = key.toBytes()
    const requestTextBytes = toUtf8Bytes(
      StaticWalletAccountLinkSigner.accountLinkRequestText(keyBytes, role)
    )
    const sigString = await this.wallet.signMessage(requestTextBytes)
    const eSig = utils.splitSignature(sigString)
    const r = hexToBytes(eSig.r)
    const s = hexToBytes(eSig.s)
    const sigBytes = new Uint8Array(64)
    sigBytes.set(r)
    sigBytes.set(s, r.length)
    const signature = new Signature({
      walletEcdsaCompact: {
        bytes: sigBytes,
        recovery: eSig.recoveryParam,
      },
    })
    return AccountLinkedPublicKey.create(
      keyBytes,
      AccountLinkedStaticSignature.create(requestTextBytes, signature),
      undefined /* siweSignature */
    )
  }
}
