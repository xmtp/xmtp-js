import { authn } from '@xmtp/proto'
import AuthData from './AuthData'

export default class Token implements authn.Token {
  identityKey: authn.PublicKey
  authDataBytes: Uint8Array
  authDataSignature: authn.Signature
  private _authData?: AuthData

  constructor({ identityKey, authDataBytes, authDataSignature }: authn.Token) {
    if (!identityKey) {
      throw new Error('Missing identity key in token')
    }
    if (!authDataSignature) {
      throw new Error('Missing authDataSignature in token')
    }
    this.identityKey = identityKey
    this.authDataBytes = authDataBytes
    this.authDataSignature = authDataSignature
  }

  // Get AuthData, generating from bytes and cacheing the first time it is accessed
  get authData(): AuthData {
    if (!this._authData) {
      this._authData = AuthData.fromBytes(this.authDataBytes)
    }

    return this._authData
  }

  toBytes(): Uint8Array {
    return authn.Token.encode(this).finish()
  }

  static fromBytes(bytes: Uint8Array): Token {
    return new Token(authn.Token.decode(bytes))
  }
}
