import { Mutex } from 'async-mutex'
import { default as VoodooClient, VoodooContact } from '../VoodooClient'
import VoodooConversation from './VoodooConversation'
import { utils } from '../../crypto'

import {
  buildVoodooUserInviteTopic,
  buildVoodooDirectMessageTopic,
} from '../utils'

export default class VoodooConversations {
  private client: VoodooClient
  private conversations: Map<string, VoodooConversation> = new Map()
  private v2Mutex: Mutex

  constructor(client: VoodooClient) {
    this.client = client
    this.v2Mutex = new Mutex()
  }

  async list(): Promise<VoodooConversation[]> {
    const release = await this.v2Mutex.acquire()
    try {
      return Array.from(this.conversations.values())
    } finally {
      release()
    }
  }

  /**
   * Creates a new VoodooConversation for the given address. Will throw an error if the peer is not found in the XMTP network
   */
  async newConversation(peerAddress: string): Promise<VoodooConversation> {
    let contact = await this.client.getUserContactFromNetwork(peerAddress)
    if (!contact) {
      throw new Error(
        `Voodoo recipient ${peerAddress} is not on the XMTP network`
      )
    }

    // Better be a VoodooContact type
    if (!contact.voodooInstance) {
      throw new Error(`Voodoo recipient ${peerAddress} is not a Voodoo contact`)
    }

    // TODO: add more context eventually
    const matcherFn = (convo: VoodooConversation) =>
      convo.peerAddress === peerAddress

    return this.v2Mutex.runExclusive(async () => {
      const existing = await this.list()
      const existingMatch = existing.find(matcherFn)
      if (existingMatch) {
        return existingMatch
      }

      // Create a new VoodooConversation
      return this.createConvo(contact as VoodooContact)
    })
  }

  // TODO: We need to rename outbound/inbound into invites of some sort
  // Currently, we generate a random topic for the session, and send an Olm PreKey Message
  // where the encrypted ciphertext is just the random topic. This is the "invite" message.
  // The recipient processes the Olm PreKey Message and gets the random topic, and then
  // creates their own VoodooConversation from the derived session and the included topic.
  private async createConvo(
    recipient: VoodooContact
  ): Promise<VoodooConversation> {
    const timestamp = new Date()

    // Generate the random topic for the session and set it as the first
    // plaintext message sent
    const generatedSessionTopic = buildVoodooDirectMessageTopic(
      Buffer.from(utils.getRandomValues(new Uint8Array(32)))
        .toString('base64')
        .replace(/=*$/g, '')
        // Replace slashes with dashes so that the topic is still easily split by /
        // We do not treat this as needing to be valid Base64 anywhere
        .replace('/', '-')
    )

    // Create an outbound session with { sessionId: string, paylaod: string (encoded Olm PreKey Message) }
    const outboundObject = this.client.voodooInstance.getOutboundSessionJson(
      recipient.voodooInstance,
      generatedSessionTopic
    )

    if (!outboundObject) {
      throw new Error('Could not create outbound session')
    }

    // TODO: should derive this from wallet signature
    const peerAddress = await recipient.address

    // Only publish to the peer's inbox, store the conversation locally
    await this.client.publishEnvelopes([
      {
        contentTopic: buildVoodooUserInviteTopic(peerAddress),
        message: Buffer.from(outboundObject.payload),
        timestamp,
      },
    ])

    const convo = new VoodooConversation(
      this.client,
      outboundObject.sessionId,
      generatedSessionTopic,
      peerAddress,
      timestamp
    )
    // Acquire mutex and set conversation
    const release = await this.v2Mutex.acquire()
    try {
      this.conversations.set(peerAddress, convo)
    } finally {
      release()
    }
    return convo
  }
}
