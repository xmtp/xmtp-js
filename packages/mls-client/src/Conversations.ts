import type {
  GroupPermissions,
  NapiConversations,
  NapiListMessagesOptions,
} from '@xmtp/mls-client-bindings-node'
import { AsyncStream, type StreamCallback } from '@/AsyncStream'
import type { Client } from '@/Client'
import { Conversation } from '@/Conversation'
import { DecodedMessage } from '@/DecodedMessage'

export class Conversations {
  #client: Client
  #conversations: NapiConversations
  #map: Map<string, Conversation>

  constructor(client: Client, conversations: NapiConversations) {
    this.#client = client
    this.#conversations = conversations
    this.#map = new Map()
  }

  get(id: string) {
    return this.#map.get(id)
  }

  async newConversation(
    accountAddresses: string[],
    permissions?: GroupPermissions
  ) {
    const group = await this.#conversations.createGroup(
      accountAddresses,
      permissions
    )
    const conversation = new Conversation(this.#client, group)
    this.#map.set(conversation.id, conversation)
    return conversation
  }

  async list(options?: NapiListMessagesOptions) {
    const groups = await this.#conversations.list(options)
    return groups.map((group) => {
      const conversation = new Conversation(this.#client, group)
      this.#map.set(conversation.id, conversation)
      return conversation
    })
  }

  async sync() {
    return this.#conversations.sync()
  }

  stream(callback?: StreamCallback<Conversation>) {
    const asyncStream = new AsyncStream<Conversation>()

    const stream = this.#conversations.stream((err, group) => {
      const conversation = new Conversation(this.#client, group)
      this.#map.set(conversation.id, conversation)
      asyncStream.callback(err, conversation)
      callback?.(err, conversation)
    })

    asyncStream.stopCallback = stream.end.bind(stream)

    return asyncStream
  }

  async streamAllMessages(callback?: StreamCallback<DecodedMessage>) {
    // sync conversations first
    await this.sync()

    const asyncStream = new AsyncStream<DecodedMessage>()

    const stream = this.#conversations.streamAllMessages((err, message) => {
      const decodedMessage = new DecodedMessage(this.#client, message)
      asyncStream.callback(err, decodedMessage)
      callback?.(err, decodedMessage)
    })

    asyncStream.stopCallback = stream.end.bind(stream)

    return asyncStream
  }
}
