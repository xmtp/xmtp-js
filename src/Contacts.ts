import Client from './Client'
import { privatePreferences } from '@xmtp/proto'
import { EnvelopeWithMessage, buildUserPrivatePreferencesTopic } from './utils'

export type AllowListPermissionType = 'allow' | 'block' | 'unknown'

export type AllowListEntryType = 'address'

export class AllowListEntry {
  value: string
  entryType: AllowListEntryType
  permissionType: AllowListPermissionType

  constructor(
    value: string,
    entryType: AllowListEntryType,
    permissionType: AllowListPermissionType
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
    permissionType: AllowListPermissionType = 'unknown'
  ): AllowListEntry {
    return new AllowListEntry(address, 'address', permissionType)
  }
}

export class AllowList {
  entries: Map<string, AllowListPermissionType>
  static _identifier: string

  constructor() {
    this.entries = new Map<string, AllowListPermissionType>()
  }

  allow(address: string) {
    const entry = AllowListEntry.fromAddress(address, 'allow')
    this.entries.set(entry.key, 'allow')
    return entry
  }

  block(address: string) {
    const entry = AllowListEntry.fromAddress(address, 'block')
    this.entries.set(entry.key, 'block')
    return entry
  }

  state(address: string) {
    const entry = AllowListEntry.fromAddress(address)
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

  static async load(client: Client): Promise<AllowList> {
    const allowList = new AllowList()
    const identifier = await this.getIdentifier(client)
    const contentTopic = buildUserPrivatePreferencesTopic(identifier)

    const messages = await client.listEnvelopes(
      contentTopic,
      async ({ message }: EnvelopeWithMessage) => message
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
        allowList.allow(address)
      })
      action.block?.walletAddresses.forEach((address) => {
        allowList.block(address)
      })
    })

    return allowList
  }

  static async publish(entries: AllowListEntry[], client: Client) {
    const identifier = await this.getIdentifier(client)

    // encoded actions
    const actions = entries.reduce((result, entry) => {
      if (entry.entryType === 'address') {
        const action: privatePreferences.PrivatePreferencesAction = {
          allow:
            entry.permissionType === 'allow'
              ? {
                  walletAddresses: [entry.value],
                }
              : undefined,
          block:
            entry.permissionType === 'block'
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

    const payloads = actions.map((action) => ({ payload: action }))

    const { responses } = await client.keystore.selfEncrypt({
      requests: payloads,
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
  allowList: AllowList
  client: Client

  constructor(client: Client) {
    this.addresses = new Set<string>()
    this.allowList = new AllowList()
    this.client = client
  }

  async refreshAllowList() {
    if (this.client._enableAllowList) {
      this.allowList = await AllowList.load(this.client)
    }
  }

  isAllowed(address: string) {
    return this.allowList.state(address) === 'allow'
  }

  isBlocked(address: string) {
    return this.allowList.state(address) === 'block'
  }

  allowState(address: string) {
    return this.allowList.state(address)
  }

  async allow(addresses: string[]) {
    if (this.client._enableAllowList) {
      await AllowList.publish(
        addresses.map((address) => this.allowList.allow(address)),
        this.client
      )
    }
  }

  async block(addresses: string[]) {
    if (this.client._enableAllowList) {
      await AllowList.publish(
        addresses.map((address) => this.allowList.block(address)),
        this.client
      )
    }
  }
}
