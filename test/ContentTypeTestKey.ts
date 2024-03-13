import type { ContentCodec, EncodedContent } from '@/MessageContent'
import { ContentTypeId } from '@/MessageContent'
import { PublicKey } from '@/crypto/PublicKey'
import { publicKey } from '@xmtp/proto'

export const ContentTypeTestKey = new ContentTypeId({
  authorityId: 'xmtp.test',
  typeId: 'public-key',
  versionMajor: 1,
  versionMinor: 0,
})

export class TestKeyCodec implements ContentCodec<PublicKey> {
  get contentType(): ContentTypeId {
    return ContentTypeTestKey
  }

  encode(key: PublicKey): EncodedContent {
    return {
      type: ContentTypeTestKey,
      parameters: {},
      content: publicKey.PublicKey.encode(key).finish(),
    }
  }

  decode(content: EncodedContent): PublicKey {
    return new PublicKey(publicKey.PublicKey.decode(content.content))
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fallback(content: PublicKey): string | undefined {
    return 'publickey bundle'
  }

  shouldPush() {
    return false
  }
}
