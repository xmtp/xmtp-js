import { Envelope } from '@xmtp/proto/ts/dist/types/message_api/v1/message_api.pb'
import Client from './Client'
import { privatePreferences } from '@xmtp/proto'
import { buildUserPrivatePreferencesTopic } from './utils'
import { PublishParams } from './ApiClient'

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
    const envelopes = (
      await client.listEnvelopes(
        buildUserPrivatePreferencesTopic(identifier),
        async ({ message }: Envelope) => {
          if (message) {
            const result = await client.keystore.selfDecrypt({
              requests: [{ payload: message }],
            })
            const payload = result.responses[0].result?.decrypted
            if (payload) {
              return privatePreferences.PrivatePreferencesAction.decode(payload)
            }
          }
          return undefined
        }
      )
    ).filter(
      (envelope) => envelope !== undefined
    ) as privatePreferences.PrivatePreferencesAction[]

    envelopes.forEach((envelope) => {
      envelope.allow?.walletAddresses.forEach((address) => {
        allowList.allow(address)
      })
      envelope.block?.walletAddresses.forEach((address) => {
        allowList.block(address)
      })
    })

    return allowList
  }

  static async publish(entries: AllowListEntry[], client: Client) {
    const identifier = await this.getIdentifier(client)

    // TODO: preserve order
    const rawEnvelopes = await Promise.all(
      entries.map(async (entry) => {
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
          const payload =
            privatePreferences.PrivatePreferencesAction.encode(action).finish()
          const result = await client.keystore.selfEncrypt({
            requests: [{ payload }],
          })
          const message = result.responses[0].result?.encrypted
          if (message) {
            return {
              contentTopic: buildUserPrivatePreferencesTopic(identifier),
              message,
              timestamp: new Date(),
            }
          }
        }
        return undefined
      })
    )

    const envelopes = rawEnvelopes.filter(
      (envelope) => envelope !== undefined
    ) as PublishParams[]

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
