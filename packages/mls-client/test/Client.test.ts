import { describe, expect, it } from 'vitest'
import { createClient, createRegisteredClient, createUser } from '@test/helpers'

describe('Client', () => {
  it('should create a client', async () => {
    const user = createUser()
    const client = await createClient(user)
    expect(client.accountAddress).toBe(user.account.address)
    expect(client.isRegistered).toBe(false)
    expect(client.signatureText).not.toBe(null)
    expect(client.inboxId).toBeDefined()
    expect(client.installationId).toBeDefined()
  })

  it('should register an identity', async () => {
    const user = createUser()
    await createRegisteredClient(user)
    const client2 = await createRegisteredClient(user)
    expect(client2.isRegistered).toBe(true)
    expect(await client2.signatureText()).toBe(null)
    expect(await client2.canMessage([user.account.address])).toEqual({
      [user.account.address.toLowerCase()]: true,
    })
  })

  it('should get an inbox ID from an address', async () => {
    const user = createUser()
    const client = await createRegisteredClient(user)
    const inboxId = await client.getInboxIdByAddress(user.account.address)
    expect(inboxId).toBe(client.inboxId)
  })

  it('should return the correct inbox state', async () => {
    const user = createUser()
    const client = await createRegisteredClient(user)
    const inboxState = await client.inboxState()
    expect(inboxState.inboxId).toBe(client.inboxId)
    expect(inboxState.installations.map((install) => install.id)).toEqual([
      client.installationId,
    ])
    expect(inboxState.accountAddresses).toEqual([
      user.account.address.toLowerCase(),
    ])
    expect(inboxState.recoveryAddress).toBe(user.account.address.toLowerCase())
  })
})
