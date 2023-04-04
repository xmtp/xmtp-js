import xmtpv3 from 'xmtpv3_wasm'

import {
  buildVoodooUserContactTopic,
  buildVoodooUserInviteTopic,
} from './utils'
import ApiClient, { SortDirection } from '../ApiClient'
import { fetcher } from '@xmtp/proto'
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
  // For now contacts are a map of address to VoodooInstance, all local
  contacts: Map<string, VoodooContact> = new Map()
  wasm: xmtpv3.XMTPWasm

  constructor(address: string, voodooInstance: any, apiClient: ApiClient, wasm: xmtpv3.XMTPWasm) {
    this.address = address
    this.voodooInstance = voodooInstance
    this.apiClient = apiClient
    this.wasm = wasm
  }

  static async create(
    address: string,
    apiClient: ApiClient
  ): Promise<VoodooClient> {
    const xmtpWasm = await xmtpv3.XMTPWasm.initialize()
    // TODO: STARTINGTASK: this just creates unused voodoo keys that go nowhere
    const myVoodoo = xmtpWasm.newVoodooInstance()
    return new VoodooClient(address, myVoodoo, apiClient, xmtpWasm)
  }

  get contact(): VoodooContact {
    return {
      address: this.address,
      voodooInstance: this.voodooInstance,
    }
  }

  setContact(contactInfo: VoodooContact) {
    this.contacts.set(contactInfo.address, contactInfo)
  }

  getContact(address: string): VoodooContact | undefined {
    return this.contacts.get(address)
  }

  // Get the JSON from creating an outbound session with a contact
  async getOutboundSessionJson(
    contactAddress: string,
    initialMessage: string
  ): Promise<string> {
    // Get the contact info which is just a handle for now
    const contactInstance = this.contacts.get(contactAddress)?.voodooInstance
    if (!contactInstance) {
      throw new Error(`No contact info for ${contactAddress}`)
    }
    const outboundObject = await this.voodooInstance.createOutboundSession(
      contactInstance,
      initialMessage
    )
    // outboundTuple should comprise (sessionId, outboundCiphertextJson)
    // TODO: as temporary measure until we export types in xmtpv3_wasm, just
    // discard the sessionId for testing
    const outboundCiphertext = outboundObject.payload
    return outboundCiphertext
  }

  // Get the JSON from creating an inbound session
  async processInboundSessionJson(
    contactAddress: string,
    inboundJson: string
  ): Promise<string> {
    // Get the contact info which is just a handle for now
    const contactInstance = this.contacts.get(contactAddress)?.voodooInstance
    if (!contactInstance) {
      throw new Error(`No contact info for ${contactAddress}`)
    }
    const inboundResponse = await this.voodooInstance.createInboundSession(
      contactInstance,
      inboundJson
    )
    // inboundTuple should comprise (sessionId, inboundPlaintext)
    // TODO: as temporary measure until we export types in xmtpv3_wasm, just
    // discard the sessionId for testing
    const inboundPlaintext = inboundResponse.payload
    return inboundPlaintext
  }

  /**
   * Retrieve a voodoo public identity from given user's contact topic
   * TODO: needs to be reworked as part of public/private key split
   */
  async getUserContactFromNetwork(
    apiClient: ApiClient,
    peerAddress: string
  ): Promise<VoodooContact | undefined> {
    const stream = apiClient.queryIterator(
      { contentTopic: buildVoodooUserContactTopic(peerAddress) },
      { pageSize: 5, direction: SortDirection.SORT_DIRECTION_DESCENDING }
    )

    for await (const env of stream) {
      if (!env.message) {
        continue
      }
      // TODO: need to use more than just the public JSON, need to define a proto or class
      // that includes a signature etc
      const voodooPublicJson = b64Decode(env.message.toString())

      // TODO: do validation here of the address signature
      const voodooInstance = this.wasm.addOrGetPublicAccountFromJSON(
        new TextDecoder().decode(voodooPublicJson)
      )
      return new VoodooContact(peerAddress, voodooInstance)
    }
    return undefined
  }
}
