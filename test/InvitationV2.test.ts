import {
  InvitationV1,
  SealedInvitation,
  SealedInvitationHeaderV2,
  SealedInvitationV2,
} from '../src/Invitation'
import {
  PrivateKeyBundleV2,
  PrivateKeyBundleV3,
} from '../src/crypto/PrivateKeyBundle'
import { newWallet } from './helpers'
import { crypto } from '../src/crypto/encryption'
import Ciphertext from '../src/crypto/Ciphertext'
import { AccountLinkedRole } from '../src/crypto/Signature'
import { Wallet } from '@ethersproject/wallet'

const createInvitation = (): InvitationV1 => {
  return new InvitationV1({
    topic: crypto.getRandomValues(new Uint8Array(32)).toString(),
    context: undefined,
    aes256GcmHkdfSha256: {
      keyMaterial: crypto.getRandomValues(new Uint8Array(32)),
    },
  })
}

describe('Invitations', () => {
  let aliceWallet: Wallet,
    bobWallet: Wallet,
    aliceInboxBundleV2: PrivateKeyBundleV2,
    aliceInboxBundleV3: PrivateKeyBundleV3,
    aliceSendBundle: PrivateKeyBundleV3,
    bobInboxBundleV2: PrivateKeyBundleV2,
    bobInboxBundleV3: PrivateKeyBundleV3,
    bobSendBundle: PrivateKeyBundleV3

  beforeEach(async () => {
    aliceWallet = newWallet()
    bobWallet = newWallet()
    aliceInboxBundleV2 = await PrivateKeyBundleV2.generate(aliceWallet)
    aliceInboxBundleV3 = await PrivateKeyBundleV3.generate(
      aliceWallet,
      AccountLinkedRole.INBOX_KEY
    )
    aliceSendBundle = await PrivateKeyBundleV3.generate(
      aliceWallet,
      AccountLinkedRole.SEND_KEY
    )
    bobInboxBundleV2 = await PrivateKeyBundleV2.generate(bobWallet)
    bobInboxBundleV3 = await PrivateKeyBundleV3.generate(
      bobWallet,
      AccountLinkedRole.INBOX_KEY
    )
    bobSendBundle = await PrivateKeyBundleV3.generate(
      bobWallet,
      AccountLinkedRole.SEND_KEY
    )
  })

  describe('SealedInvitation', () => {
    it.each([
      () => bobInboxBundleV3,
      // () =>
      //   PrivateKeyBundleV3.fromLegacyBundle(
      //     bobInboxBundleV2,
      //     AccountLinkedRole.INBOX_KEY
      //   ),
    ])('can generate for others', async (bobInboxBundleFetcher) => {
      const bobInboxBundle = bobInboxBundleFetcher()
      const invitation = createInvitation()
      const newInvitation = await SealedInvitation.createV2({
        sendKeyBundle: aliceSendBundle,
        inboxKeyBundle: bobInboxBundle.getPublicKeyBundle(),
        peerAddress: bobWallet.address,
        created: new Date(),
        invitation,
      })
      // Ensure round trips correctly
      expect(newInvitation.toBytes()).toEqual(
        SealedInvitation.fromBytes(newInvitation.toBytes()).toBytes()
      )
      // Ensure the headers haven't been mangled
      let v2 = newInvitation.v2!
      const header = v2.header
      expect(
        header.sendKeyBundle.getLinkedAddress(AccountLinkedRole.SEND_KEY)
      ).toEqual(aliceWallet.address)
      expect(
        header.inboxKeyBundle.getLinkedAddress(AccountLinkedRole.INBOX_KEY)
      ).toEqual(bobWallet.address)
      expect(header.getPeerAddress(bobWallet.address)).toEqual(
        aliceWallet.address
      )

      // Ensure bob can decrypt the invitation
      const bobInvite = await v2.getInvitation(bobInboxBundle)
      expect(bobInvite.topic).toEqual(invitation.topic)
      expect(bobInvite.aes256GcmHkdfSha256.keyMaterial).toEqual(
        invitation.aes256GcmHkdfSha256.keyMaterial
      )

      // Verify alice cannot decrypt the invitation via her inbox key
      v2 = new SealedInvitationV2(v2) // clear any caching
      await expect(v2.getInvitation(aliceInboxBundleV3)).rejects.toThrow()
    })

    it.each([
      () => aliceInboxBundleV3,
      () =>
        PrivateKeyBundleV3.fromLegacyBundle(
          aliceInboxBundleV2,
          AccountLinkedRole.INBOX_KEY
        ),
    ])('can generate for self', async (aliceInboxBundleFetcher) => {
      const aliceInboxBundle = aliceInboxBundleFetcher()
      const invitation = createInvitation()
      const newInvitation = await SealedInvitation.createV2({
        sendKeyBundle: aliceSendBundle,
        inboxKeyBundle: aliceInboxBundle.getPublicKeyBundle(),
        peerAddress: bobWallet.address,
        created: new Date(),
        invitation,
      })
      // Ensure round trips correctly
      expect(newInvitation.toBytes()).toEqual(
        SealedInvitation.fromBytes(newInvitation.toBytes()).toBytes()
      )
      // Ensure the headers haven't been mangled
      let v2 = newInvitation.v2!
      const header = v2.header
      expect(
        header.sendKeyBundle.getLinkedAddress(AccountLinkedRole.SEND_KEY)
      ).toEqual(aliceWallet.address)
      expect(
        header.inboxKeyBundle.getLinkedAddress(AccountLinkedRole.INBOX_KEY)
      ).toEqual(aliceWallet.address)
      expect(header.getPeerAddress(aliceWallet.address)).toEqual(
        bobWallet.address
      )

      // Ensure alice can decrypt the invitation
      const aliceInvite = await v2.getInvitation(aliceInboxBundle)
      expect(aliceInvite.topic).toEqual(invitation.topic)
      expect(aliceInvite.aes256GcmHkdfSha256.keyMaterial).toEqual(
        invitation.aes256GcmHkdfSha256.keyMaterial
      )

      // Verify bob cannot decrypt the invitation via his inbox key
      v2 = new SealedInvitationV2(v2) // clear any caching
      await expect(v2.getInvitation(bobInboxBundleV3)).rejects.toThrow()
    })

    it('throws when bad data goes in', () => {
      expect(() => {
        const sealedInvite = new SealedInvitation({
          v1: undefined,
          v2: { headerBytes: Uint8Array.from([123]), ciphertext: undefined },
        })
      }).toThrow()
    })
  })

  describe('SealedInvitationV2', () => {
    it('can be created with valid inputs', () => {
      const header = SealedInvitationHeaderV2.create(
        aliceSendBundle,
        bobInboxBundleV3.getPublicKeyBundle(),
        bobWallet.address,
        new Date('Tue Mar 21 2023 14:43:43 GMT-0700')
      )
      const ciphertext = new Ciphertext({
        aes256GcmHkdfSha256: {
          hkdfSalt: crypto.getRandomValues(new Uint8Array(32)),
          gcmNonce: crypto.getRandomValues(new Uint8Array(12)),
          payload: crypto.getRandomValues(new Uint8Array(16)),
        },
      })
      const invite = new SealedInvitationV2({
        headerBytes: header.toBytes(),
        ciphertext: ciphertext,
      })

      expect(
        invite.header.sendKeyBundle.equals(aliceSendBundle.getPublicKeyBundle())
      ).toBeTruthy()
      expect(
        invite.header.inboxKeyBundle.equals(
          bobInboxBundleV3.getPublicKeyBundle()
        )
      ).toBeTruthy()
      expect(
        invite.header.sendKeyBundle.equals(
          bobInboxBundleV3.getPublicKeyBundle()
        )
      ).toBeFalsy()

      // Round trips
      expect(invite.toBytes()).toEqual(
        SealedInvitationV2.fromBytes(invite.toBytes()).toBytes()
      )
      expect(
        SealedInvitationV2.fromBytes(
          invite.toBytes()
        ).header.sendKeyBundle.equals(aliceSendBundle.getPublicKeyBundle())
      ).toBeTruthy()
    })

    it('fails to create with invalid inputs', () => {
      expect(
        () =>
          new SealedInvitationV2({
            headerBytes: new Uint8Array(),
            ciphertext: undefined,
          })
      ).toThrow('Missing header bytes')

      const header = SealedInvitationHeaderV2.create(
        aliceSendBundle,
        bobInboxBundleV3.getPublicKeyBundle(),
        bobWallet.address,
        new Date('Tue Mar 21 2023 14:43:43 GMT-0700')
      )
      expect(
        () =>
          new SealedInvitationV2({
            headerBytes: header.toBytes(),
            ciphertext: undefined,
          })
      ).toThrow('Missing ciphertext')
    })
  })

  describe('SealedInvitationHeaderV2', () => {
    it('can create for others with valid inputs', () => {
      const header = SealedInvitationHeaderV2.create(
        aliceSendBundle,
        bobInboxBundleV3.getPublicKeyBundle(),
        bobWallet.address,
        new Date('Tue Mar 21 2023 14:43:43 GMT-0700')
      )
      expect(header.peerHeader).toBeTruthy()
      expect(header.selfHeader).toBeFalsy()
      expect(
        header.sendKeyBundle.equals(aliceSendBundle.getPublicKeyBundle())
      ).toBeTruthy()
      expect(
        header.inboxKeyBundle.equals(bobInboxBundleV3.getPublicKeyBundle())
      ).toBeTruthy()
      expect(() => {
        header.getPeerAddress(aliceWallet.address)
      }).toThrow()
      expect(header.getPeerAddress(bobWallet.address)).toEqual(
        aliceWallet.address
      )
    })

    it('can create for self with valid inputs', () => {
      const header = SealedInvitationHeaderV2.create(
        aliceSendBundle,
        aliceInboxBundleV3.getPublicKeyBundle(),
        bobWallet.address,
        new Date('Tue Mar 21 2023 14:43:43 GMT-0700')
      )
      expect(header.selfHeader).toBeTruthy()
      expect(header.peerHeader).toBeFalsy()
      expect(
        header.sendKeyBundle.equals(aliceSendBundle.getPublicKeyBundle())
      ).toBeTruthy()
      expect(
        header.inboxKeyBundle.equals(aliceInboxBundleV3.getPublicKeyBundle())
      ).toBeTruthy()
      expect(header.getPeerAddress(aliceWallet.address)).toEqual(
        bobWallet.address
      )
      expect(() => {
        header.getPeerAddress(bobWallet.address)
      }).toThrow()
    })
  })

  describe('InvitationV1', () => {
    it('can create with valid inputs', () => {
      const keyMaterial = crypto.getRandomValues(new Uint8Array(32))
      const topic = 'foo'
      const invite = new InvitationV1({
        topic,
        context: undefined,
        aes256GcmHkdfSha256: {
          keyMaterial,
        },
      })

      expect(invite.topic).toEqual(topic)
      expect(invite.aes256GcmHkdfSha256.keyMaterial).toEqual(keyMaterial)

      // Round trips
      expect(invite.toBytes()).toEqual(
        InvitationV1.fromBytes(invite.toBytes()).toBytes()
      )
    })

    it('fails to create with invalid inputs', () => {
      const keyMaterial = crypto.getRandomValues(new Uint8Array(32))
      const topic = 'foo'

      expect(
        () =>
          new InvitationV1({
            topic,
            context: undefined,
            aes256GcmHkdfSha256: { keyMaterial: new Uint8Array() },
          })
      ).toThrow('Missing key material')

      expect(
        () =>
          new InvitationV1({
            topic: '',
            context: undefined,
            aes256GcmHkdfSha256: { keyMaterial },
          })
      ).toThrow('Missing topic')
    })
  })
})
