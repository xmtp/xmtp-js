import * as assert from 'assert'
import { PrivateKeyBundleV1, Signature } from '../../src/crypto'
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

    it('returns wallet address for either ecdsaCompact or walletEcdsaCompact signatures', async function () {
      const alice = newWallet()
      const alicePri = await PrivateKeyBundleV1.generate(alice)
      const alicePub = alicePri.getPublicKeyBundle()
      assert.ok(alicePub.identityKey.signature?.ecdsaCompact)
      assert.equal(alicePub.identityKey.walletSignatureAddress(), alice.address)

      // create a malformed v1 signature
      alicePub.identityKey.signature = new Signature({
        walletEcdsaCompact: {
          bytes: alicePub.identityKey.signature.ecdsaCompact.bytes,
          recovery: alicePub.identityKey.signature.ecdsaCompact.recovery,
        },
      })
      assert.ok(alicePub.identityKey.signature.walletEcdsaCompact)
      assert.equal(alicePub.identityKey.signature.ecdsaCompact, undefined)
      assert.equal(alicePub.identityKey.walletSignatureAddress(), alice.address)
    })
  })
})
