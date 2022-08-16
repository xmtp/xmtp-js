import { keccak256 } from 'js-sha3'
import Long from 'long'
import { PrivateKey, PrivateKeyBundle, Signature } from '../../src/crypto'
import Authenticator from '../../src/authn/Authenticator'
import Token from '../../src/authn/Token'
import { hexToBytes } from '../../src/crypto/utils'
import { newWallet, sleep } from '../helpers'
import { Wallet } from 'ethers'
import AuthCache from '../../src/authn/AuthCache'

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
    expect(token.authData.createdNs).toEqual(
      Long.fromNumber(timestamp.valueOf()).toUnsigned().multiply(1_000_000)
    )
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

describe('AuthCache', () => {
  let authenticator: Authenticator
  let privateKey: PrivateKey
  let wallet: Wallet

  beforeEach(async () => {
    wallet = newWallet()
    const bundle = await PrivateKeyBundle.generate(wallet)
    privateKey = bundle.identityKey
    authenticator = new Authenticator(privateKey)
  })

  it('safely re-uses cached token', async () => {
    const authCache = new AuthCache(authenticator)
    const firstToken = await authCache.getToken()
    const secondToken = await authCache.getToken()
    expect(firstToken).toEqual(secondToken)
  })

  it('refreshes to new token', async () => {
    const authCache = new AuthCache(authenticator)
    const firstToken = await authCache.getToken()
    await authCache.refresh()
    const secondToken = await authCache.getToken()
    expect(firstToken === secondToken).toBeFalsy()
  })

  it('respects expiration', async () => {
    const authCache = new AuthCache(authenticator, 0.01)
    const firstToken = await authCache.getToken()
    await sleep(50)
    const secondToken = await authCache.getToken()
    expect(firstToken === secondToken).toBeFalsy()
  })
})
