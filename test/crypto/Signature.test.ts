import * as assert from 'assert'
import { Wallet } from 'ethers'
import { toUtf8Bytes } from 'ethers/lib/utils'
import { bytesToHex } from '../../src/crypto/utils'
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
import { SiweMessage } from 'siwe'

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
    'Account linked SIWE signatures can be verified',
    async (role) => {
      const newBundle = await PrivateKeyBundleV3.generateSIWE(wallet, role)
      expect(newBundle.getLinkedAddress(role)).toEqual(wallet.address)
    }
  )

  test.each([AccountLinkedRole.INBOX_KEY, AccountLinkedRole.SEND_KEY])(
    'Account linked signatures throw when used for the wrong role',
    async (role) => {
      const otherRole =
        role === AccountLinkedRole.INBOX_KEY
          ? AccountLinkedRole.SEND_KEY
          : AccountLinkedRole.INBOX_KEY
      const newBundle = await PrivateKeyBundleV3.generateSIWE(wallet, role)
      expect(() => {
        newBundle.getLinkedAddress(otherRole)
      }).toThrow()
    }
  )

  test.each([AccountLinkedRole.INBOX_KEY, AccountLinkedRole.SEND_KEY])(
    'Account linked SIWE signatures throw when used for the wrong role',
    async (role) => {
      const otherRole =
        role === AccountLinkedRole.INBOX_KEY
          ? AccountLinkedRole.SEND_KEY
          : AccountLinkedRole.INBOX_KEY
      const newBundle = await PrivateKeyBundleV3.generateSIWE(wallet, role)
      expect(() => {
        newBundle.getLinkedAddress(otherRole)
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

  test('Account linked SIWE signatures give wrong address when used for the wrong role with maliciously set text', async () => {
    const newBundle = await PrivateKeyBundleV3.generateSIWE(
      wallet,
      AccountLinkedRole.INBOX_KEY
    )
    let key = newBundle.accountLinkedKey.publicKey
    if (!key.siweSignature) {
      throw new Error('SIWE signature not set')
    }
    // Parse the SIWE message to get the underlying message
    const text = new TextDecoder().decode(key.siweSignature.text)
    const siweMessage = new SiweMessage(text)
    // Swap the role to SEND_KEY
    if (siweMessage?.resources?.length === 1) {
      const roleConst =
        StaticWalletAccountLinkSigner.accountLinkedSIWERoleRequestText(
          AccountLinkedRole.SEND_KEY
        )
      siweMessage.resources[0] = `https://xmtp.org/siwe/${roleConst}/secp256k1/${bytesToHex(
        key.keyBytes
      )}`
    } else {
      throw new Error('Expected at one resource')
    }
    key.siweSignature.text = toUtf8Bytes(siweMessage.prepareMessage())
    // Expect this to throw and have "expected address"
    expect(() => {
      newBundle.getLinkedAddress(AccountLinkedRole.SEND_KEY)
    }).toThrow(/Expected address.+/)
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
