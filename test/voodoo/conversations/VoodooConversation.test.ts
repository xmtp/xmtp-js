import { buildDirectMessageTopic } from '../../../src/utils'
import {
  Client,
  Compression,
  ContentTypeFallback,
  ContentTypeId,
  ContentTypeText,
} from '../../../src'
import { default as VoodooClient } from '../../../src/voodoo/VoodooClient'
import { VoodooContact } from '../../../src/voodoo/types'
import {
  VoodooConversation,
  VoodooConversations,
} from '../../../src/voodoo/conversations'
import { SortDirection } from '../../../src/ApiClient'
import { sleep } from '../../../src/utils'
import {
  multipleLocalHostVoodooClients,
  newLocalHostVoodooClient,
  waitForUserContact,
} from '../helpers'

describe('conversation', () => {
  let alice: VoodooClient
  let bob: VoodooClient

  describe('voodoo', () => {
    it('v3 conversation', async () => {
      alice = await newLocalHostVoodooClient()
      bob = await newLocalHostVoodooClient()
      await waitForUserContact(alice, alice)
      await waitForUserContact(bob, bob)

      expect(await bob.getUserContactFromNetwork(alice.address)).toBeInstanceOf(
        VoodooContact
      )
      expect(await alice.getUserContactFromNetwork(bob.address)).toBeInstanceOf(
        VoodooContact
      )

      const ac = await alice.conversations.newConversation(bob.address)
      if (!(ac instanceof VoodooConversation)) {
        fail()
      }

      // Check that invite is processed by bob
      const bcs = await bob.conversations.list()
      expect(bcs).toHaveLength(1)

      const bc = bcs[0]

      // Alice sends a message
      await ac.send('hi')
      // This should show up in alice's inbox
      const ams = await ac.messages()
      expect(ams).toHaveLength(1)
      expect(ams[0].plaintext).toBe('hi')
      await sleep(100)

      // It should also show up in Bob's inbox
      const bms = await bc.messages()
      expect(bms).toHaveLength(1)
      expect(bms[0].plaintext).toBe('hi')

      // Blast a few more messages from both sides
      await bc.send('hi back')
      await sleep(100)
      await ac.send('hi back to you too')
      await sleep(100)

      // Check that they show up in both inboxes
      const ams2 = await ac.messages()
      const bms2 = await bc.messages()

      expect(ams2).toHaveLength(3)
      expect(bms2).toHaveLength(3)

      const expected_plaintexts = ['hi', 'hi back', 'hi back to you too']
      const expected_senders = [alice.address, bob.address, alice.address]

      for (let i = 0; i < 3; i++) {
        expect(ams2[i].plaintext).toBe(expected_plaintexts[i])
        expect(ams2[i].plaintext).toBe(bms2[i].plaintext)

        expect(ams2[i].senderAddress).toBe(expected_senders[i])
        expect(ams2[i].senderAddress).toBe(bms2[i].senderAddress)
      }
    })

    it('1 to N fanout', async () => {
      // Setup alice
      alice = await newLocalHostVoodooClient()
      await waitForUserContact(alice, alice)
      // Create 5 bob clients
      const allBobs = await multipleLocalHostVoodooClients(5)
      expect(
        await alice.getUserContactFromNetwork(alice.address)
      ).toBeInstanceOf(VoodooContact)
      // Wait for all of the bobs to have published their contact bundles
      for (const b of allBobs) {
        await waitForUserContact(alice, b)
      }

      const bobOne = allBobs[0]

      // This should create 5 invites
      const ac = await alice.conversations.newConversation(bobOne.address)
      if (!(ac instanceof VoodooConversation)) {
        fail()
      }

      let bobConvos = []

      // Check that invite is processed by bob
      for (const b of allBobs) {
        const bcs = await b.conversations.list()
        expect(bcs).toHaveLength(1)
        bobConvos.push(bcs[0])
      }

      // Alice sends a message
      await ac.send('hi')
      // This should show up in alice's inbox
      const ams = await ac.messages()
      expect(ams).toHaveLength(1)
      expect(ams[0].plaintext).toBe('hi')
      await sleep(100)

      // It should also show up in all Bob's inboxes
      for (const bc of bobConvos) {
        const bms = await bc.messages()
        expect(bms).toHaveLength(1)
        expect(bms[0].plaintext).toBe('hi')
      }

      // Send a message from each bob with bob index
      for (const [i, bc] of bobConvos.entries()) {
        await bc.send('hi back: ' + i)
        await sleep(100)
      }

      // Expect Alice to have 6 messages
      const ams2 = await ac.messages()
      expect(ams2).toHaveLength(6)
      for (let i = 1; i < 6; i++) {
        expect(ams2[i].plaintext).toBe('hi back: ' + (i - 1))
      }
    })

    it('confirm self fanout', async () => {
      // Setup alice
      alice = await newLocalHostVoodooClient()
      await waitForUserContact(alice, alice)
      // Create 5 bob clients
      const allBobs = await multipleLocalHostVoodooClients(5)
      expect(
        await alice.getUserContactFromNetwork(alice.address)
      ).toBeInstanceOf(VoodooContact)
      // Wait for all of the bobs to have published their contact bundles
      for (const b of allBobs) {
        await waitForUserContact(alice, b)
      }

      const bobOne = allBobs[0]
      // Have bobOne start a conversation with alice
      const bc = await bobOne.conversations.newConversation(alice.address)

      // Now send a message
      await bc.send('hi')
      await sleep(100)

      // Alice should have one conversation and one message
      const acs = await alice.conversations.list()
      expect(acs).toHaveLength(1)
      const ac = acs[0]
      const ams = await ac.messages()
      expect(ams).toHaveLength(1)
      expect(ams[0].plaintext).toBe('hi')

      // All bobs should also have one conversation and one message
      for (const b of allBobs) {
        const bcs = await b.conversations.list()
        expect(bcs).toHaveLength(1)
        const bc = bcs[0]
        const bms = await bc.messages()
        expect(bms).toHaveLength(1)
        expect(bms[0].plaintext).toBe('hi')
      }
    })
  })
})
