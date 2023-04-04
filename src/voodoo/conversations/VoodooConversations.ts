import { Mutex } from 'async-mutex'
import VoodooClient from '../VoodooClient'
import VoodooConversation from './VoodooConversation'

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
}
