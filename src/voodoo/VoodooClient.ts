import xmtpv3 from 'xmtpv3_wasm'

import { buildVoodooUserContactTopic } from './utils'
import { EnvelopeMapper } from '../utils'
import ApiClient, { PublishParams, SortDirection } from '../ApiClient'
import { ListMessagesOptions } from '../Client'
import { messageApi, fetcher } from '@xmtp/proto'

import { VoodooConversations } from './conversations'
const { b64Decode } = fetcher

// TODO: this is a hacky wrapper class for a Voodoo contact,
// currently represented by the entire contact's VoodooInstance
// - should be changed to align with VoodooPublicAccount (or whatever)
// it ends up being named in Rust
export class VoodooContact {
  address: string
  // TODO: Replace this `any` by exporting appropriate type from xmtpv3 WASM binding package
  voodooInstance: any

  constructor(address: string, voodooInstance: any) {
    this.address = address
    this.voodooInstance = voodooInstance
  }
}

// Very simple message object which acts as the message type for all Voodoo envelopes
export type EncryptedVoodooMessage = {
  // Plaintext fields
  senderAddress: string
  timestamp: number
  // SessionId may be dropped in the future
  sessionId: string
  // Ciphertext fields
  ciphertext: string
}

export type VoodooMessage = {
  // All plaintext fields
  senderAddress: string
  timestamp: number
  plaintext: string
  // SessionId may be dropped in the future
  sessionId: string
}

// TODO: currently mirrored from xmtpv3.ts - should be exported from there
export type SessionResult = {
  sessionId: string
  payload: string
}

/**
 * Class that acts as a Client stand-in, but with Voodoo logic
 * - sessions
 * - contacts
 * - encoding and decoding messages
 *
 * NOTE: there is a lot of duplication with Client.ts, but by
 * making a dedicated class we can keep the logic clean for
 * our own reasoning. Client.ts will consume the VoodooManager
 * for now.
 */
export default class VoodooClient {
  address: string
  voodooInstance: any
  apiClient: ApiClient
  wasm: xmtpv3.XMTPWasm
  conversations: VoodooConversations

  constructor(
    address: string,
    voodooInstance: any,
    apiClient: ApiClient,
    wasm: xmtpv3.XMTPWasm
  ) {
    this.address = address
    this.voodooInstance = voodooInstance
    this.apiClient = apiClient
    this.wasm = wasm
    this.conversations = new VoodooConversations(this)
  }

  static async create(
    address: string,
    apiClient: ApiClient
  ): Promise<VoodooClient> {
    const xmtpWasm = await xmtpv3.XMTPWasm.initialize()
    // TODO: STARTINGTASK: this just creates unused voodoo keys that go nowhere
    const myVoodoo = xmtpWasm.newVoodooInstance()
    const client = new VoodooClient(address, myVoodoo, apiClient, xmtpWasm)
    await client.ensureUserContactPublished()
    return client
  }

  get contact(): VoodooContact {
    return {
      address: this.address,
      voodooInstance: this.voodooInstance,
    }
  }

  // Create new Voodoo invite
  async newVoodooInvite(
    contactAddress: string,
    topic: string
  ): Promise<EncryptedVoodooMessage> {
    // Get the contact info which is just a handle for now
    const contactInstance = await this.getUserContactFromNetwork(contactAddress)
    if (!contactInstance) {
      throw new Error(`No contact info for ${contactAddress}`)
    }

    const outboundSessionResult: SessionResult =
      await this.voodooInstance.createOutboundSession(
        contactInstance.voodooInstance,
        topic
      )
    return {
      senderAddress: this.address,
      ciphertext: outboundSessionResult.payload,
      sessionId: outboundSessionResult.sessionId,
      timestamp: new Date().getTime(),
    }
  }

  // Get the JSON from creating an inbound session
  async processVoodooInvite(
    contactAddress: string,
    encryptedInvite: EncryptedVoodooMessage
  ): Promise<VoodooMessage> {
    // Get the contact info which is just a handle for now
    const contactInstance = await this.getUserContactFromNetwork(contactAddress)
    if (!contactInstance) {
      throw new Error(`No contact info for ${contactAddress}`)
    }
    // Need to decode inboundEncryptedVoodooMessageJson
    const inboundSessionResult: SessionResult =
      await this.voodooInstance.createInboundSession(
        contactInstance.voodooInstance,
        encryptedInvite.ciphertext
      )

    return {
      sessionId: inboundSessionResult.sessionId,
      senderAddress: contactAddress,
      timestamp: encryptedInvite.timestamp,
      plaintext: inboundSessionResult.payload,
    }
  }

