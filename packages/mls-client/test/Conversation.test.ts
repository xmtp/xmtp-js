import { ContentTypeText } from '@xmtp/xmtp-js'
import { describe, expect, it } from 'vitest'
import { createRegisteredClient, createUser } from '@test/helpers'

describe('Conversation', () => {
  it('should update conversation name', async () => {
    const user1 = createUser()
    const user2 = createUser()
    const client1 = await createRegisteredClient(user1)
    const client2 = await createRegisteredClient(user2)
    const conversation = await client1.conversations.newConversation([
      user2.account.address,
    ])
    const newName = 'foo'
    await conversation.updateName(newName)
    expect(conversation.name).toBe(newName)
    const messages = conversation.messages()
    expect(messages.length).toBe(2)

    await client2.conversations.sync()
    const conversations = await client2.conversations.list()
    expect(conversations.length).toBe(1)

    const conversation2 = conversations[0]
    expect(conversation2).toBeDefined()
    await conversation2.sync()
    expect(conversation2.id).toBe(conversation.id)
    expect(conversation2.name).toBe(newName)
    expect(conversation2.messages().length).toBe(1)
  })

  it('should add and remove members', async () => {
    const user1 = createUser()
    const user2 = createUser()
    const user3 = createUser()
    const client1 = await createRegisteredClient(user1)
    const client2 = await createRegisteredClient(user2)
    const client3 = await createRegisteredClient(user3)
    const conversation = await client1.conversations.newConversation([
      user2.account.address,
    ])

    const memberInboxIds = conversation.members.map((member) => member.inboxId)
    expect(memberInboxIds).toContain(client1.inboxId)
    expect(memberInboxIds).toContain(client2.inboxId)
    expect(memberInboxIds).not.toContain(client3.inboxId)

    await conversation.addMembers([user3.account.address])
    expect(conversation.members.length).toBe(3)

    const memberInboxIds2 = conversation.members.map((member) => member.inboxId)
    expect(memberInboxIds2).toContain(client1.inboxId)
    expect(memberInboxIds2).toContain(client2.inboxId)
    expect(memberInboxIds2).toContain(client3.inboxId)

    await conversation.removeMembers([user2.account.address])
    expect(conversation.members.length).toBe(2)

    const memberInboxIds3 = conversation.members.map((member) => member.inboxId)
    expect(memberInboxIds3).toContain(client1.inboxId)
    expect(memberInboxIds3).not.toContain(client2.inboxId)
    expect(memberInboxIds3).toContain(client3.inboxId)
  })

  it('should add and remove members by inbox id', async () => {
    const user1 = createUser()
    const user2 = createUser()
    const user3 = createUser()
    const client1 = await createRegisteredClient(user1)
    const client2 = await createRegisteredClient(user2)
    const client3 = await createRegisteredClient(user3)
    const conversation = await client1.conversations.newConversation([
      user2.account.address,
    ])

    const memberInboxIds = conversation.members.map((member) => member.inboxId)
    expect(memberInboxIds).toContain(client1.inboxId)
    expect(memberInboxIds).toContain(client2.inboxId)
    expect(memberInboxIds).not.toContain(client3.inboxId)

    await conversation.addMembersByInboxId([client3.inboxId])
    expect(conversation.members.length).toBe(3)

    const memberInboxIds2 = conversation.members.map((member) => member.inboxId)
    expect(memberInboxIds2).toContain(client1.inboxId)
    expect(memberInboxIds2).toContain(client2.inboxId)
    expect(memberInboxIds2).toContain(client3.inboxId)

    await conversation.removeMembersByInboxId([client2.inboxId])
    expect(conversation.members.length).toBe(2)

    const memberInboxIds3 = conversation.members.map((member) => member.inboxId)
    expect(memberInboxIds3).toContain(client1.inboxId)
    expect(memberInboxIds3).not.toContain(client2.inboxId)
    expect(memberInboxIds3).toContain(client3.inboxId)
  })

  it('should send and list messages', async () => {
    const user1 = createUser()
    const user2 = createUser()
    const client1 = await createRegisteredClient(user1)
    const client2 = await createRegisteredClient(user2)
    const conversation = await client1.conversations.newConversation([
      user2.account.address,
    ])

    const text = 'gm'
    await conversation.send(text, ContentTypeText)

    const messages = conversation.messages()
    expect(messages.length).toBe(2)
    expect(messages[1].content).toBe(text)

    await client2.conversations.sync()
    const conversations = await client2.conversations.list()
    expect(conversations.length).toBe(1)

    const conversation2 = conversations[0]
    expect(conversation2).toBeDefined()
    await conversation2.sync()
    expect(conversation2.id).toBe(conversation.id)

    const messages2 = conversation2.messages()
    expect(messages2.length).toBe(1)
    expect(messages2[0].content).toBe(text)
  })

  it('should stream messages', async () => {
    const user1 = createUser()
    const user2 = createUser()
    const client1 = await createRegisteredClient(user1)
    const client2 = await createRegisteredClient(user2)
    const conversation = await client1.conversations.newConversation([
      user2.account.address,
    ])

    await client2.conversations.sync()
    const conversation2 = await client2.conversations.list()
    expect(conversation2.length).toBe(1)
    expect(conversation2[0].id).toBe(conversation.id)

    const stream = conversation2[0].stream()

    await conversation.send('gm', ContentTypeText)
    await conversation.send('gm2', ContentTypeText)

    let count = 0
    for await (const message of stream) {
      count++
      expect(message).toBeDefined()
      if (count === 1) {
        expect(message!.content).toBe('gm')
      }
      if (count === 2) {
        expect(message!.content).toBe('gm2')
        break
      }
    }
    stream.stop()
  })

  it('should add and remove admins', async () => {
    const user1 = createUser()
    const user2 = createUser()
    const client1 = await createRegisteredClient(user1)
    const client2 = await createRegisteredClient(user2)
    const conversation = await client1.conversations.newConversation([
      user2.account.address,
    ])

    expect(conversation.isAdmin(client1.inboxId)).toBe(true)
    expect(conversation.isAdmin(client2.inboxId)).toBe(false)
    expect(conversation.admins.length).toBe(1)
    expect(conversation.admins).toContain(client1.inboxId)

    await conversation.addAdmin(client2.inboxId)
    expect(conversation.isAdmin(client2.inboxId)).toBe(true)
    expect(conversation.admins.length).toBe(2)
    expect(conversation.admins).toContain(client1.inboxId)
    expect(conversation.admins).toContain(client2.inboxId)

    await conversation.removeAdmin(client2.inboxId)
    expect(conversation.isAdmin(client2.inboxId)).toBe(false)
    expect(conversation.admins.length).toBe(1)
    expect(conversation.admins).toContain(client1.inboxId)
  })

  it('should add and remove super admins', async () => {
    const user1 = createUser()
    const user2 = createUser()
    const client1 = await createRegisteredClient(user1)
    const client2 = await createRegisteredClient(user2)
    const conversation = await client1.conversations.newConversation([
      user2.account.address,
    ])

    expect(conversation.isSuperAdmin(client1.inboxId)).toBe(true)
    expect(conversation.isSuperAdmin(client2.inboxId)).toBe(false)
    expect(conversation.superAdmins.length).toBe(1)
    expect(conversation.superAdmins).toContain(client1.inboxId)

    await conversation.addSuperAdmin(client2.inboxId)
    expect(conversation.isSuperAdmin(client2.inboxId)).toBe(true)
    expect(conversation.superAdmins.length).toBe(2)
    expect(conversation.superAdmins).toContain(client1.inboxId)
    expect(conversation.superAdmins).toContain(client2.inboxId)

    await conversation.removeSuperAdmin(client2.inboxId)
    expect(conversation.isSuperAdmin(client2.inboxId)).toBe(false)
    expect(conversation.superAdmins.length).toBe(1)
    expect(conversation.superAdmins).toContain(client1.inboxId)
  })
})
