import Client from './Client'
import { privatePreferences } from '@xmtp/proto'
import { EnvelopeWithMessage, buildUserPrivatePreferencesTopic } from './utils'

export type ConsentState = 'allowed' | 'blocked' | 'unknown'

export type ConsentListEntryType = 'address'

export class ConsentListEntry {
  value: string
  entryType: ConsentListEntryType
  permissionType: ConsentState

  constructor(
    value: string,
    entryType: ConsentListEntryType,
    permissionType: ConsentState
  ) {
    this.value = value
    this.entryType = entryType
    this.permissionType = permissionType
  }

  get key(): string {
    return `${this.entryType}-${this.value}`
  }

  static fromAddress(
    address: string,
    permissionType: ConsentState = 'unknown'
  ): ConsentListEntry {
    return new ConsentListEntry(address, 'address', permissionType)
  }
}

export class ConsentList {
  client: Client
  entries: Map<string, ConsentState>
  private _identifier: string | undefined

  constructor(client: Client) {
    this.entries = new Map<string, ConsentState>()
    this.client = client
  }

  allow(address: string) {
    const entry = ConsentListEntry.fromAddress(address, 'allowed')
    this.entries.set(entry.key, 'allowed')
    return entry
  }

  block(address: string) {
    const entry = ConsentListEntry.fromAddress(address, 'blocked')
    this.entries.set(entry.key, 'blocked')
    return entry
  }

  state(address: string) {
    const entry = ConsentListEntry.fromAddress(address)
    return this.entries.get(entry.key) ?? 'unknown'
  }

  async getIdentifier(): Promise<string> {
    if (!this._identifier) {
      const { identifier } =
        await this.client.keystore.getPrivatePreferencesTopicIdentifier()
      this._identifier = identifier
    }
    return this._identifier
  }

  async load(startTime?: Date) {
    // no startTime, all entries will be fetched
    if (!startTime) {
      // clear existing entries
      this.entries.clear()
    }
    const identifier = await this.getIdentifier()
    const contentTopic = buildUserPrivatePreferencesTopic(identifier)

    const messages = await this.client.listEnvelopes(
      contentTopic,
      async ({ message }: EnvelopeWithMessage) => message,
      {
        startTime,
      }
    )

    // decrypt messages
    const { responses } = await this.client.keystore.selfDecrypt({
      requests: messages.map((message) => ({ payload: message })),
    })

    // decoded actions
    const actions = responses.reduce((result, response) => {
      return response.result?.decrypted
        ? result.concat(
            privatePreferences.PrivatePreferencesAction.decode(
              response.result.decrypted
            )
          )
        : result
    }, [] as privatePreferences.PrivatePreferencesAction[])

    // update consent list entries
    actions.forEach((action) => {
      action.allow?.walletAddresses.forEach((address) => {
        this.allow(address)
      })
      action.block?.walletAddresses.forEach((address) => {
        this.block(address)
      })
    })
  }

  async publish(entries: ConsentListEntry[]) {
    const identifier = await this.getIdentifier()

    // encoded actions
    const actions = entries.reduce((result, entry) => {
      // only handle address entries for now
      if (entry.entryType === 'address') {
        const action: privatePreferences.PrivatePreferencesAction = {
          allow:
            entry.permissionType === 'allowed'
              ? {
                  walletAddresses: [entry.value],
                }
              : undefined,
          block:
            entry.permissionType === 'blocked'
              ? {
                  walletAddresses: [entry.value],
                }
              : undefined,
        }
        return result.concat(
          privatePreferences.PrivatePreferencesAction.encode(action).finish()
        )
      }
      return result
    }, [] as Uint8Array[])

    const { responses } = await this.client.keystore.selfEncrypt({
      requests: actions.map((action) => ({ payload: action })),
    })

    // encrypted messages
    const messages = responses.reduce((result, response) => {
      return response.result?.encrypted
        ? result.concat(response.result?.encrypted)
        : result
    }, [] as Uint8Array[])

    const contentTopic = buildUserPrivatePreferencesTopic(identifier)
    const timestamp = new Date()

    // envelopes to publish
    const envelopes = messages.map((message) => ({
      contentTopic,
      message,
      timestamp,
    }))

    await this.client.publishEnvelopes(envelopes)
  }
}

export class Contacts {
  /**
   * Addresses that the client has connected to
   */
  addresses: Set<string>
  /**
   * XMTP client
   */
  client: Client
  /**
   * The last time the consent list was synced
   */
  lastSyncedAt?: Date
  private consentList: ConsentList

  constructor(client: Client) {
    this.addresses = new Set<string>()
    this.consentList = new ConsentList(client)
    this.client = client
  }

  async loadConsentList(startTime?: Date) {
    this.lastSyncedAt = new Date()
    await this.consentList.load(startTime)
  }

  async refreshConsentList() {
    await this.loadConsentList()
  }

  isAllowed(address: string) {
    return this.consentList.state(address) === 'allowed'
  }

  isBlocked(address: string) {
    return this.consentList.state(address) === 'blocked'
  }

  consentState(address: string) {
    return this.consentList.state(address)
  }

  async allow(addresses: string[]) {
    await this.consentList.publish(
      addresses.map((address) => this.consentList.allow(address))
    )
  }

  async block(addresses: string[]) {
    await this.consentList.publish(
      addresses.map((address) => this.consentList.block(address))
    )
  }
}
