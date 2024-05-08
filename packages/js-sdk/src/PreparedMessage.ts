import type { Envelope } from '@xmtp/proto/ts/dist/types/message_api/v1/message_api.pb'
import { sha256 } from './crypto/encryption'
import { bytesToHex } from './crypto/utils'
import type { DecodedMessage } from './Message'

export class PreparedMessage {
  messageEnvelope: Envelope
  onSend: () => Promise<DecodedMessage>

  constructor(
    messageEnvelope: Envelope,
    onSend: () => Promise<DecodedMessage>
  ) {
    this.messageEnvelope = messageEnvelope
    this.onSend = onSend
  }

  async messageID(): Promise<string> {
    if (!this.messageEnvelope.message) {
      throw new Error('no envelope message')
    }

    return bytesToHex(await sha256(this.messageEnvelope.message))
  }

  async send() {
    return this.onSend()
  }
}
