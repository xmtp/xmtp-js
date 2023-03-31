// TODO: this is a hacky wrapper class for a Voodoo contact,
// currently represented by the entire contact's VoodooInstance
export class VoodooContact {
  address: string
  voodooInstance: any

  constructor(address: string, voodooInstance: any) {
    this.address = address
    this.voodooInstance = voodooInstance
  }
}

/**
 * Class that manages Voodoo state such as:
 * - sessions
 * - contacts
 * - encoding and decoding messages
 *
 * NOTE: there is a lot of duplication with Client.ts, but by
 * making a dedicated class we can keep the logic clean for
 * our own reasoning. Client.ts will consume the VoodooManager
 * for now.
 */
export default class VoodooManager {
  address: string
  voodooInstance: any
  // For now contacts are a map of address to VoodooInstance, all local
  contacts: Map<string, VoodooContact> = new Map()

  constructor(address: string, voodooInstance: any) {
    this.address = address
    this.voodooInstance = voodooInstance
  }

  // Get the topic to get contact info for a given address
  // hack: look for "voodoo-contact-[address]"
  getContactTopic(address: string): string {
    return `voodoo-contact-${address}`
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
    console.log('vooodooInstance', this.voodooInstance)
    console.log('contactInstance', contactInstance)
    const outbound = await this.voodooInstance.createOutboundSession(
      contactInstance,
      initialMessage
    )
    console.log('outbound', outbound)
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
    const inboundPlaintext = await contactInstance.createInboundSession(
      this.voodooInstance,
      inboundJson
    )
    return inboundPlaintext
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
