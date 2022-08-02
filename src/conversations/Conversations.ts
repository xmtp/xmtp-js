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

    return (
      Array.from(seenPeers)
        // Consistently order the results
        .sort()
        .map((peerAddress) => new Conversation(this.client, peerAddress))
    )
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
      return new Conversation(this.client, peerAddress)
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
   * Returns a stream for all new messages from all existing and new conversations.
   */
  async streamAllMessages(): Promise<Stream<Message>> {
    const conversations = await this.list()
    const dmAddresses: Set<string> = new Set()
    for (const conversation of conversations) {
      dmAddresses.add(conversation.peerAddress)
    }
    const topics = Array.from(dmAddresses).map((address) =>
      buildDirectMessageTopic(address, this.client.address)
    )

    // Ensure we listen for new conversation topics as well
    const introTopic = buildUserIntroTopic(this.client.address)
    topics.push(introTopic)

    // Update the stream's content topics to include direct messages for new conversations
    const contentTopicUpdater = (msg: Message): string[] | undefined => {
      if (msg.contentTopic !== introTopic || !messageHasHeaders(msg)) {
        return undefined
      }
      const peerAddress = this.getPeerAddress(msg)
      if (dmAddresses.has(peerAddress) || peerAddress === this.client.address) {
        return undefined
      }
      dmAddresses.add(this.getPeerAddress(msg))
      return Array.from(dmAddresses).map((address) =>
        buildDirectMessageTopic(address, this.client.address)
      )
    }

    // Filter out duplicate intro messages if we're already streaming the conversation
    const filter = (msg: Message): boolean => {
      if (
        msg.contentTopic === introTopic &&
        messageHasHeaders(msg) &&
        dmAddresses.has(this.getPeerAddress(msg))
      ) {
        console.log('FILTERED TOPIC: ' + msg.contentTopic)
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
   * Creates a new conversation for the given address. Will throw an error if the peer is not found in the XMTP network
   */
  async newConversation(peerAddress: string): Promise<Conversation> {
    const contact = await this.client.getUserContact(peerAddress)
    if (!contact) {
      throw new Error(`Recipient ${peerAddress} is not on the XMTP network`)
    }

    return new Conversation(this.client, peerAddress)
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
