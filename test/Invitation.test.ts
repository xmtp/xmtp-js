import { InvitationV1 } from './../src/Invitation'
import { PrivateKeyBundleV2 } from './../src/crypto/PrivateKeyBundle'
import {
  SealedInvitation,
  SealedInvitationV1,
  SealedInvitationHeaderV1,
} from '../src/Invitation'
import { newWallet } from './helpers'
import { crypto } from '../src/crypto/encryption'
import Long from 'long'
import Ciphertext from '../src/crypto/Ciphertext'
import { NoMatchingPreKeyError } from '../src/crypto/errors'

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
  let alice: PrivateKeyBundleV2, bob: PrivateKeyBundleV2

  beforeEach(async () => {
    alice = await PrivateKeyBundleV2.generate(newWallet())
    bob = await PrivateKeyBundleV2.generate(newWallet())
  })

  describe('SealedInvitation', () => {
    it('can generate', async () => {
      const invitation = createInvitation()
      const newInvitation = await SealedInvitation.createV1({
        sender: alice,
        recipient: bob.getPublicKeyBundle(),
        created: new Date(),
        invitation,
      })
      // Ensure round trips correctly
      expect(newInvitation.toBytes()).toEqual(
        SealedInvitation.fromBytes(newInvitation.toBytes()).toBytes()
      )
      // Ensure the headers haven't been mangled
      const v1 = newInvitation.v1
      const header = v1.header
      expect(header.sender.equals(alice.getPublicKeyBundle())).toBeTruthy()
      expect(header.recipient.equals(bob.getPublicKeyBundle())).toBeTruthy()

      // Ensure alice can decrypt the invitation
      const aliceInvite = await v1.getInvitation(alice)
      expect(aliceInvite.topic).toEqual(invitation.topic)
      expect(aliceInvite.aes256GcmHkdfSha256.keyMaterial).toEqual(
        invitation.aes256GcmHkdfSha256.keyMaterial
      )

      // Ensure bob can decrypt the invitation
      const bobInvite = await v1.getInvitation(bob)
      expect(bobInvite.topic).toEqual(invitation.topic)
      expect(bobInvite.aes256GcmHkdfSha256.keyMaterial).toEqual(
        invitation.aes256GcmHkdfSha256.keyMaterial
      )
    })

    it('throws when bad data goes in', async () => {
      const invitation = createInvitation()
      const charlie = await PrivateKeyBundleV2.generate(newWallet())
      const sealedInvitationWithWrongSender = await SealedInvitation.createV1({
        sender: charlie,
        recipient: bob.getPublicKeyBundle(),
        created: new Date(),
        invitation,
      })
      expect(
        sealedInvitationWithWrongSender.v1.getInvitation(alice)
      ).rejects.toThrow(NoMatchingPreKeyError)

      expect(() => {
        const sealedInvite = new SealedInvitation({
          v1: { headerBytes: Uint8Array.from([123]), ciphertext: undefined },
        })
      }).toThrow()
    })
  })

  describe('SealedInvitationV1', () => {
    it('can be created with valid inputs', () => {
      const header = new SealedInvitationHeaderV1({
        sender: alice.getPublicKeyBundle(),
        recipient: bob.getPublicKeyBundle(),
        createdNs: new Long(12),
      })
      const ciphertext = new Ciphertext({
        aes256GcmHkdfSha256: {
          hkdfSalt: crypto.getRandomValues(new Uint8Array(32)),
          gcmNonce: crypto.getRandomValues(new Uint8Array(12)),
          payload: crypto.getRandomValues(new Uint8Array(16)),
        },
      })
      const invite = new SealedInvitationV1({
        headerBytes: header.toBytes(),
        ciphertext: ciphertext,
      })

      expect(
        invite.header.sender.equals(alice.getPublicKeyBundle())
      ).toBeTruthy()
      expect(
        invite.header.recipient.equals(bob.getPublicKeyBundle())
      ).toBeTruthy()
      expect(invite.header.sender.equals(bob.getPublicKeyBundle())).toBeFalsy()

      // Round trips
      expect(invite.toBytes()).toEqual(
        SealedInvitationV1.fromBytes(invite.toBytes()).toBytes()
      )
      expect(
        SealedInvitationV1.fromBytes(invite.toBytes()).header.sender.equals(
          alice.getPublicKeyBundle()
        )
      ).toBeTruthy()
    })

    it('fails to create with invalid inputs', () => {
      expect(
        () =>
          new SealedInvitationV1({
            headerBytes: new Uint8Array(),
            ciphertext: undefined,
          })
      ).toThrow('Missing header bytes')

      const header = new SealedInvitationHeaderV1({
        sender: alice.getPublicKeyBundle(),
        recipient: bob.getPublicKeyBundle(),
        createdNs: new Long(12),
      })
      expect(
        () =>
          new SealedInvitationV1({
            headerBytes: header.toBytes(),
            ciphertext: undefined,
          })
      ).toThrow('Missing ciphertext')
    })
  })

  describe('SealedInvitationHeaderV1', () => {
    it('can create with valid inputs', () => {
      const header = new SealedInvitationHeaderV1({
        sender: alice.getPublicKeyBundle(),
        recipient: bob.getPublicKeyBundle(),
        createdNs: new Long(123),
      })

      expect(header.recipient.equals(bob.getPublicKeyBundle())).toBeTruthy()
      expect(header.sender.equals(alice.getPublicKeyBundle())).toBeTruthy()
      expect(header.createdNs.toString()).toEqual(new Long(123).toString())
    })

    it('fails to create with invalid inputs', () => {
      expect(
        () =>
          new SealedInvitationHeaderV1({
            sender: undefined,
            recipient: bob.getPublicKeyBundle(),
            createdNs: new Long(12),
          })
      ).toThrow('Missing sender')
      expect(
        () =>
          new SealedInvitationHeaderV1({
            sender: alice.getPublicKeyBundle(),
            recipient: undefined,
            createdNs: new Long(12),
          })
      ).toThrow('Missing recipient')
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
