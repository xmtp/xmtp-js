import { privatePreferences } from '@xmtp/proto'
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

  it('should allow and deny addresses', async () => {
    await aliceClient.contacts.allow([bob.address])
    expect(aliceClient.contacts.consentState(bob.address)).toBe('allowed')
    expect(aliceClient.contacts.isAllowed(bob.address)).toBe(true)
    expect(aliceClient.contacts.isDenied(bob.address)).toBe(false)

    await aliceClient.contacts.deny([bob.address])
    expect(aliceClient.contacts.consentState(bob.address)).toBe('denied')
    expect(aliceClient.contacts.isAllowed(bob.address)).toBe(false)
    expect(aliceClient.contacts.isDenied(bob.address)).toBe(true)
  })

  it('should allow an address when a conversation is started', async () => {
    const conversation = await aliceClient.conversations.newConversation(
      carol.address
    )

    expect(aliceClient.contacts.consentState(carol.address)).toBe('allowed')
    expect(aliceClient.contacts.isAllowed(carol.address)).toBe(true)
    expect(aliceClient.contacts.isDenied(carol.address)).toBe(false)

    expect(conversation.isAllowed).toBe(true)
    expect(conversation.isDenied).toBe(false)
    expect(conversation.consentState).toBe('allowed')
  })

  it('should allow an address when a conversation has an unknown consent state and a message is sent into it', async () => {
    await aliceClient.conversations.newConversation(carol.address)

    expect(carolClient.contacts.consentState(alice.address)).toBe('unknown')
    expect(carolClient.contacts.isAllowed(carol.address)).toBe(false)
    expect(carolClient.contacts.isDenied(carol.address)).toBe(false)

    const carolConversation = await carolClient.conversations.newConversation(
      alice.address
    )
    expect(carolConversation.consentState).toBe('unknown')
    expect(carolConversation.isAllowed).toBe(false)
    expect(carolConversation.isDenied).toBe(false)

    await carolConversation.send('gm')

    expect(carolConversation.consentState).toBe('allowed')
    expect(carolConversation.isAllowed).toBe(true)
    expect(carolConversation.isDenied).toBe(false)
  })

  it('should allow or deny an address from a conversation', async () => {
    const conversation = await aliceClient.conversations.newConversation(
      carol.address
    )

    await conversation.deny()

    expect(aliceClient.contacts.consentState(carol.address)).toBe('denied')
    expect(aliceClient.contacts.isAllowed(carol.address)).toBe(false)
    expect(aliceClient.contacts.isDenied(carol.address)).toBe(true)

    expect(conversation.isAllowed).toBe(false)
    expect(conversation.isDenied).toBe(true)
    expect(conversation.consentState).toBe('denied')

    await conversation.allow()

    expect(aliceClient.contacts.consentState(carol.address)).toBe('allowed')
    expect(aliceClient.contacts.isAllowed(carol.address)).toBe(true)
    expect(aliceClient.contacts.isDenied(carol.address)).toBe(false)

    expect(conversation.isAllowed).toBe(true)
    expect(conversation.isDenied).toBe(false)
    expect(conversation.consentState).toBe('allowed')
  })

  it('should retrieve consent state', async () => {
    await aliceClient.contacts.deny([bob.address])
    await aliceClient.contacts.allow([carol.address])
    await aliceClient.contacts.allow([bob.address])
    await aliceClient.contacts.deny([carol.address])
    await aliceClient.contacts.deny([bob.address])
    await aliceClient.contacts.allow([carol.address])

    expect(aliceClient.contacts.consentState(bob.address)).toBe('denied')
    expect(aliceClient.contacts.isAllowed(bob.address)).toBe(false)
    expect(aliceClient.contacts.isDenied(bob.address)).toBe(true)

    expect(aliceClient.contacts.consentState(carol.address)).toBe('allowed')
    expect(aliceClient.contacts.isAllowed(carol.address)).toBe(true)
    expect(aliceClient.contacts.isDenied(carol.address)).toBe(false)

    aliceClient = await Client.create(alice, {
      env: 'local',
    })

    expect(aliceClient.contacts.consentState(bob.address)).toBe('unknown')
    expect(aliceClient.contacts.consentState(carol.address)).toBe('unknown')

    await aliceClient.contacts.refreshConsentList()

    expect(aliceClient.contacts.consentState(bob.address)).toBe('denied')
    expect(aliceClient.contacts.isAllowed(bob.address)).toBe(false)
    expect(aliceClient.contacts.isDenied(bob.address)).toBe(true)

    expect(aliceClient.contacts.consentState(carol.address)).toBe('allowed')
    expect(aliceClient.contacts.isAllowed(carol.address)).toBe(true)
    expect(aliceClient.contacts.isDenied(carol.address)).toBe(false)
  })

  it('should stream consent updates', async () => {
    const aliceStream = await aliceClient.contacts.streamConsentList()
    await aliceClient.conversations.newConversation(bob.address)

    let numActions = 0
    const actions: privatePreferences.PrivatePreferencesAction[] = []
    for await (const action of aliceStream) {
      numActions++
      expect(action.block).toBeUndefined()
      expect(action.allow?.walletAddresses).toEqual([bob.address])
      break
    }
    expect(numActions).toBe(1)
    await aliceStream.return()
  })
})
