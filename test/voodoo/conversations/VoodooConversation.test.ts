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

    it('test nxn fanout', async () => {
      // Create 5 alice clients
      const allAlices = await multipleLocalHostVoodooClients(5)
      // Create 5 bob clients
      const allBobs = await multipleLocalHostVoodooClients(5)

      // Assert all have published their contact bundles
      for (const a of allAlices) {
        await waitForUserContact(a, a)
      }
      for (const b of allBobs) {
        await waitForUserContact(b, b)
      }

      const aliceAddress = allAlices[0].address
      const bobAddress = allBobs[0].address

      // Have alice 3 start a conversation with bob
      const ac = await allAlices[3].conversations.newConversation(bobAddress)

      // Now have alice 3 send a single message
      await ac.send('hi')
      await sleep(100)

      // Check all alices and all bobs have 1 conversation and 1 message
      for (const a of allAlices) {
        const acs = await a.conversations.list()
        expect(acs).toHaveLength(1)
        const ac = acs[0]
        const ams = await ac.messages()
        expect(ams).toHaveLength(1)
        expect(ams[0].plaintext).toBe('hi')
        expect(ams[0].senderAddress).toBe(aliceAddress)
      }
      for (const b of allBobs) {
        const bcs = await b.conversations.list()
        expect(bcs).toHaveLength(1)
        const bc = bcs[0]
        const bms = await bc.messages()
        expect(bms).toHaveLength(1)
        expect(bms[0].plaintext).toBe('hi')
        expect(bms[0].senderAddress).toBe(aliceAddress)
      }

      // Now have bob 4 send two messages back, then bob 2 send one message back
      const bob5convos = await allBobs[4].conversations.list()
      const bob5convo = bob5convos[0]
      await bob5convo.send('hi back 1')
      await sleep(100)
      await bob5convo.send('hi back 2')
      await sleep(100)

      const bob2convos = await allBobs[2].conversations.list()
      const bob2convo = bob2convos[0]
      await bob2convo.send('hi back 3')
      await sleep(100)

      // Now have alice 2 send a message
      const alice2convos = await allAlices[2].conversations.list()
      const alice2convo = alice2convos[0]
      await alice2convo.send('final high from alice')
      await sleep(100)

      // Assert that everyone has the same message history
      const expected_plaintexts = [
        'hi',
        'hi back 1',
        'hi back 2',
        'hi back 3',
        'final high from alice',
      ]
      const expected_senders = [
        aliceAddress,
        bobAddress,
        bobAddress,
        bobAddress,
        aliceAddress,
      ]

      for (const a of allAlices) {
        const acs = await a.conversations.list()
        expect(acs).toHaveLength(1)
        const ac = acs[0]
        const ams = await ac.messages()
        expect(ams).toHaveLength(5)
        for (let i = 0; i < 5; i++) {
          expect(ams[i].plaintext).toBe(expected_plaintexts[i])
          expect(ams[i].senderAddress).toBe(expected_senders[i])
        }
      }
      for (const b of allBobs) {
        const bcs = await b.conversations.list()
        expect(bcs).toHaveLength(1)
        const bc = bcs[0]
        const bms = await bc.messages()
        expect(bms).toHaveLength(5)
        for (let i = 0; i < 5; i++) {
          expect(bms[i].plaintext).toBe(expected_plaintexts[i])
          expect(bms[i].senderAddress).toBe(expected_senders[i])
        }
      }
    })

    it('test newConversation for everyone', async () => {
      // Create 5 alice clients
      const allAlices = await multipleLocalHostVoodooClients(5)
      // Create 5 bob clients
      const allBobs = await multipleLocalHostVoodooClients(5)

      // Assert all have published their contact bundles
      for (const a of allAlices) {
        await waitForUserContact(a, a)
      }
      for (const b of allBobs) {
        await waitForUserContact(b, b)
      }

      const aliceAddress = allAlices[0].address
      const bobAddress = allBobs[0].address

      // Have alice 1 start a conversation with bob
      const ac = await allAlices[1].conversations.newConversation(bobAddress)

      // Now have alice 1 send a couple messages
      await ac.send('1')
      await sleep(100)
      await ac.send('2')
      await sleep(100)

      // For all bobs and alices, try to start a new conversation with the other party
      // and assert that the conversation is the same as the one alice 1 started
      // and that the messages are the same
      // and that the messages are in the same order
      for (const a of allAlices) {
        const ac = await a.conversations.newConversation(bobAddress)
        const ams = await ac.messages()
        expect(ams).toHaveLength(2)
        expect(ams[0].plaintext).toBe('1')
        expect(ams[1].plaintext).toBe('2')
        expect(ams[0].senderAddress).toBe(aliceAddress)
        expect(ams[1].senderAddress).toBe(aliceAddress)
      }
      for (const b of allBobs) {
        const bc = await b.conversations.newConversation(aliceAddress)
        const bms = await bc.messages()
        expect(bms).toHaveLength(2)
        expect(bms[0].plaintext).toBe('1')
        expect(bms[1].plaintext).toBe('2')
        expect(bms[0].senderAddress).toBe(aliceAddress)
        expect(bms[1].senderAddress).toBe(aliceAddress)
      }
    })
  })
})
