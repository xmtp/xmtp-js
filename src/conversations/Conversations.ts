import Conversation from './Conversation'
import Message from '../Message'
import Stream, {
  MessageFilter,
  MessageTransformer,
  noTransformation,
} from '../Stream'
import Client from '../Client'
import { buildDirectMessageTopic, buildUserIntroTopic } from '../utils'

const messageHasHeaders: MessageFilter = (msg: Message) => {
  return Boolean(msg.recipientAddress && msg.senderAddress)
}
/**
 * Conversations allows you to view ongoing 1:1 messaging sessions with another wallet
 */
export default class Conversations {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }

  /**
   * List all conversations with the current wallet found in the network, deduped by peer address
   */
  async list(): Promise<Conversation[]> {
    const v1Addresses = await this.getV1Addresses()
    await this.client.loadInvites()
    const topicResults = this.client.allTopics()
    const out: Conversation[] = []
    for (const result of topicResults) {
      // If no context, attempt to join with existing V1 intro
      const topics = [result.contentTopic]
      if (!result.context) {
        if (v1Addresses.has(result.peerAddress)) {
          topics.unshift(
            buildDirectMessageTopic(result.peerAddress, this.client.address)
          )
          //
          v1Addresses.delete(result.peerAddress)
        }
      }
      out.push(
        new Conversation(
          this.client,
          result.peerAddress,
          topics,
          result.context
        )
      )
    }

    // Add the remaining addresses that do not have a matching invite as V1 conversations
    return out.concat(
      Array.from(v1Addresses).map(
        (address) =>
          new Conversation(this.client, address, [
            buildDirectMessageTopic(address, this.client.address),
          ])
      )
    )
  }

  private async getV1Addresses(): Promise<Set<string>> {
    const messages = await this.client.listIntroductionMessages()
    const seenPeers: Set<string> = new Set()
    for (const message of messages) {
      // Ignore all messages without sender or recipient address headers
      // Makes getPeerAddress safe
      if (!messageHasHeaders(message)) {
        continue
      }

      const peerAddress = this.getPeerAddress(message)

      if (peerAddress) {
        seenPeers.add(peerAddress)
      }
    }

    return seenPeers
  }

  /**
   * Returns a stream of any newly created conversations.
   * Will dedupe to not return the same conversation twice in the same stream.
   * Does not dedupe any other previously seen conversations
   */
  stream(): Promise<Stream<Conversation>> {
    const messageTransformer: MessageTransformer<Conversation> = (
      msg: Message
    ) => {
      const peerAddress = this.getPeerAddress(msg)
      return new Conversation(this.client, peerAddress, [
        buildDirectMessageTopic(peerAddress, this.client.address),
      ])
    }

    const seenPeers: Set<string> = new Set()

    const filter = (msg: Message): boolean => {
      if (!messageHasHeaders(msg)) {
        return false
      }
      const peerAddress = this.getPeerAddress(msg)
      // Check if we have seen the peer already in this stream
      if (seenPeers.has(peerAddress)) {
        return false
      }
      seenPeers.add(peerAddress)
      return true
    }

    return Stream.create<Conversation>(
      this.client,
      [buildUserIntroTopic(this.client.address)],
      messageTransformer,
      filter
    )
  }

  /**
   * Returns a stream for all new messages from existing and new conversations.
   */
  async streamAllMessages(): Promise<Stream<Message>> {
    const conversations = await this.list()
    const dmAddresses: string[] = conversations.map(
      (conversation) => conversation.peerAddress
    )
    const introTopic = buildUserIntroTopic(this.client.address)
    const topics = this.buildTopicsForAllMessages(dmAddresses, introTopic)

    // If we detect a new intro topic, update the stream's direct message topics to include the new topic
    const contentTopicUpdater = (msg: Message): string[] | undefined => {
      if (msg.contentTopic !== introTopic || !messageHasHeaders(msg)) {
        return undefined
      }
      const peerAddress = this.getPeerAddress(msg)
      if (
        dmAddresses.includes(peerAddress) ||
        peerAddress === this.client.address
      ) {
        // No need to update if we're already subscribed
        return undefined
      }
      dmAddresses.push(peerAddress)
      return this.buildTopicsForAllMessages(dmAddresses, introTopic)
    }

    // Filter intro topics if already streaming direct messages for that address to avoid duplicates
    const filter = (msg: Message): boolean => {
      if (
        msg.contentTopic === introTopic &&
        messageHasHeaders(msg) &&
        dmAddresses.includes(this.getPeerAddress(msg))
      ) {
        return false
      }
      return true
    }

    return Stream.create<Message>(
      this.client,
      topics,
      noTransformation,
      filter,
      contentTopicUpdater
    )
  }

  /**
   * Builds a list of topics for existing conversations and new intro topics
   */
  private buildTopicsForAllMessages(
    peerAddresses: string[],
    introTopic: string
  ): string[] {
    const topics = peerAddresses.map((address) =>
      buildDirectMessageTopic(address, this.client.address)
    )
    // Ensure we listen for new conversation topics as well
    topics.push(introTopic)
    return topics
  }

  /**
   * Creates a new conversation for the given address. Will throw an error if the peer is not found in the XMTP network
   */
  async newConversation(peerAddress: string): Promise<Conversation> {
    const contact = await this.client.getUserContact(peerAddress)
    if (!contact) {
      throw new Error(`Recipient ${peerAddress} is not on the XMTP network`)
    }

    return new Conversation(this.client, peerAddress, [
      buildDirectMessageTopic(this.client.address, peerAddress),
    ])
  }

  private getPeerAddress(message: Message): string {
    const peerAddress =
      message.recipientAddress === this.client.address
        ? message.senderAddress
        : message.recipientAddress

    // This assertion is safe, so long as messages have been through the filter
    return peerAddress as string
  }
}
