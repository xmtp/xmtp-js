// This creates an interface for storing data to the storage network.
import { Store } from './Store'
import { buildUserPrivateStoreTopic } from '../utils'
import {
  DirectSecp256k1HdWallet,
  OfflineDirectSigner,
} from '@cosmjs/proto-signing'
import { queryClient, txClient } from '../xmtp'
import { bytesToHex, hexToBytes } from '../crypto/utils'

// export default class NetworkStore implements Store {
//   private setter: OfflineDirectSigner | undefined

//   // Returns the first record in a topic if it is present.
//   async get(key: string): Promise<Buffer | null> {
//     const client = await queryClient()
//     const res = await client.queryMessages({
//       topic: this.buildTopic(key),
//     })
//     const keys = await Promise.all(
//       res.data.messages?.map((msg) => hexToBytes(msg.content || '')) || []
//     )
//     if (!keys?.length) {
//       return null
//     }
//     return Buffer.from(keys[0])
//   }

//   async set(key: string, value: Buffer): Promise<void> {
//     const keys = Uint8Array.from(value)
//     if (!this.setter) {
//       this.setter = await DirectSecp256k1HdWallet.generate()
//       const accounts = await this.setter.getAccounts()
//       const address = accounts[0].address
//       await fetch('http://localhost:4500', {
//         method: 'POST',
//         headers: {
//           Accept: 'application/json',
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           address: address,
//           coins: ['10token'],
//         }),
//       })
//     }
//     const client = await txClient(this.setter)
//     const accountAddr = (await this.setter.getAccounts())[0].address
//     await client.signAndBroadcast([
//       client.msgCreateMessage({
//         actor: {
//           account: accountAddr,
//         },
//         message: {
//           id: '',
//           topic: this.buildTopic(key),
//           updated_at: 0,
//           created_at: 0,
//           content: bytesToHex(keys),
//         },
//       }),
//     ])
//   }

//   private buildTopic(key: string): string {
//     return buildUserPrivateStoreTopic(key)
//   }
// }
