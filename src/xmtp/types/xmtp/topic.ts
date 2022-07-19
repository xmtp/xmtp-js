// @ts-nocheck
/* eslint-disable */
import * as Long from 'long'
import { util, configure, Writer, Reader } from 'protobufjs/minimal'

export const protobufPackage = 'xmtp.xmtp'

export interface Topic {
  id: string
  creator: string
  created_at: number
  updated_at: number
  owners: string[]
  writers: string[]
  readers: string[]
}

const baseTopic: object = {
  id: '',
  creator: '',
  created_at: 0,
  updated_at: 0,
  owners: '',
  writers: '',
  readers: '',
}

export const Topic = {
  encode(message: Topic, writer: Writer = Writer.create()): Writer {
    if (message.id !== '') {
      writer.uint32(10).string(message.id)
    }
    if (message.creator !== '') {
      writer.uint32(18).string(message.creator)
    }
    if (message.created_at !== 0) {
      writer.uint32(24).uint64(message.created_at)
    }
    if (message.updated_at !== 0) {
      writer.uint32(32).uint64(message.updated_at)
    }
    for (const v of message.owners) {
      writer.uint32(42).string(v!)
    }
    for (const v of message.writers) {
      writer.uint32(50).string(v!)
    }
    for (const v of message.readers) {
      writer.uint32(58).string(v!)
    }
    return writer
  },

  decode(input: Reader | Uint8Array, length?: number): Topic {
    const reader = input instanceof Uint8Array ? new Reader(input) : input
    let end = length === undefined ? reader.len : reader.pos + length
    const message = { ...baseTopic } as Topic
    message.owners = []
    message.writers = []
    message.readers = []
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.id = reader.string()
          break
        case 2:
          message.creator = reader.string()
          break
        case 3:
          message.created_at = longToNumber(reader.uint64() as Long)
          break
        case 4:
          message.updated_at = longToNumber(reader.uint64() as Long)
          break
        case 5:
          message.owners.push(reader.string())
          break
        case 6:
          message.writers.push(reader.string())
          break
        case 7:
          message.readers.push(reader.string())
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): Topic {
    const message = { ...baseTopic } as Topic
    message.owners = []
    message.writers = []
    message.readers = []
    if (object.id !== undefined && object.id !== null) {
      message.id = String(object.id)
    } else {
      message.id = ''
    }
    if (object.creator !== undefined && object.creator !== null) {
      message.creator = String(object.creator)
    } else {
      message.creator = ''
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
    if (object.owners !== undefined && object.owners !== null) {
      for (const e of object.owners) {
        message.owners.push(String(e))
      }
    }
    if (object.writers !== undefined && object.writers !== null) {
      for (const e of object.writers) {
        message.writers.push(String(e))
      }
    }
    if (object.readers !== undefined && object.readers !== null) {
      for (const e of object.readers) {
        message.readers.push(String(e))
      }
    }
    return message
  },

  toJSON(message: Topic): unknown {
    const obj: any = {}
    message.id !== undefined && (obj.id = message.id)
    message.creator !== undefined && (obj.creator = message.creator)
    message.created_at !== undefined && (obj.created_at = message.created_at)
    message.updated_at !== undefined && (obj.updated_at = message.updated_at)
    if (message.owners) {
      obj.owners = message.owners.map((e) => e)
    } else {
      obj.owners = []
    }
    if (message.writers) {
      obj.writers = message.writers.map((e) => e)
    } else {
      obj.writers = []
    }
    if (message.readers) {
      obj.readers = message.readers.map((e) => e)
    } else {
      obj.readers = []
    }
    return obj
  },

  fromPartial(object: DeepPartial<Topic>): Topic {
    const message = { ...baseTopic } as Topic
    message.owners = []
    message.writers = []
    message.readers = []
    if (object.id !== undefined && object.id !== null) {
      message.id = object.id
    } else {
      message.id = ''
    }
    if (object.creator !== undefined && object.creator !== null) {
      message.creator = object.creator
    } else {
      message.creator = ''
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
    if (object.owners !== undefined && object.owners !== null) {
      for (const e of object.owners) {
        message.owners.push(e)
      }
    }
    if (object.writers !== undefined && object.writers !== null) {
      for (const e of object.writers) {
        message.writers.push(e)
      }
    }
    if (object.readers !== undefined && object.readers !== null) {
      for (const e of object.readers) {
        message.readers.push(e)
      }
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
