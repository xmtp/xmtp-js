import { buildDirectMessageTopic } from '../../../src/utils'
import {
  Client,
  Compression,
  ContentTypeFallback,
  ContentTypeId,
  ContentTypeText,
} from '../../../src'
import {
  VoodooContact,
  default as VoodooClient,
} from '../../../src/voodoo/VoodooClient'
import {
  VoodooConversation,
  VoodooConversations,
} from '../../../src/voodoo/conversations'
import { SortDirection } from '../../../src/ApiClient'
import { sleep } from '../../../src/utils'
import { newLocalHostVoodooClient, waitForUserContact } from '../helpers'

describe('conversation', () => {
  let alice: VoodooClient
  let bob: VoodooClient

  describe('voodoo', () => {
    beforeEach(async () => {
      alice = await newLocalHostVoodooClient()
      bob = await newLocalHostVoodooClient()
      await waitForUserContact(alice, alice)
      await waitForUserContact(bob, bob)
    })

    it('v2 conversation', async () => {
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
      expect(ams2).toHaveLength(3)
      expect(ams2[0].plaintext).toBe('hi')
      expect(ams2[1].plaintext).toBe('hi back')
      expect(ams2[2].plaintext).toBe('hi back to you too')

      const bms2 = await bc.messages()
      expect(bms2).toHaveLength(3)
      expect(bms2[0].plaintext).toBe('hi')
      expect(bms2[1].plaintext).toBe('hi back')
      expect(bms2[2].plaintext).toBe('hi back to you too')
    })
  })
})
