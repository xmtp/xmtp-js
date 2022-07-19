// @ts-nocheck
/* eslint-disable */
import * as Long from 'long'
import { util, configure, Writer, Reader } from 'protobufjs/minimal'

export const protobufPackage = 'xmtp.xmtp'

export interface Message {
  id: string
  created_at: number
  updated_at: number
  topic: string
  content: string
}

const baseMessage: object = {
  id: '',
  created_at: 0,
  updated_at: 0,
  topic: '',
  content: '',
}

export const Message = {
  encode(message: Message, writer: Writer = Writer.create()): Writer {
    if (message.id !== '') {
      writer.uint32(10).string(message.id)
    }
    if (message.created_at !== 0) {
      writer.uint32(16).uint64(message.created_at)
    }
    if (message.updated_at !== 0) {
      writer.uint32(24).uint64(message.updated_at)
    }
    if (message.topic !== '') {
      writer.uint32(34).string(message.topic)
    }
    if (message.content !== '') {
      writer.uint32(42).string(message.content)
    }
    return writer
  },

  decode(input: Reader | Uint8Array, length?: number): Message {
    const reader = input instanceof Uint8Array ? new Reader(input) : input
    let end = length === undefined ? reader.len : reader.pos + length
    const message = { ...baseMessage } as Message
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.id = reader.string()
          break
        case 2:
          message.created_at = longToNumber(reader.uint64() as Long)
          break
        case 3:
          message.updated_at = longToNumber(reader.uint64() as Long)
          break
        case 4:
          message.topic = reader.string()
          break
        case 5:
          message.content = reader.string()
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): Message {
    const message = { ...baseMessage } as Message
    if (object.id !== undefined && object.id !== null) {
      message.id = String(object.id)
    } else {
      message.id = ''
    }
    if (object.created_at !== undefined && object.created_at !== null) {
      message.created_at = Number(object.created_at)
    } else {
      message.created_at = 0
    }
    if (object.updated_at !== undefined && object.updated_at !== null) {
      message.updated_at = Number(object.updated_at)
    } else {
      message.updated_at = 0
    }
    if (object.topic !== undefined && object.topic !== null) {
      message.topic = String(object.topic)
    } else {
      message.topic = ''
    }
    if (object.content !== undefined && object.content !== null) {
      message.content = String(object.content)
    } else {
      message.content = ''
    }
    return message
  },

  toJSON(message: Message): unknown {
    const obj: any = {}
    message.id !== undefined && (obj.id = message.id)
    message.created_at !== undefined && (obj.created_at = message.created_at)
    message.updated_at !== undefined && (obj.updated_at = message.updated_at)
    message.topic !== undefined && (obj.topic = message.topic)
    message.content !== undefined && (obj.content = message.content)
    return obj
  },

  fromPartial(object: DeepPartial<Message>): Message {
    const message = { ...baseMessage } as Message
    if (object.id !== undefined && object.id !== null) {
      message.id = object.id
    } else {
      message.id = ''
    }
    if (object.created_at !== undefined && object.created_at !== null) {
      message.created_at = object.created_at
    } else {
      message.created_at = 0
    }
    if (object.updated_at !== undefined && object.updated_at !== null) {
      message.updated_at = object.updated_at
    } else {
      message.updated_at = 0
    }
    if (object.topic !== undefined && object.topic !== null) {
      message.topic = object.topic
    } else {
      message.topic = ''
    }
    if (object.content !== undefined && object.content !== null) {
      message.content = object.content
    } else {
      message.content = ''
    }
    return message
  },
}

declare var self: any | undefined
declare var window: any | undefined
var globalThis: any = (() => {
  if (typeof globalThis !== 'undefined') return globalThis
  if (typeof self !== 'undefined') return self
  if (typeof window !== 'undefined') return window
  if (typeof global !== 'undefined') return global
  throw 'Unable to locate global object'
})()

type Builtin = Date | Function | Uint8Array | string | number | undefined
export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>

function longToNumber(long: Long): number {
  if (long.gt(Number.MAX_SAFE_INTEGER)) {
    throw new globalThis.Error('Value is larger than Number.MAX_SAFE_INTEGER')
  }
  return long.toNumber()
}

if (util.Long !== Long) {
  util.Long = Long as any
  configure()
}
