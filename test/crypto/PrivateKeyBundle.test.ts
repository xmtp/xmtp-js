import * as assert from 'assert'
import { PrivateKey, PrivateKeyBundle } from '../../src/crypto'
import { Wallet } from 'ethers'
import { hexToBytes } from '../../src/crypto/utils'

describe('Crypto', function () {
  describe('PrivateKeyBundle', function () {
    it('encrypts private key bundle for storage using a wallet', async function () {
      // create a wallet using a generated key
      const bobPri = PrivateKey.generate()
      assert.ok(bobPri.secp256k1)
      const wallet = new Wallet(bobPri.secp256k1.bytes)
      // generate key bundle
      const bob = await PrivateKeyBundle.generate(wallet)
      // encrypt and serialize the bundle for storage
      const bytes = await bob.toEncryptedBytes(wallet)
      // decrypt and decode the bundle from storage
      const bobDecoded = await PrivateKeyBundle.fromEncryptedBytes(
        wallet,
        bytes
      )
      assert.ok(bob.identityKey)
      assert.ok(bobDecoded.identityKey)
      assert.ok(bob.identityKey.publicKey.signature)
      assert.ok(bobDecoded.identityKey.publicKey.signature)
      assert.deepEqual(
        bob.identityKey.publicKey.signature?.ecdsaCompact?.bytes,
        bobDecoded.identityKey.publicKey.signature?.ecdsaCompact?.bytes
      )
      assert.ok(bob.identityKey.secp256k1)
      assert.ok(bobDecoded.identityKey.secp256k1)
      assert.deepEqual(
        bob.identityKey.secp256k1.bytes,
        bobDecoded.identityKey.secp256k1.bytes
      )
      assert.ok(bob.preKeys[0].secp256k1)
      assert.ok(bobDecoded.preKeys[0].secp256k1)
      assert.deepEqual(
        bob.preKeys[0].secp256k1.bytes,
        bobDecoded.preKeys[0].secp256k1.bytes
      )
    })

    it('human-friendly storage signature request text', async function () {
      const pri = PrivateKey.fromBytes(
        hexToBytes(
          '08aaa9dad3ed2f12220a206fd789a6ee2376bb6595b4ebace57c7a79e6e4f1f12c8416d611399eda6c74cb1a4c08aaa9dad3ed2f1a430a4104e208133ea0973a9968fe5362e5ac0a8bbbe2aa16d796add31f3d027a1b894389873d7f282163bceb1fc3ca60d589d1e667956c40fed4cdaa7edc1392d2100b8a'
        )
      )
      assert.ok(pri.secp256k1)
      const wallet = new Wallet(pri.secp256k1.bytes)
      const bundle = await PrivateKeyBundle.generate(wallet)
      const preKey = hexToBytes(
        'f51bd1da9ec2239723ae2cf6a9f8d0ac37546b27e634002c653d23bacfcc67ad'
      )
      const actual = PrivateKeyBundle.storageSigRequestText(preKey)
      const expected =
        'XMTP : Enable Identity\nf51bd1da9ec2239723ae2cf6a9f8d0ac37546b27e634002c653d23bacfcc67ad\n\nFor more info: https://xmtp.org/signatures/'
      assert.equal(actual, expected)
      assert.ok(true)
    })
  })
})
