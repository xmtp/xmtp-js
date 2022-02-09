import Stream from '../Stream'
import Client, { ListMessagesOptions } from '../Client'
import Message from '../Message'

/**
 * Conversation class allows you to view, stream, and send messages to/from a peer address
 */
export default class Conversation {
  peerAddress: string
  private client: Client

  constructor(client: Client, address: string) {
    this.peerAddress = address
    this.client = client
  }

  /**
   * Returns a list of all messages to/from the peerAddress
   */
  async messages(opts?: ListMessagesOptions): Promise<Message[]> {
    return this.client.listConversationMessages(this.peerAddress, opts)
  }

  /**
   * Returns a Stream of any new messages to/from the peerAddress
   */
  streamMessages(): Stream<Message> {
    return this.client.streamConversationMessages(this.peerAddress)
  }

  /**
   * Send a message into the conversation
   */
  async send(message: string): Promise<void> {
    await this.client.sendMessage(this.peerAddress, message)
  }
}
