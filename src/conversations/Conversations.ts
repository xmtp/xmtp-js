import Conversation from './Conversation'
import Message from '../Message'
import Stream, { MessageFilter, MessageTransformer } from '../Stream'
import Client from '../Client'
import { buildUserIntroTopic } from '../utils'

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
      buildUserIntroTopic(this.client.address),
      messageTransformer,
      filter
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
