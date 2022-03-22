/* eslint-disable */
import Long from 'long'
import _m0 from 'protobufjs/minimal'
import { EncodedContent } from './messaging'

export const protobufPackage = ''

export interface Composite {
  parts: EncodedContent[]
}

function createBaseComposite(): Composite {
  return { parts: [] }
}

export const Composite = {
  encode(
    message: Composite,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.parts) {
      EncodedContent.encode(v!, writer.uint32(10).fork()).ldelim()
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Composite {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseComposite()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.parts.push(EncodedContent.decode(reader, reader.uint32()))
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): Composite {
    return {
      parts: Array.isArray(object?.parts)
        ? object.parts.map((e: any) => EncodedContent.fromJSON(e))
        : [],
    }
  },

  toJSON(message: Composite): unknown {
    const obj: any = {}
    if (message.parts) {
      obj.parts = message.parts.map((e) =>
        e ? EncodedContent.toJSON(e) : undefined
      )
    } else {
      obj.parts = []
    }
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<Composite>, I>>(
    object: I
  ): Composite {
    const message = createBaseComposite()
    message.parts =
      object.parts?.map((e) => EncodedContent.fromPartial(e)) || []
    return message
  },
}

type Builtin =
  | Date
  | Function
  | Uint8Array
  | string
  | number
  | boolean
  | undefined

export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>

type KeysOfUnion<T> = T extends T ? keyof T : never
export type Exact<P, I extends P> = P extends Builtin
  ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & Record<
        Exclude<keyof I, KeysOfUnion<P>>,
        never
      >

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any
  _m0.configure()
}
