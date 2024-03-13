import type Client from '@/Client'
import type { ContentCodec } from '@/MessageContent'

export type GetMessageContentTypeFromClient<C> =
  C extends Client<infer T> ? T : never

export type ExtractDecodedType<C> = C extends ContentCodec<infer T> ? T : never
