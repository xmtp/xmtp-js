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
  entries: Map<string, ConsentState>
  static _identifier: string

  constructor() {
    this.entries = new Map<string, ConsentState>()
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

  static async getIdentifier(client: Client): Promise<string> {
    if (!this._identifier) {
      const { identifier } =
        await client.keystore.getPrivatePreferencesTopicIdentifier()
      this._identifier = identifier
    }
    return this._identifier
  }

  static async load(client: Client, startTime?: Date): Promise<ConsentList> {
    const consentList = new ConsentList()
    const identifier = await this.getIdentifier(client)
    const contentTopic = buildUserPrivatePreferencesTopic(identifier)

    const messages = await client.listEnvelopes(
      contentTopic,
      async ({ message }: EnvelopeWithMessage) => message,
      {
        startTime,
      }
    )

    // decrypt messages
    const { responses } = await client.keystore.selfDecrypt({
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

    actions.forEach((action) => {
      action.allow?.walletAddresses.forEach((address) => {
        consentList.allow(address)
      })
      action.block?.walletAddresses.forEach((address) => {
        consentList.block(address)
      })
    })

    return consentList
  }

  static async publish(entries: ConsentListEntry[], client: Client) {
    const identifier = await this.getIdentifier(client)

    // encoded actions
    const actions = entries.reduce((result, entry) => {
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

    const { responses } = await client.keystore.selfEncrypt({
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

    await client.publishEnvelopes(envelopes)
  }
}

export class Contacts {
  /**
   * Addresses that the client has connected to
   */
  addresses: Set<string>
  private consentList: ConsentList
  client: Client

  constructor(client: Client) {
    this.addresses = new Set<string>()
    this.consentList = new ConsentList()
    this.client = client
  }

  async refreshConsentList(startTime?: Date) {
    if (this.client.consentEnabled) {
      this.consentList = await ConsentList.load(this.client, startTime)
    }
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
    if (this.client.consentEnabled) {
      await ConsentList.publish(
        addresses.map((address) => this.consentList.allow(address)),
        this.client
      )
    }
  }

  async block(addresses: string[]) {
    if (this.client.consentEnabled) {
      await ConsentList.publish(
        addresses.map((address) => this.consentList.block(address)),
        this.client
      )
    }
  }
}
