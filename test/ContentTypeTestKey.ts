import * as proto from '../src/proto/messaging'
import { ContentTypeId, ContentCodec, PublicKey, EncodedContent } from '../src'

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
      content: proto.PublicKey.encode(key).finish(),
    }
  }

  decode(content: EncodedContent): PublicKey {
    return new PublicKey(proto.PublicKey.decode(content.content))
  }
}
