import { keccak256 } from 'js-sha3'
import { authn, signature, publicKey } from '@xmtp/proto'
import AuthData from './AuthData'
import { PrivateKey } from '../crypto'
import { hexToBytes } from '../crypto/utils'
import Token from './Token'

export default class Authenticator {
  private identityKey: PrivateKey

  constructor(identityKey: PrivateKey) {
    if (!identityKey.publicKey.signature) {
      throw new Error('Provided public key is not signed')
    }
    this.identityKey = identityKey
  }

  async createToken(timestamp?: Date): Promise<Token> {
    const authData = AuthData.create(
      this.identityKey.publicKey.walletSignatureAddress(),
      timestamp || new Date()
    )
    const authDataBytes = authData.toBytes()
    const digest = keccak256(authDataBytes)
    const authSig = await this.identityKey.sign(hexToBytes(digest))

    return new Token(
      authn.Token.fromPartial({
        identityKey: publicKey.PublicKey.fromPartial(
          // The generated types are overly strict and don't like our additional methods
          // eslint-disable-next-line
          // @ts-ignore
          this.identityKey.publicKey
        ),
        authDataBytes,
        // The generated types are overly strict and don't like our additional methods
        // eslint-disable-next-line
        // @ts-ignore
        authDataSignature: signature.Signature.fromPartial(authSig),
      })
    )
  }
}
