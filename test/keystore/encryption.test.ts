import { buildDirectMessageTopic } from './../../src/utils/topic'
import { PrivateKeyBundleV1 } from './../../src/crypto/PrivateKeyBundle'
import { decryptV1 } from '../../src/keystore/encryption'
import { MessageV1 } from '../../src/Message'
import { Wallet } from 'ethers'
import { equalBytes } from '../../src/crypto/utils'

describe('encryption primitives', () => {
  let aliceKeys: PrivateKeyBundleV1
  let aliceWallet: Wallet
  let bobKeys: PrivateKeyBundleV1
  let bobWallet: Wallet

  beforeEach(async () => {
    aliceWallet = Wallet.createRandom()
    aliceKeys = await PrivateKeyBundleV1.generate(aliceWallet)
    bobWallet = Wallet.createRandom()
    bobKeys = await PrivateKeyBundleV1.generate(bobWallet)
  })

  describe('decryptV1', () => {
    it('should decrypt a valid payload', async () => {
      const message = new TextEncoder().encode('Hello world')
      const payload = await MessageV1.encode(
        aliceKeys,
        bobKeys.getPublicKeyBundle(),
        message,
        new Date()
      )

      const aliceDecrypted = await decryptV1(
        aliceKeys,
        bobKeys.getPublicKeyBundle(),
        payload.ciphertext,
        payload.headerBytes,
        true
      )

      const bobDecrypted = await decryptV1(
        bobKeys,
        aliceKeys.getPublicKeyBundle(),
        payload.ciphertext,
        payload.headerBytes,
        false
      )

      expect(equalBytes(aliceDecrypted, bobDecrypted)).toBeTruthy()
    })
  })
})
