import * as assert from 'assert'
import {
  decodePrivateKeyBundle,
  PrivateKey,
  PrivateKeyBundleV1,
  PrivateKeyBundleV2,
  SignedPublicKeyBundle,
} from '../../src/crypto'
import {
  EncryptedKeyStore,
  PrivateTopicStore,
  storageSigRequestText,
} from '../../src/store'
import { hexToBytes } from '../../src/crypto/utils'
import { newWallet, sleep } from '../helpers'
import ApiClient, { ApiUrls } from '../../src/ApiClient'

describe('Crypto', function () {
  describe('PrivateKeyBundle', function () {
    it('v2 generate/encode/decode', async function () {
      const wallet = newWallet()
      // generate key bundle
      const bundle = await PrivateKeyBundleV2.generate(wallet)
      const bytes = bundle.encode()
      const bundle2 = decodePrivateKeyBundle(bytes)
      expect(bundle2).toBeInstanceOf(PrivateKeyBundleV2)
      expect(bundle2.version).toBe(2)
      expect(bundle.equals(bundle2 as PrivateKeyBundleV2))
      expect(
        bundle
          .getPublicKeyBundle()
          .equals((bundle2 as PrivateKeyBundleV2).getPublicKeyBundle())
      )
    })
    it('encrypts private key bundle for storage using a wallet', async function () {
      const wallet = newWallet()
      // generate key bundle
      const bob = await PrivateKeyBundleV1.generate(wallet)
      // encrypt and serialize the bundle for storage
      const store = new EncryptedKeyStore(
        wallet,
        new PrivateTopicStore(new ApiClient(ApiUrls['local']))
      )
      const bytes = await store.storePrivateKeyBundle(bob)
      await sleep(100)
      // decrypt and decode the bundle from storage
      const bobDecoded = await store.loadPrivateKeyBundle()

      assert.ok(bobDecoded)
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
      const wallet = newWallet()
      const bundle = await PrivateKeyBundleV1.generate(wallet)
      const preKey = hexToBytes(
        'f51bd1da9ec2239723ae2cf6a9f8d0ac37546b27e634002c653d23bacfcc67ad'
      )
      const actual = storageSigRequestText(preKey)
      const expected =
        'XMTP : Enable Identity\nf51bd1da9ec2239723ae2cf6a9f8d0ac37546b27e634002c653d23bacfcc67ad\n\nFor more info: https://xmtp.org/signatures/'
      assert.equal(actual, expected)
      assert.ok(true)
    })
  })
  describe('SignedPublicKeyBundle', () => {
    it('legacy roundtrip', async function () {
      const wallet = newWallet()
      const pri = await PrivateKeyBundleV1.generate(wallet)
      const pub = SignedPublicKeyBundle.fromLegacyBundle(
        pri.getPublicKeyBundle()
      )
      expect(pub.isFromLegacyBundle()).toBeTruthy()
      const leg = pub.toLegacyBundle()
      const pub2 = SignedPublicKeyBundle.fromLegacyBundle(leg)
      expect(pub.equals(pub2)).toBeTruthy()
      expect(pub2.identityKey.verifyKey(pub2.preKey)).toBeTruthy()
    })
  })
})
