import type { ContentCodec } from '@xmtp/content-type-primitives'
import type Client from '@/Client'

export type GetMessageContentTypeFromClient<C> =
  C extends Client<infer T> ? T : never

export type ExtractDecodedType<C> = C extends ContentCodec<infer T> ? T : never
