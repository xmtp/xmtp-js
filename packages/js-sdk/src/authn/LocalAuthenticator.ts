import { authn, publicKey, signature } from '@xmtp/proto'
import { hexToBytes, keccak256 } from 'viem'
import type { PrivateKey } from '@/crypto/PrivateKey'
import AuthData from './AuthData'
import Token from './Token'

export default class LocalAuthenticator {
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
