import VoodooClient, { VoodooMessage } from '../VoodooClient'
import Stream from '../../Stream'
import { messageApi } from '@xmtp/proto'

export default class VoodooConversation {
  peerAddress: string
  // Vodozemac session ID
  sessionId: string
  topic: string
  createdAt: number
  private client: VoodooClient
  _messages: VoodooMessage[] = []

  constructor(
    client: VoodooClient,
    sessionId: string,
    topic: string,
    peerAddress: string,
    createdAt: number
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
  async messages(): Promise<VoodooMessage[]> {
    // Check for new messages
    const newMessages = await this.client.listEnvelopes(
      this.topic,
      this.processEnvelope.bind(this)
    )

    // Try decrypting them via this.client
    // TODO: for now, we just drop everything that doesn't decrypt correctly
    // this can happen because we cannot decrypt our own messages anyways.
    // Append the remaining messages to this.messages.
    // NOTE: Vodozemac can tolerate something like 2000 messages out-of-order
    // by accelerating the ratchet and storing skipped message keys in a buffer
    const decryptedMessages = await newMessages.map(async (m) => {
      try {
        // Decode the envelope
        const encryptedVoodooMessage = await this.client.decodeEnvelope(m)
        const decryptedMessage = await this.client.decryptMessage(
          this.sessionId,
          encryptedVoodooMessage
        )
        if (decryptedMessage) {
          return decryptedMessage
        }
      } catch (e) {
        console.log('Failed to decrypt message', e)
      }
    })

    // Wait for all promises in decryptedMessages to resolve
    const results = await Promise.all(decryptedMessages)

    for (const m of results) {
      if (m) {
        this._messages.push(m)
      }
    }
    // Sort all messages
    this._messages.sort((a: VoodooMessage, b: VoodooMessage) => {
      return a.timestamp - b.timestamp
    })
    return this._messages
  }

  streamMessages(): Promise<Stream<VoodooMessage>> {
    throw new Error('Method not implemented.')
  }

  async send(content: string): Promise<VoodooMessage> {
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
    const sentMessage = {
      senderAddress: encryptedVoodooMessage.senderAddress,
      sessionId: encryptedVoodooMessage.sessionId,
      timestamp: encryptedVoodooMessage.timestamp,
      plaintext: content,
    }
    this._messages.push(sentMessage)
    return sentMessage
  }

  // passthrough for now
  async processEnvelope(
    env: messageApi.Envelope
  ): Promise<messageApi.Envelope> {
    return env
  }
}
