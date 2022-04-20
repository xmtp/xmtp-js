/* eslint-disable */
import Long from 'long'
import _m0 from 'protobufjs/minimal'
import { EncodedContent } from './messaging'

export const protobufPackage = ''

/** Composite is used to implement xmtp.org/composite content type */
export interface Composite {
  parts: Composite_Part[]
}

export interface Composite_Part {
  part: EncodedContent | undefined
  composite: Composite | undefined
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
      Composite_Part.encode(v!, writer.uint32(10).fork()).ldelim()
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
          message.parts.push(Composite_Part.decode(reader, reader.uint32()))
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
        ? object.parts.map((e: any) => Composite_Part.fromJSON(e))
        : [],
    }
  },

  toJSON(message: Composite): unknown {
    const obj: any = {}
    if (message.parts) {
      obj.parts = message.parts.map((e) =>
        e ? Composite_Part.toJSON(e) : undefined
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
      object.parts?.map((e) => Composite_Part.fromPartial(e)) || []
    return message
  },
}

function createBaseComposite_Part(): Composite_Part {
  return { part: undefined, composite: undefined }
}

export const Composite_Part = {
  encode(
    message: Composite_Part,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.part !== undefined) {
      EncodedContent.encode(message.part, writer.uint32(10).fork()).ldelim()
    }
    if (message.composite !== undefined) {
      Composite.encode(message.composite, writer.uint32(18).fork()).ldelim()
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Composite_Part {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseComposite_Part()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.part = EncodedContent.decode(reader, reader.uint32())
          break
        case 2:
          message.composite = Composite.decode(reader, reader.uint32())
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): Composite_Part {
    return {
      part: isSet(object.part)
        ? EncodedContent.fromJSON(object.part)
        : undefined,
      composite: isSet(object.composite)
        ? Composite.fromJSON(object.composite)
        : undefined,
    }
  },

  toJSON(message: Composite_Part): unknown {
    const obj: any = {}
    message.part !== undefined &&
      (obj.part = message.part
        ? EncodedContent.toJSON(message.part)
        : undefined)
    message.composite !== undefined &&
      (obj.composite = message.composite
        ? Composite.toJSON(message.composite)
        : undefined)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<Composite_Part>, I>>(
    object: I
  ): Composite_Part {
    const message = createBaseComposite_Part()
    message.part =
      object.part !== undefined && object.part !== null
        ? EncodedContent.fromPartial(object.part)
        : undefined
    message.composite =
      object.composite !== undefined && object.composite !== null
        ? Composite.fromPartial(object.composite)
        : undefined
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

function isSet(value: any): boolean {
  return value !== null && value !== undefined
}
