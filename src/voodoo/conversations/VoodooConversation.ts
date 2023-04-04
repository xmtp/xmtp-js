import {
  ListMessagesOptions,
  ListMessagesPaginatedOptions,
  SendOptions,
} from '../../Client'
import VoodooClient, { VoodooMessage } from '../VoodooClient'
import Stream from '../../Stream'
import { messageApi } from '@xmtp/proto'

export default class VoodooConversation {
  peerAddress: string
  // Vodozemac session ID
  sessionId: string
  topic: string
  createdAt: Date
  private client: VoodooClient
  _messages: VoodooMessage[] = []

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
  async messages(opts?: ListMessagesOptions): Promise<VoodooMessage[]> {
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
    const decryptedMessages = await newMessages.map(async (m) => {
      // Decode the envelope
      const encryptedVoodooMessage = await this.client.decodeEnvelope(m)
      const decryptedMessage = await this.client.decryptMessage(
        this.sessionId,
        encryptedVoodooMessage
      )
      if (decryptedMessage) {
        return decryptedMessage
      }
    })

    // Wait for all promises in decryptedMessages to resolve
    const results = await Promise.all(decryptedMessages)

    for (const m of results) {
      if (m) {
        this._messages.push(m)
      }
    }
    return this._messages
  }

  streamMessages(): Promise<Stream<VoodooMessage>> {
    throw new Error('Method not implemented.')
  }

  async send(content: string, opts?: SendOptions): Promise<VoodooMessage> {
    const encryptedVoodooMessage = await this.client.encryptMessage(
      this.sessionId,
      content
    )
    await this.client.publishEnvelopes([
      {
        contentTopic: this.topic,
        message: Buffer.from(JSON.stringify(encryptedVoodooMessage)),
      },
    ])
    return {
      senderAddress: encryptedVoodooMessage.senderAddress,
      sessionId: encryptedVoodooMessage.sessionId,
      timestamp: encryptedVoodooMessage.timestamp,
      plaintext: content,
    }
  }

  decodeMessage(env: messageApi.Envelope): Promise<VoodooMessage> {
    throw new Error('Method not implemented.')
  }

  // passthrough for now
  async processEnvelope(
    env: messageApi.Envelope
  ): Promise<messageApi.Envelope> {
    return env
  }
}
