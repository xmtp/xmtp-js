import * as assert from 'assert'
import Long from 'long'
import { PrivateKey, PublicKey, utils } from '../../src/crypto'
import * as ethers from 'ethers'
import { hexToBytes } from '../../src/crypto/utils'

describe('Crypto', function () {
  describe('PublicKey', function () {
    it('derives address from public key', function () {
      // using the sample from https://kobl.one/blog/create-full-ethereum-keypair-and-address/
      const bytes = utils.hexToBytes(
        '04836b35a026743e823a90a0ee3b91bf615c6a757e2b60b9e1dc1826fd0dd16106f7bc1e8179f665015f43c6c81f39062fc2086ed849625c06e04697698b21855e'
      )
      const pub = new PublicKey({
        secp256k1Uncompressed: { bytes },
        timestamp: Long.fromNumber(new Date().getTime()),
      })
      const address = pub.getEthereumAddress()
      assert.equal(address, '0x0BED7ABd61247635c1973eB38474A2516eD1D884')
    })

    it('human-friendly identity key signature request', async function () {
      const alice = PrivateKey.fromBytes(
        hexToBytes(
          '08aaa9dad3ed2f12220a206fd789a6ee2376bb6595b4ebace57c7a79e6e4f1f12c8416d611399eda6c74cb1a4c08aaa9dad3ed2f1a430a4104e208133ea0973a9968fe5362e5ac0a8bbbe2aa16d796add31f3d027a1b894389873d7f282163bceb1fc3ca60d589d1e667956c40fed4cdaa7edc1392d2100b8a'
        )
      )
      const actual = alice.publicKey.identitySigRequestText()
      const expected =
        'XMTP : Create Identity\n08aaa9dad3ed2f1a430a4104e208133ea0973a9968fe5362e5ac0a8bbbe2aa16d796add31f3d027a1b894389873d7f282163bceb1fc3ca60d589d1e667956c40fed4cdaa7edc1392d2100b8a\n\nFor more info: https://xmtp.org/signatures/'
      assert.equal(actual, expected)
    })

    it('signs keys using a wallet', async function () {
      // create a wallet using a generated key
      const alice = PrivateKey.generate()
      assert.ok(alice.secp256k1)
      const wallet = new ethers.Wallet(alice.secp256k1.bytes)
      // sanity check that we agree with the wallet about the address
      assert.ok(wallet.address, alice.publicKey.getEthereumAddress())
      // sign the public key using the wallet
      await alice.publicKey.signWithWallet(wallet)
      assert.ok(alice.publicKey.signature)
      // validate the key signature and return wallet address
      const address = alice.publicKey.walletSignatureAddress()
      assert.equal(address, wallet.address)
    })
  })
})
