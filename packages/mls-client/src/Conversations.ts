import type {
  GroupPermissions,
  NapiConversations,
  NapiGroup,
  NapiListMessagesOptions,
} from '@xmtp/mls-client-bindings-node'
import { AsyncStream } from '@/AsyncStream'
import type { Client } from '@/Client'
import { Conversation } from '@/Conversation'

export class Conversations {
  #client: Client
  #conversations: NapiConversations

  constructor(client: Client, conversations: NapiConversations) {
    this.#client = client
    this.#conversations = conversations
  }

  async newConversation(
    accountAddresses: string[],
    permissions?: GroupPermissions
  ) {
    const group = await this.#conversations.createGroup(
      accountAddresses,
      permissions
    )
    return new Conversation(this.#client, group)
  }

  async list(options?: NapiListMessagesOptions) {
    const groups = await this.#conversations.list(options)
    return groups.map((group) => new Conversation(this.#client, group))
  }

  async sync() {
    return this.#conversations.sync()
  }

  stream() {
    const asyncStream = new AsyncStream<NapiGroup, Conversation>(
      (group) => new Conversation(this.#client, group)
    )
    const stream = this.#conversations.stream(asyncStream.callback)
    asyncStream.stopCallback = stream.end.bind(stream)
    return asyncStream
  }
}
