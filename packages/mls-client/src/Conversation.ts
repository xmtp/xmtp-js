import type { ContentTypeId } from '@xmtp/content-type-primitives'
import type {
  NapiGroup,
  NapiListMessagesOptions,
} from '@xmtp/mls-client-bindings-node'
import { AsyncStream, type StreamCallback } from '@/AsyncStream'
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

  get admins() {
    return this.#group.adminList()
  }

  get superAdmins() {
    return this.#group.superAdminList()
  }

  isAdmin(inboxId: string) {
    return this.#group.isAdmin(inboxId)
  }

  isSuperAdmin(inboxId: string) {
    return this.#group.isSuperAdmin(inboxId)
  }

  async sync() {
    return this.#group.sync()
  }

  stream(callback?: StreamCallback<DecodedMessage>) {
    const asyncStream = new AsyncStream<DecodedMessage>()

    const stream = this.#group.stream((err, message) => {
      const decodedMessage = new DecodedMessage(this.#client, message)
      asyncStream.callback(err, decodedMessage)
      callback?.(err, decodedMessage)
    })

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

  async addAdmin(inboxId: string) {
    return this.#group.addAdmin(inboxId)
  }

  async removeAdmin(inboxId: string) {
    return this.#group.removeAdmin(inboxId)
  }

  async addSuperAdmin(inboxId: string) {
    return this.#group.addSuperAdmin(inboxId)
  }

  async removeSuperAdmin(inboxId: string) {
    return this.#group.removeSuperAdmin(inboxId)
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
