import xmtpv3 from 'xmtpv3'

// TODO: this is a hacky wrapper class for a Voodoo contact,
// currently represented by the entire contact's VoodooInstance
// - should be changed to align with VoodooPublicAccount (or whatever)
// it ends up being named in Rust
export class VoodooContact {
  address: string
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
  // For now contacts are a map of address to VoodooInstance, all local
  contacts: Map<string, VoodooContact> = new Map()

  constructor(address: string, voodooInstance: any) {
    this.address = address
    this.voodooInstance = voodooInstance
  }

  static async create(address: string): Promise<VoodooClient> {
    const xmtpWasm = await xmtpv3.XMTPWasm.initialize()
    // TODO: STARTINGTASK: this just creates unused voodoo keys that go nowhere
    const myVoodoo = xmtpWasm.newVoodooInstance()
    return new VoodooClient(address, myVoodoo)
  }

  setContact(address: string, contactInfo: VoodooContact) {
    this.contacts.set(address, contactInfo)
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
    const outbound = await this.voodooInstance.createOutboundSession(
      contactInstance,
      initialMessage
    )
    return outbound
  }

  // NOTE: this is a test-only method that spoofs another voodoo account
  // in order to read your own outbound messages
  async readMessageAsOther(
    contactAddress: string,
    inboundJson: string
  ): Promise<string> {
    // Get the contact info which is just a handle for now
    const contactInstance = this.contacts.get(contactAddress)?.voodooInstance
    if (!contactInstance) {
      throw new Error(`No contact info for ${contactAddress}`)
    }
    try {
      const inboundPlaintext = await contactInstance.createInboundSession(
        this.voodooInstance,
        inboundJson
      )
      return inboundPlaintext
    } catch (e) {
      console.log('got error', e)
      // Try the other way around
      const inboundPlaintext = await this.voodooInstance.createInboundSession(
        contactInstance,
        inboundJson
      )
      console.log('inboundPlaintext 2nd try', inboundPlaintext)
      return inboundPlaintext
    }
    throw new Error('Could not read message')
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
    const inboundPlaintext = await this.voodooInstance.createInboundSession(
      contactInstance,
      inboundJson
    )
    return inboundPlaintext
  }
}
