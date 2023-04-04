import {
  ListMessagesOptions,
  ListMessagesPaginatedOptions,
  SendOptions,
} from '../../Client'
import { VoodooClient } from '../VoodooClient'
import { Conversation } from '../../conversations/Conversation'
import Stream from '../../Stream'

export class VoodooMessage {
  senderAddress: string
  timestamp: Date
  content: string
}

export class VoodooConversation implements Conversation {
  peerAddress: string
  // Vodozemac session ID
  sessionId: string
  topic: string
  createdAt: Date
  private client: VoodooClient
  messages: VoodooMessage[] = []

  constructor(
    client: VoodooClient,
    sessionId: string,
    topic: string,
    peerAddress: string,
    createdAt: Date
  ) {
    this.client = client
    this.sessionId = sessionId
    this.topic = topic
    this.peerAddress = peerAddress
    this.createdAt = createdAt
  }

  get clientAddress(): string {
    return this.client.address
  }

  // TODO: this is an important implementation detail for Voodoo - we cannot
  // decrypt already decrypted messages since ratchet state has progressed
  // so we must check if we have new messages, then combine them with the existing
  // this.messages list
  async messages(opts?: ListMessageOptions): Promise<VoodooMessage[]> {
    // Check for new messages
    const newMessages = await this.client.listEnvelopes(
      this.topic,
      this.processEnvelope.bind(this),
      opts
    )

    // Try decrypting them via this.client
    // TODO: for now, we just drop everything that doesn't decrypt correctly
    // append the remaining messages to this.messages
    // NOTE: Vodozemac can tolerate something like 2000 messages out-of-order
    // by accelerating the ratchet and storing skipped message keys in a buffer
    const decryptedMessages = newMessages.map((m) => {
      const decrypted = this.client.decryptMessage(m)
      if (decrypted) {
        return {
          senderAddress: m.senderAddress,
          timestamp: m.timestamp,
          content: decrypted,
        }
      }
    })

    this.messages = this.messages.concat(decryptedMessages.filter((m) => m))
    return this.messages
  }

  streamMessages(): Promise<Stream<VoodooMessage>> {
    throw new Error('Method not implemented.')
  }

  async send(content: string, opts?: SendOptions): Promise<VoodooMessage> {
    // Encrypt the message
    const envelope = await this.client.sendEnvelope(this.topic, content, opts)
    const decrypted = this.client.decryptMessage(envelope)
    if (!decrypted) {
      throw new Error('Could not decrypt message')
    }
    const message = {
      senderAddress: envelope.senderAddress,
      timestamp: envelope.timestamp,
      content: decrypted,
    }
    this.messages.push(message)
    return message
  }
}
