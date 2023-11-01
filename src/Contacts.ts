import Client from './Client'
import { privatePreferences } from '@xmtp/proto'
import {
  EnvelopeWithMessage,
  buildUserPrivatePreferencesTopic,
  fromNanoString,
} from './utils'

export type ConsentState = 'allowed' | 'denied' | 'unknown'

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
  lastEntryTimestamp?: Date
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

  deny(address: string) {
    const entry = ConsentListEntry.fromAddress(address, 'denied')
    this.entries.set(entry.key, 'denied')
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

    let lastTimestampNs: string | undefined

    const messages = await this.client.listEnvelopes(
      contentTopic,
      async ({ message, timestampNs }: EnvelopeWithMessage) => {
        if (timestampNs) {
          lastTimestampNs = timestampNs
        }
        return message
      },
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
        this.deny(address)
      })
    })

    if (lastTimestampNs) {
      this.lastEntryTimestamp = fromNanoString(lastTimestampNs)
    }
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
            entry.permissionType === 'denied'
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

    // publish entries
    await this.client.publishEnvelopes(envelopes)

    // update local entries after publishing
    entries.forEach((entry) => {
      this.entries.set(entry.key, entry.permissionType)
    })
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
  private consentList: ConsentList

  constructor(client: Client) {
    this.addresses = new Set<string>()
    this.consentList = new ConsentList(client)
    this.client = client
  }

  async loadConsentList(startTime?: Date) {
    await this.consentList.load(startTime)
  }

  async refreshConsentList() {
    await this.loadConsentList()
  }

  /**
   * The timestamp of the last entry in the consent list
   */
  get lastSyncedAt() {
    return this.consentList.lastEntryTimestamp
  }

  setConsentListEntries(entries: ConsentListEntry[]) {
    if (!entries.length) {
      return
    }
    this.consentList.entries.clear()
    entries.forEach((entry) => {
      if (entry.permissionType === 'allowed') {
        this.consentList.allow(entry.value)
      }
      if (entry.permissionType === 'denied') {
        this.consentList.deny(entry.value)
      }
    })
  }

  isAllowed(address: string) {
    return this.consentList.state(address) === 'allowed'
  }

  isDenied(address: string) {
    return this.consentList.state(address) === 'denied'
  }

  consentState(address: string) {
    return this.consentList.state(address)
  }

  async allow(addresses: string[]) {
    await this.consentList.publish(
      addresses.map((address) =>
        ConsentListEntry.fromAddress(address, 'allowed')
      )
    )
  }

  async deny(addresses: string[]) {
    await this.consentList.publish(
      addresses.map((address) =>
        ConsentListEntry.fromAddress(address, 'denied')
      )
    )
  }
}
