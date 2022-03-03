import * as proto from '../src/proto/messaging'
import {
  ContentTypeId,
  ContentEncoder,
  PublicKey,
  EncodedContent,
} from '../src'

export const ContentTypeTestKey = {
  authorityId: 'xmtp.test',
  typeId: 'public-key',
  versionMajor: 1,
  versionMinor: 0,
}

export class TestKeyContentEncoder implements ContentEncoder<PublicKey> {
  get contentType(): ContentTypeId {
    return ContentTypeTestKey
  }

  encode(key: PublicKey): EncodedContent {
    return {
      contentType: ContentTypeTestKey,
      contentTypeParams: {},
      content: proto.PublicKey.encode(key).finish(),
    }
  }

  decode(content: EncodedContent): PublicKey {
    return new PublicKey(proto.PublicKey.decode(content.content))
  }
}
