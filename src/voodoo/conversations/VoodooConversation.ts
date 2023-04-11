import VoodooClient from '../VoodooClient'
import { VoodooMessage, VoodooMultiBundle, VoodooMultiSession } from '../types'
import Stream from '../../Stream'
import { messageApi } from '@xmtp/proto'

/**
 * This class represents a conversation between two users.
 * It needs to manage various 1:1 messaging sessions between devices that
 * comprise this conversation.
 * - 1:1s between my current VoodooInstance and my other ones (on other devices possibly)
 * - 1:1s between my current VoodooInstance and my peer's VoodooInstances
 */
export default class VoodooConversation {
  peerAddress: string
  createdAt: number
  multiSession: VoodooMultiSession
  private client: VoodooClient

  constructor(
    client: VoodooClient,
    peerAddress: string,
    createdAt: number,
    myMultiBundle: VoodooMultiBundle,
    otherMultiBundle: VoodooMultiBundle,
    sessionIds: string[],
    topics: string[]
  ) {
    this.client = client
    this.peerAddress = peerAddress
    this.createdAt = createdAt
    const messages = new Map<string, VoodooMessage[]>()
    sessionIds.forEach((sessionId) => {
      messages.set(sessionId, [])
    })
    this.multiSession = {
      otherAddress: peerAddress,
      myMultiBundle,
      otherMultiBundle,
      establishedContacts: [],
      sessionIds,
      messages,
      myMessages: [],
      topics,
    }
  }

  // Helper function to get a new empty conversation
  static newEmptyConversation(
    client: VoodooClient,
    myMultiBundle: VoodooMultiBundle,
    otherMultiBundle: VoodooMultiBundle,
    peerAddress: string
  ): VoodooConversation {
    const createdAt = Date.now()
    return new VoodooConversation(
      client,
      peerAddress,
      createdAt,
      myMultiBundle,
      otherMultiBundle,
      [],
      []
    )
  }

  get clientAddress(): string {
    return this.client.address
  }

  // TODO: this is an important implementation detail for Voodoo - we cannot
  // decrypt already decrypted messages since ratchet state has progressed
  // so we must check if we have new messages, then combine them with the existing
  // this.messages list
  private async messagesPerSession(
    topic: string,
    sessionId: string
  ): Promise<VoodooMessage[]> {
    // Check for new messages
    const newMessages = await this.client.listEnvelopes(
      topic,
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
          sessionId,
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

    let messages = this.multiSession.messages.get(sessionId)
    if (!messages) {
      messages = []
    }

    for (const m of results) {
      if (m) {
        messages.push(m)
      }
    }
    // Sort all messages
    messages.sort((a: VoodooMessage, b: VoodooMessage) => {
      return a.timestamp - b.timestamp
    })
    this.multiSession.messages.set(sessionId, messages)
    return messages
  }

  // Provides an aggregated and sorted list of messages for all of the device sessions
  async messages(): Promise<VoodooMessage[]> {
    // Go through and call messagesPerSession for each session
    let allMessages: VoodooMessage[] = []
    for (let i = 0; i < this.multiSession.sessionIds.length; i++) {
      const sessionId = this.multiSession.sessionIds[i]
      const topic = this.multiSession.topics[i]
      const messages = await this.messagesPerSession(topic, sessionId)
      allMessages = allMessages.concat(messages)
    }

    // Add in myMessages
    allMessages = allMessages.concat(this.multiSession.myMessages)

    // Sort allMessages
    allMessages.sort((a: VoodooMessage, b: VoodooMessage) => {
      return a.timestamp - b.timestamp
    })
    return allMessages
  }

  streamMessages(): Promise<Stream<VoodooMessage>> {
    throw new Error('Method not implemented.')
  }

  // TODO: we should unify on same timestamp for all messages, can rework encryptMessage for this later
  private async sendToSession(
    topic: string,
    sessionId: string,
    content: string
  ): Promise<VoodooMessage> {
    const encryptedVoodooMessage = await this.client.encryptMessage(
      sessionId,
      content
    )
    await this.client.publishEnvelopes([
      {
        contentTopic: topic,
        message: Buffer.from(JSON.stringify(encryptedVoodooMessage)),
      },
    ])
    const sentMessage = {
      senderAddress: encryptedVoodooMessage.senderAddress,
      sessionId: encryptedVoodooMessage.sessionId,
      timestamp: encryptedVoodooMessage.timestamp,
      plaintext: content,
    }
    return sentMessage
  }

  // Uses sendToSession on all sessions, appends sent messages to this.multiSession.myMessages
  async send(content: string): Promise<VoodooMessage> {
    // Go through and call sendToSession for each session
    let sentMessage: VoodooMessage | undefined
    for (let i = 0; i < this.multiSession.sessionIds.length; i++) {
      const sessionId = this.multiSession.sessionIds[i]
      const topic = this.multiSession.topics[i]
      sentMessage = await this.sendToSession(topic, sessionId, content)
    }
    if (!sentMessage) {
      throw new Error('Failed to send message')
    }
    // Only push the message once
    this.multiSession.myMessages.push(sentMessage)
    return sentMessage
  }

  // passthrough for now
  async processEnvelope(
    env: messageApi.Envelope
  ): Promise<messageApi.Envelope> {
    return env
  }
}
