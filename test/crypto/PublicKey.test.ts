import * as assert from 'assert'
import { PrivateKey, PublicKey, utils } from '../../src/crypto'
import * as ethers from 'ethers'

describe('Crypto', function () {
  describe('PublicKey', function () {
    it('derives address from public key', function () {
      // using the sample from https://kobl.one/blog/create-full-ethereum-keypair-and-address/
      const bytes = utils.hexToBytes(
        '04836b35a026743e823a90a0ee3b91bf615c6a757e2b60b9e1dc1826fd0dd16106f7bc1e8179f665015f43c6c81f39062fc2086ed849625c06e04697698b21855e'
      )
      const pub = new PublicKey({
        secp256k1Uncompressed: { bytes },
        timestamp: new Date().getTime(),
      })
      const address = pub.getEthereumAddress()
      assert.equal(address, '0x0BED7ABd61247635c1973eB38474A2516eD1D884')
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
      // validate the key signature and return wallet address
      const address = alice.publicKey.walletSignatureAddress()
      assert.equal(address, wallet.address)
    })
  })
})
