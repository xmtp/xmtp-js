/* eslint-disable */
import Long from 'long'
import _m0 from 'protobufjs/minimal'

export const protobufPackage = 'waku.v2'

export interface WakuMessage {
  payload?: Uint8Array | undefined
  contentTopic?: string | undefined
  version?: number | undefined
  timestampDeprecated?: number | undefined
  timestamp?: Long | undefined
}

function createBaseWakuMessage(): WakuMessage {
  return {
    payload: undefined,
    contentTopic: undefined,
    version: undefined,
    timestampDeprecated: undefined,
    timestamp: undefined,
  }
}

export const WakuMessage = {
  encode(
    message: WakuMessage,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.payload !== undefined) {
      writer.uint32(10).bytes(message.payload)
    }
    if (message.contentTopic !== undefined) {
      writer.uint32(18).string(message.contentTopic)
    }
    if (message.version !== undefined) {
      writer.uint32(24).uint32(message.version)
    }
    if (message.timestampDeprecated !== undefined) {
      writer.uint32(33).double(message.timestampDeprecated)
    }
    if (message.timestamp !== undefined) {
      writer.uint32(80).sint64(message.timestamp)
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): WakuMessage {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseWakuMessage()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.payload = reader.bytes()
          break
        case 2:
          message.contentTopic = reader.string()
          break
        case 3:
          message.version = reader.uint32()
          break
        case 4:
          message.timestampDeprecated = reader.double()
          break
        case 10:
          message.timestamp = reader.sint64() as Long
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): WakuMessage {
    return {
      payload: isSet(object.payload)
        ? bytesFromBase64(object.payload)
        : undefined,
      contentTopic: isSet(object.contentTopic)
        ? String(object.contentTopic)
        : undefined,
      version: isSet(object.version) ? Number(object.version) : undefined,
      timestampDeprecated: isSet(object.timestampDeprecated)
        ? Number(object.timestampDeprecated)
        : undefined,
      timestamp: isSet(object.timestamp)
        ? Long.fromString(object.timestamp)
        : undefined,
    }
  },

  toJSON(message: WakuMessage): unknown {
    const obj: any = {}
    message.payload !== undefined &&
      (obj.payload =
        message.payload !== undefined
          ? base64FromBytes(message.payload)
          : undefined)
    message.contentTopic !== undefined &&
      (obj.contentTopic = message.contentTopic)
    message.version !== undefined && (obj.version = Math.round(message.version))
    message.timestampDeprecated !== undefined &&
      (obj.timestampDeprecated = message.timestampDeprecated)
    message.timestamp !== undefined &&
      (obj.timestamp = (message.timestamp || undefined).toString())
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<WakuMessage>, I>>(
    object: I
  ): WakuMessage {
    const message = createBaseWakuMessage()
    message.payload = object.payload ?? undefined
    message.contentTopic = object.contentTopic ?? undefined
    message.version = object.version ?? undefined
    message.timestampDeprecated = object.timestampDeprecated ?? undefined
    message.timestamp =
      object.timestamp !== undefined && object.timestamp !== null
        ? Long.fromValue(object.timestamp)
        : undefined
    return message
  },
}

declare var self: any | undefined
declare var window: any | undefined
declare var global: any | undefined
var globalThis: any = (() => {
  if (typeof globalThis !== 'undefined') return globalThis
  if (typeof self !== 'undefined') return self
  if (typeof window !== 'undefined') return window
  if (typeof global !== 'undefined') return global
  throw 'Unable to locate global object'
})()

const atob: (b64: string) => string =
  globalThis.atob ||
  ((b64) => globalThis.Buffer.from(b64, 'base64').toString('binary'))
function bytesFromBase64(b64: string): Uint8Array {
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; ++i) {
    arr[i] = bin.charCodeAt(i)
  }
  return arr
}

const btoa: (bin: string) => string =
  globalThis.btoa ||
  ((bin) => globalThis.Buffer.from(bin, 'binary').toString('base64'))
function base64FromBytes(arr: Uint8Array): string {
  const bin: string[] = []
  for (const byte of arr) {
    bin.push(String.fromCharCode(byte))
  }
  return btoa(bin.join(''))
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
  : T extends Long
  ? string | number | Long
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
