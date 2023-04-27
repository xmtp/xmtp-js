import * as assert from 'assert'
import { PrivateKeyBundleV1 } from '../../src/crypto'
import { newWallet } from '../helpers'

describe('Crypto', function () {
  describe('Signature', function () {
    it('transplanting a wallet signature changes the derived wallet address', async function () {
      const alice = newWallet()
      const alicePri = await PrivateKeyBundleV1.generate(alice)
      const alicePub = alicePri.getPublicKeyBundle()
      assert.equal(alicePub.identityKey.walletSignatureAddress(), alice.address)
      const malory = newWallet()
      assert.notEqual(alice.address, malory.address)
      const maloryPri = await PrivateKeyBundleV1.generate(malory)
      const maloryPub = maloryPri.getPublicKeyBundle()
      assert.equal(
        maloryPub.identityKey.walletSignatureAddress(),
        malory.address
      )
      // malory transplants alice's wallet sig onto her own key bundle
      maloryPub.identityKey.signature = alicePub.identityKey.signature
      assert.notEqual(
        maloryPub.identityKey.walletSignatureAddress(),
        alice.address
      )
      assert.notEqual(
        maloryPub.identityKey.walletSignatureAddress(),
        malory.address
      )
    })
  })
})
