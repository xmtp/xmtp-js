import Client from '../src/Client'
import { Contacts } from '../src/Contacts'
import { newWallet } from './helpers'

const alice = newWallet()
const bob = newWallet()
const carol = newWallet()

let aliceClient: Client
let bobClient: Client
let carolClient: Client

describe('Contacts', () => {
  beforeEach(async () => {
    aliceClient = await Client.create(alice, {
      env: 'local',
    })
    bobClient = await Client.create(bob, {
      env: 'local',
    })
    carolClient = await Client.create(carol, {
      env: 'local',
    })
  })

  it('should initialize with client', async () => {
    expect(aliceClient.contacts).toBeInstanceOf(Contacts)
    expect(aliceClient.contacts.addresses).toBeInstanceOf(Set)
    expect(Array.from(aliceClient.contacts.addresses.keys()).length).toBe(0)
  })

  it('should allow and block addresses', async () => {
    await aliceClient.contacts.allow([bob.address])
    expect(aliceClient.contacts.consentState(bob.address)).toBe('allowed')
    expect(aliceClient.contacts.isAllowed(bob.address)).toBe(true)
    expect(aliceClient.contacts.isBlocked(bob.address)).toBe(false)

    await aliceClient.contacts.block([bob.address])
    expect(aliceClient.contacts.consentState(bob.address)).toBe('blocked')
    expect(aliceClient.contacts.isAllowed(bob.address)).toBe(false)
    expect(aliceClient.contacts.isBlocked(bob.address)).toBe(true)
  })

  it('should allow an address when a conversation is started', async () => {
    const conversation = await aliceClient.conversations.newConversation(
      carol.address
    )

    expect(aliceClient.contacts.consentState(carol.address)).toBe('allowed')
    expect(aliceClient.contacts.isAllowed(carol.address)).toBe(true)
    expect(aliceClient.contacts.isBlocked(carol.address)).toBe(false)

    expect(conversation.isAllowed).toBe(true)
    expect(conversation.isBlocked).toBe(false)
    expect(conversation.consentState).toBe('allowed')
  })

  it('should allow or block an address from a conversation', async () => {
    const conversation = await aliceClient.conversations.newConversation(
      carol.address
    )

    await conversation.block()

    expect(aliceClient.contacts.consentState(carol.address)).toBe('blocked')
    expect(aliceClient.contacts.isAllowed(carol.address)).toBe(false)
    expect(aliceClient.contacts.isBlocked(carol.address)).toBe(true)

    expect(conversation.isAllowed).toBe(false)
    expect(conversation.isBlocked).toBe(true)
    expect(conversation.consentState).toBe('blocked')

    await conversation.allow()

    expect(aliceClient.contacts.consentState(carol.address)).toBe('allowed')
    expect(aliceClient.contacts.isAllowed(carol.address)).toBe(true)
    expect(aliceClient.contacts.isBlocked(carol.address)).toBe(false)

    expect(conversation.isAllowed).toBe(true)
    expect(conversation.isBlocked).toBe(false)
    expect(conversation.consentState).toBe('allowed')
  })

  it('should retrieve consent state', async () => {
    await aliceClient.contacts.block([bob.address])
    await aliceClient.contacts.allow([carol.address])
    await aliceClient.contacts.allow([bob.address])
    await aliceClient.contacts.block([carol.address])
    await aliceClient.contacts.block([bob.address])
    await aliceClient.contacts.allow([carol.address])

    expect(aliceClient.contacts.consentState(bob.address)).toBe('blocked')
    expect(aliceClient.contacts.isAllowed(bob.address)).toBe(false)
    expect(aliceClient.contacts.isBlocked(bob.address)).toBe(true)

    expect(aliceClient.contacts.consentState(carol.address)).toBe('allowed')
    expect(aliceClient.contacts.isAllowed(carol.address)).toBe(true)
    expect(aliceClient.contacts.isBlocked(carol.address)).toBe(false)

    aliceClient = await Client.create(alice, {
      env: 'local',
    })

    expect(aliceClient.contacts.consentState(bob.address)).toBe('unknown')
    expect(aliceClient.contacts.consentState(carol.address)).toBe('unknown')

    await aliceClient.contacts.refreshConsentList()

    expect(aliceClient.contacts.consentState(bob.address)).toBe('blocked')
    expect(aliceClient.contacts.isAllowed(bob.address)).toBe(false)
    expect(aliceClient.contacts.isBlocked(bob.address)).toBe(true)

    expect(aliceClient.contacts.consentState(carol.address)).toBe('allowed')
    expect(aliceClient.contacts.isAllowed(carol.address)).toBe(true)
    expect(aliceClient.contacts.isBlocked(carol.address)).toBe(false)
  })
})
