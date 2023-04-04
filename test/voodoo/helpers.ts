import { Wallet } from 'ethers'
import { ClientOptions, Client } from '../../src'
import {
  default as VoodooClient,
  VoodooContact,
} from '../../src/voodoo/VoodooClient'
import { pollFor, newWallet } from '../helpers'
import assert from 'assert'

// client running against local node running on the host,
export const newLocalHostVoodooClient = (
  opts?: Partial<ClientOptions>
): Promise<VoodooClient> =>
  Client.createVoodoo(newWallet(), {
    env: 'local',
    ...opts,
  })

export async function waitForUserContact(
  c1: VoodooClient,
  c2: VoodooClient
): Promise<VoodooContact> {
  return pollFor(
    async () => {
      const contact = await c1.getUserContactFromNetwork(c2.address)
      assert.ok(contact)
      return contact
    },
    20000,
    200
  )
}
