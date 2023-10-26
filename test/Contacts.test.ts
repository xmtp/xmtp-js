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
  beforeAll(async () => {
    aliceClient = await Client.create(alice, {
      env: 'local',
      enableConsentList: true,
    })
    bobClient = await Client.create(bob, {
      env: 'local',
      enableConsentList: true,
    })
    carolClient = await Client.create(carol, {
      env: 'local',
      enableConsentList: true,
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

    await aliceClient.contacts.block([carol.address])
    expect(aliceClient.contacts.consentState(carol.address)).toBe('blocked')
    expect(aliceClient.contacts.isAllowed(carol.address)).toBe(false)
    expect(aliceClient.contacts.isBlocked(carol.address)).toBe(true)

    await aliceClient.contacts.block([bob.address])
    expect(aliceClient.contacts.consentState(bob.address)).toBe('blocked')
    expect(aliceClient.contacts.isAllowed(bob.address)).toBe(false)
    expect(aliceClient.contacts.isBlocked(bob.address)).toBe(true)
  })

  it('should retrieve consent state', async () => {
    aliceClient = await Client.create(alice, {
      env: 'local',
      enableConsentList: true,
    })

    expect(aliceClient.contacts.consentState(bob.address)).toBe('unknown')
    expect(aliceClient.contacts.consentState(carol.address)).toBe('unknown')

    await aliceClient.contacts.refreshConsentList()

    expect(aliceClient.contacts.consentState(carol.address)).toBe('blocked')
    expect(aliceClient.contacts.isAllowed(carol.address)).toBe(false)
    expect(aliceClient.contacts.isBlocked(carol.address)).toBe(true)
    expect(aliceClient.contacts.consentState(bob.address)).toBe('blocked')
    expect(aliceClient.contacts.isAllowed(bob.address)).toBe(false)
    expect(aliceClient.contacts.isBlocked(bob.address)).toBe(true)
  })
})
