import { keccak256 } from 'js-sha3'
import { PrivateKey, PrivateKeyBundle, Signature } from '../../src/crypto'
import Authenticator from '../../src/authn/Authenticator'
import Token from '../../src/authn/Token'
import { hexToBytes } from '../../src/crypto/utils'
import { newWallet } from '../helpers'
import { Wallet } from 'ethers'

describe('authn', () => {
  let authenticator: Authenticator
  let privateKey: PrivateKey
  let wallet: Wallet

  beforeEach(async () => {
    wallet = newWallet()
    const bundle = await PrivateKeyBundle.generate(wallet)
    privateKey = bundle.identityKey
    authenticator = new Authenticator(privateKey)
  })

  it('can create a token', async () => {
    const timestamp = new Date()
    const token = await authenticator.createToken(timestamp)

    expect(token.authData.walletAddr).toEqual(
      privateKey.publicKey.walletSignatureAddress()
    )
    expect(token.authData.createdNs).toEqual(+timestamp * 1000)
    expect(token.identityKey.timestamp).toEqual(privateKey.publicKey.timestamp)
    expect(token.identityKey.signature).toEqual(privateKey.publicKey.signature)
    expect(token.identityKey.secp256k1Uncompressed).toEqual(
      privateKey.publicKey.secp256k1Uncompressed
    )
  })

  it('rejects unsigned identity keys', async () => {
    const pk = PrivateKey.generate()
    expect(pk.publicKey.signature).toBeUndefined()
    expect(() => new Authenticator(pk)).toThrow(
      'Provided public key is not signed'
    )
  })

  it('round trips safely', async () => {
    const originalToken = await authenticator.createToken()
    const bytes = originalToken.toBytes()
    const newToken = Token.fromBytes(bytes)
    expect(originalToken.authData).toEqual(newToken.authData)
    expect(originalToken.toBytes()).toEqual(newToken.toBytes())
  })

  it('creates a signature that can be verified', async () => {
    const token = await authenticator.createToken()
    const digest = hexToBytes(keccak256(token.authDataBytes))
    const sig = new Signature(token.authDataSignature)

    expect(sig.getPublicKey(digest)?.equals(privateKey.publicKey)).toBeTruthy()
    expect(privateKey.publicKey.verify(sig, digest)).toBeTruthy()
  })
})
