import { describe, expect, it } from 'vitest'
import { createRegisteredClient, createUser } from '@test/helpers'

describe('Conversations', () => {
  it('should not have initial conversations', async () => {
    const user = createUser()
    const client = await createRegisteredClient(user)
    const conversations = client.conversations.list()
    expect((await conversations).length).toBe(0)
  })

  it('should create a new conversation', async () => {
    const user1 = createUser()
    const user2 = createUser()
    const client1 = await createRegisteredClient(user1)
    const client2 = await createRegisteredClient(user2)
    const conversation = await client1.conversations.newConversation([
      user2.account.address,
    ])
    expect(conversation).toBeDefined()
    expect(conversation.id).toBeDefined()
    expect(conversation.createdAt).toBeDefined()
    expect(conversation.createdAtNs).toBeDefined()
    expect(conversation.isActive).toBe(true)
    expect(conversation.name).toBe('')
    expect(conversation.addedByInboxId).toBe(client1.inboxId)
    expect(conversation.messages().length).toBe(1)
    expect(conversation.members.length).toBe(2)
    const memberInboxIds = conversation.members.map((member) => member.inboxId)
    expect(memberInboxIds).toContain(client1.inboxId)
    expect(memberInboxIds).toContain(client2.inboxId)
    expect(conversation.metadata).toEqual({
      conversationType: 'group',
      creatorInboxId: client1.inboxId,
    })

    const conversations1 = await client1.conversations.list()
    expect(conversations1.length).toBe(1)
    expect(conversations1[0].id).toBe(conversation.id)

    expect((await client2.conversations.list()).length).toBe(0)

    await client2.conversations.sync()

    const conversations2 = await client2.conversations.list()
    expect(conversations2.length).toBe(1)
    expect(conversations2[0].id).toBe(conversation.id)
  })

  it('should stream new conversations', async () => {
    const user1 = createUser()
    const user2 = createUser()
    const user3 = createUser()
    const client1 = await createRegisteredClient(user1)
    const client2 = await createRegisteredClient(user2)
    const client3 = await createRegisteredClient(user3)
    const stream = client3.conversations.stream()
    const conversation1 = await client1.conversations.newConversation([
      user3.account.address,
    ])
    const conversation2 = await client2.conversations.newConversation([
      user3.account.address,
    ])
    let count = 0
    for await (const convo of stream) {
      count++
      expect(convo).toBeDefined()
      if (count === 1) {
        expect(convo!.id).toBe(conversation1.id)
      }
      if (count === 2) {
        expect(convo!.id).toBe(conversation2.id)
        break
      }
    }
    stream.stop()
  })
})
