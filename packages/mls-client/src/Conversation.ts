import type {
  NapiGroup,
  NapiListMessagesOptions,
  NapiMessage,
} from '@xmtp/mls-client-bindings-node'
import type { ContentTypeId } from '@xmtp/xmtp-js'
import { AsyncStream } from '@/AsyncStream'
import type { Client } from '@/Client'
import { DecodedMessage } from '@/DecodedMessage'
import { nsToDate } from '@/helpers/date'

export class Conversation {
  #client: Client
  #group: NapiGroup

  constructor(client: Client, group: NapiGroup) {
    this.#client = client
    this.#group = group
  }

  get id() {
    return this.#group.id()
  }

  get name() {
    return this.#group.groupName()
  }

  async updateName(name: string) {
    return this.#group.updateGroupName(name)
  }

  get isActive() {
    return this.#group.isActive()
  }

  get addedByInboxId() {
    return this.#group.addedByInboxId()
  }

  get createdAtNs() {
    return this.#group.createdAtNs()
  }

  get createdAt() {
    return nsToDate(this.createdAtNs)
  }

  get metadata() {
    const metadata = this.#group.groupMetadata()
    return {
      creatorInboxId: metadata.creatorInboxId(),
      conversationType: metadata.conversationType(),
    }
  }

  get members() {
    return this.#group.listMembers()
  }

  async sync() {
    return this.#group.sync()
  }

  stream() {
    const asyncStream = new AsyncStream<NapiMessage, DecodedMessage>(
      (message) => new DecodedMessage(this.#client, message)
    )
    // @ts-expect-error type is incorrect in the bindings
    const stream = this.#group.stream(asyncStream.callback)
    asyncStream.stopCallback = stream.end.bind(stream)
    return asyncStream
  }

  async addMembers(accountAddresses: string[]) {
    return this.#group.addMembers(accountAddresses)
  }

  async addMembersByInboxId(inboxIds: string[]) {
    return this.#group.addMembersByInboxId(inboxIds)
  }

  async removeMembers(accountAddresses: string[]) {
    return this.#group.removeMembers(accountAddresses)
  }

  async removeMembersByInboxId(inboxIds: string[]) {
    return this.#group.removeMembersByInboxId(inboxIds)
  }

  async send(content: any, contentType: ContentTypeId) {
    return this.#group.send(this.#client.encodeContent(content, contentType))
  }

  messages(options?: NapiListMessagesOptions): DecodedMessage[] {
    return this.#group
      .findMessages(options)
      .map((message) => new DecodedMessage(this.#client, message))
  }
}
