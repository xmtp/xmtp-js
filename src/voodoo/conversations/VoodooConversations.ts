import VoodooClient from '../voodoo/Client'
import VoodooConversation from '../voodoo/VoodooConversation'

export default class VoodooConversations {
  private client: VoodooClient
  private conversations: Map<string, VoodooConversation> = new Map()
  private v2Mutex: Mutex

  constructor(client: VoodooClient) {
    this.client = client
    this.v2Mutex = new Mutex()
  }
}
