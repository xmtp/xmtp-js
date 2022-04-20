/* eslint-disable */
import Long from 'long'
import _m0 from 'protobufjs/minimal'
import { WakuMessage } from './waku_message'

export const protobufPackage = 'waku.v2'

export interface FilterRequest {
  subscribe: boolean
  topic: string
  contentFilters: FilterRequest_ContentFilter[]
}

export interface FilterRequest_ContentFilter {
  contentTopic: string
}

export interface MessagePush {
  messages: WakuMessage[]
}

export interface FilterRPC {
  requestId: string
  request: FilterRequest | undefined
  push: MessagePush | undefined
}

function createBaseFilterRequest(): FilterRequest {
  return { subscribe: false, topic: '', contentFilters: [] }
}

export const FilterRequest = {
  encode(
    message: FilterRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.subscribe === true) {
      writer.uint32(8).bool(message.subscribe)
    }
    if (message.topic !== '') {
      writer.uint32(18).string(message.topic)
    }
    for (const v of message.contentFilters) {
      FilterRequest_ContentFilter.encode(v!, writer.uint32(26).fork()).ldelim()
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FilterRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseFilterRequest()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.subscribe = reader.bool()
          break
        case 2:
          message.topic = reader.string()
          break
        case 3:
          message.contentFilters.push(
            FilterRequest_ContentFilter.decode(reader, reader.uint32())
          )
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): FilterRequest {
    return {
      subscribe: isSet(object.subscribe) ? Boolean(object.subscribe) : false,
      topic: isSet(object.topic) ? String(object.topic) : '',
      contentFilters: Array.isArray(object?.contentFilters)
        ? object.contentFilters.map((e: any) =>
            FilterRequest_ContentFilter.fromJSON(e)
          )
        : [],
    }
  },

  toJSON(message: FilterRequest): unknown {
    const obj: any = {}
    message.subscribe !== undefined && (obj.subscribe = message.subscribe)
    message.topic !== undefined && (obj.topic = message.topic)
    if (message.contentFilters) {
      obj.contentFilters = message.contentFilters.map((e) =>
        e ? FilterRequest_ContentFilter.toJSON(e) : undefined
      )
    } else {
      obj.contentFilters = []
    }
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<FilterRequest>, I>>(
    object: I
  ): FilterRequest {
    const message = createBaseFilterRequest()
    message.subscribe = object.subscribe ?? false
    message.topic = object.topic ?? ''
    message.contentFilters =
      object.contentFilters?.map((e) =>
        FilterRequest_ContentFilter.fromPartial(e)
      ) || []
    return message
  },
}

function createBaseFilterRequest_ContentFilter(): FilterRequest_ContentFilter {
  return { contentTopic: '' }
}

export const FilterRequest_ContentFilter = {
  encode(
    message: FilterRequest_ContentFilter,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.contentTopic !== '') {
      writer.uint32(10).string(message.contentTopic)
    }
    return writer
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): FilterRequest_ContentFilter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseFilterRequest_ContentFilter()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.contentTopic = reader.string()
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): FilterRequest_ContentFilter {
    return {
      contentTopic: isSet(object.contentTopic)
        ? String(object.contentTopic)
        : '',
    }
  },

  toJSON(message: FilterRequest_ContentFilter): unknown {
    const obj: any = {}
    message.contentTopic !== undefined &&
      (obj.contentTopic = message.contentTopic)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<FilterRequest_ContentFilter>, I>>(
    object: I
  ): FilterRequest_ContentFilter {
    const message = createBaseFilterRequest_ContentFilter()
    message.contentTopic = object.contentTopic ?? ''
    return message
  },
}

function createBaseMessagePush(): MessagePush {
  return { messages: [] }
}

export const MessagePush = {
  encode(
    message: MessagePush,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.messages) {
      WakuMessage.encode(v!, writer.uint32(10).fork()).ldelim()
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MessagePush {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseMessagePush()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.messages.push(WakuMessage.decode(reader, reader.uint32()))
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): MessagePush {
    return {
      messages: Array.isArray(object?.messages)
        ? object.messages.map((e: any) => WakuMessage.fromJSON(e))
        : [],
    }
  },

  toJSON(message: MessagePush): unknown {
    const obj: any = {}
    if (message.messages) {
      obj.messages = message.messages.map((e) =>
        e ? WakuMessage.toJSON(e) : undefined
      )
    } else {
      obj.messages = []
    }
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<MessagePush>, I>>(
    object: I
  ): MessagePush {
    const message = createBaseMessagePush()
    message.messages =
      object.messages?.map((e) => WakuMessage.fromPartial(e)) || []
    return message
  },
}

function createBaseFilterRPC(): FilterRPC {
  return { requestId: '', request: undefined, push: undefined }
}

export const FilterRPC = {
  encode(
    message: FilterRPC,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.requestId !== '') {
      writer.uint32(10).string(message.requestId)
    }
    if (message.request !== undefined) {
      FilterRequest.encode(message.request, writer.uint32(18).fork()).ldelim()
    }
    if (message.push !== undefined) {
      MessagePush.encode(message.push, writer.uint32(26).fork()).ldelim()
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FilterRPC {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseFilterRPC()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.requestId = reader.string()
          break
        case 2:
          message.request = FilterRequest.decode(reader, reader.uint32())
          break
        case 3:
          message.push = MessagePush.decode(reader, reader.uint32())
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): FilterRPC {
    return {
      requestId: isSet(object.requestId) ? String(object.requestId) : '',
      request: isSet(object.request)
        ? FilterRequest.fromJSON(object.request)
        : undefined,
      push: isSet(object.push) ? MessagePush.fromJSON(object.push) : undefined,
    }
  },

  toJSON(message: FilterRPC): unknown {
    const obj: any = {}
    message.requestId !== undefined && (obj.requestId = message.requestId)
    message.request !== undefined &&
      (obj.request = message.request
        ? FilterRequest.toJSON(message.request)
        : undefined)
    message.push !== undefined &&
      (obj.push = message.push ? MessagePush.toJSON(message.push) : undefined)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<FilterRPC>, I>>(
    object: I
  ): FilterRPC {
    const message = createBaseFilterRPC()
    message.requestId = object.requestId ?? ''
    message.request =
      object.request !== undefined && object.request !== null
        ? FilterRequest.fromPartial(object.request)
        : undefined
    message.push =
      object.push !== undefined && object.push !== null
        ? MessagePush.fromPartial(object.push)
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
