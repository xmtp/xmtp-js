import * as assert from 'assert'
import { Wallet } from 'ethers'
import { toUtf8Bytes } from 'ethers/lib/utils'
import { PrivateKeyBundleV1 } from '../../src/crypto'
import {
  PrivateKeyBundleV2,
  PrivateKeyBundleV3,
} from '../../src/crypto/PrivateKeyBundle'
import {
  AccountLinkedRole,
  StaticWalletAccountLinkSigner,
} from '../../src/crypto/Signature'
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

describe('Account Linked Signatures', () => {
  let wallet: Wallet
  // let accountLinkedPublicKey: AccountLinkedPublicKey
  beforeEach(async () => {
    wallet = newWallet()
  })

  test.each([AccountLinkedRole.INBOX_KEY, AccountLinkedRole.SEND_KEY])(
    'Account linked signatures can be verified',
    async (role) => {
      const newBundle = await PrivateKeyBundleV3.generate(wallet, role)
      expect(newBundle.getLinkedAddress(role)).toEqual(wallet.address)
    }
  )

  test.each([AccountLinkedRole.INBOX_KEY, AccountLinkedRole.SEND_KEY])(
    'Account linked signatures throw when used for the wrong role',
    async (role) => {
      const newBundle = await PrivateKeyBundleV3.generate(
        wallet,
        AccountLinkedRole.INBOX_KEY
      )
      expect(() => {
        newBundle.getLinkedAddress(AccountLinkedRole.SEND_KEY)
      }).toThrow()
    }
  )

  test('Account linked signatures give wrong address when used for the wrong role with maliciously set text', async () => {
    const newBundle = await PrivateKeyBundleV3.generate(
      wallet,
      AccountLinkedRole.INBOX_KEY
    )
    let key = newBundle.accountLinkedKey.publicKey
    if (!key.staticSignature) {
      throw new Error('Static signature not set')
    }
    key.staticSignature.text = toUtf8Bytes(
      StaticWalletAccountLinkSigner.accountLinkRequestText(
        key.keyBytes,
        AccountLinkedRole.SEND_KEY
      )
    )
    expect(newBundle.getLinkedAddress(AccountLinkedRole.SEND_KEY)).not.toEqual(
      wallet.address
    )
  })

  test('Old signatures can be converted to account linked inbox key signatures', async () => {
    const legacyBundle = await PrivateKeyBundleV2.generate(wallet)
    const newBundle = PrivateKeyBundleV3.fromLegacyBundle(
      legacyBundle,
      AccountLinkedRole.INBOX_KEY
    )
    expect(newBundle.getLinkedAddress(AccountLinkedRole.INBOX_KEY)).toEqual(
      wallet.address
    )
  })

  test('Old signatures cannot be converted to account linked send key signatures', async () => {
    const legacyBundle = await PrivateKeyBundleV2.generate(wallet)
    const newBundle = PrivateKeyBundleV3.fromLegacyBundle(
      legacyBundle,
      AccountLinkedRole.SEND_KEY
    )
    expect(newBundle.getLinkedAddress(AccountLinkedRole.SEND_KEY)).not.toEqual(
      wallet.address
    )
  })
})