  async decryptMessage(
    sessionId: string,
    message: EncryptedVoodooMessage
  ): Promise<VoodooMessage> {
    // Decode the message
    const plaintext = await this.voodooInstance.decryptMessage(
      sessionId,
      message.ciphertext
    )
    return {
      senderAddress: message.senderAddress,
      timestamp: message.timestamp,
      plaintext,
      sessionId,
    }
  }

  async encryptMessage(
    sessionId: string,
    plaintext: string
  ): Promise<EncryptedVoodooMessage> {
    const ciphertext = await this.voodooInstance.encryptMessage(
      sessionId,
      plaintext
    )
    return {
      senderAddress: this.address,
      timestamp: new Date().getTime(),
      sessionId,
      ciphertext,
    }
  }

  // == Start Client.ts methods ==
  private validateEnvelope(env: PublishParams): void {
    const bytes = env.message
    if (!env.contentTopic) {
      throw new Error('Missing content topic')
    }

    if (!bytes || !bytes.length) {
      throw new Error('Cannot publish empty message')
    }
  }

  /**
   * Low level method for publishing envelopes to the XMTP network with
   * no pre-processing or encryption applied.
   *
   * Primarily used internally
   *
   * @param envelopes PublishParams[]
   */
  async publishEnvelopes(envelopes: PublishParams[]): Promise<void> {
    for (const env of envelopes) {
      this.validateEnvelope(env)
    }
    try {
      await this.apiClient.publish(envelopes)
    } catch (err) {
      console.log(err)
    }
  }

  private async ensureUserContactPublished(): Promise<void> {
    const bundle = await this.getUserContactFromNetwork(this.address)
    // TODO: validate the bundle, not just check for presence
    if (bundle) {
      return
    }
    await this.publishUserContact()
  }

  // PRIVATE: publish the key bundle into the contact topic
  // left public for testing purposes
  async publishUserContact(): Promise<void> {
    // Get the public json as bytes
    const bytes = Buffer.from(this.voodooInstance.toPublicJSON())
    await this.publishEnvelopes([
      {
        contentTopic: buildVoodooUserContactTopic(this.address),
        message: bytes,
      },
    ])
  }

  // This takes an Envelope fresh from a topic and decodes it into JSON string (Olm Pickle)
  async decodeEnvelope(
    env: messageApi.Envelope
  ): Promise<EncryptedVoodooMessage> {
    if (!env.message) {
      throw new Error('No message in envelope')
    }
    const bytes = env.message
    const jsonAsUtf8Bytes = b64Decode(bytes.toString())
    return JSON.parse(new TextDecoder().decode(jsonAsUtf8Bytes))
  }

  async decodeEnvelopeRaw(env: messageApi.Envelope): Promise<string> {
    if (!env.message) {
      throw new Error('No message in envelope')
    }
    const bytes = env.message
    const jsonAsUtf8Bytes = b64Decode(bytes.toString())
    return new TextDecoder().decode(jsonAsUtf8Bytes)
  }

  /**
   * Retrieve a voodoo public identity from given user's contact topic
   * TODO: needs to be reworked as part of public/private key split
   */
  async getUserContactFromNetwork(
    peerAddress: string
  ): Promise<VoodooContact | undefined> {
    const stream = this.apiClient.queryIterator(
      { contentTopic: buildVoodooUserContactTopic(peerAddress) },
      { pageSize: 5, direction: SortDirection.SORT_DIRECTION_DESCENDING }
    )

    for await (const env of stream) {
      if (!env.message) {
        continue
      }
      // TODO: need to use more than just the public JSON, need to define a proto or class
      // that includes a signature etc
      const voodooPublicJson = await this.decodeEnvelopeRaw(env)

      // TODO: do validation here of the address signature
      const voodooInstance =
        this.wasm.addOrGetPublicAccountFromJSON(voodooPublicJson)
      return new VoodooContact(peerAddress, voodooInstance)
    }
    return undefined
  }

  /**
   * List stored messages from the specified topic.
   *
   * A specified mapper function will be applied to each envelope.
   * If the mapper function throws an error during processing, the
   * envelope will be discarded.
   */
  async listEnvelopes<Out>(
    topic: string,
    mapper: EnvelopeMapper<Out>,
    opts?: ListMessagesOptions
  ): Promise<Out[]> {
    if (!opts) {
      opts = {}
    }
    const { startTime, endTime, limit } = opts

    const envelopes = await this.apiClient.query(
      { contentTopic: topic, startTime, endTime },
      {
        direction:
          opts.direction || messageApi.SortDirection.SORT_DIRECTION_ASCENDING,
        limit,
      }
    )
    const results: Out[] = []
    for (const env of envelopes) {
      if (!env.message) continue
      try {
        const res = await mapper(env)
        results.push(res)
      } catch (e) {
        console.warn('Error in listEnvelopes mapper', e)
      }
    }
    return results
  }
}
