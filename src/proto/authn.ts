/* eslint-disable */
import Long from 'long'
import _m0 from 'protobufjs/minimal'
import { Signature } from './messaging'

export const protobufPackage = ''

export interface V1ClientAuthnRequest {
  identityKeyBytes: Uint8Array
  walletSignature: Signature | undefined
  authnDataBytes: Uint8Array
  authnSignature: Signature | undefined
}

export interface ClientAuthnRequest {
  v1: V1ClientAuthnRequest | undefined
}

export interface V1ClientAuthnResponse {
  authnSuccessful: boolean
  errorStr: string
}

export interface ClientAuthnResponse {
  v1: V1ClientAuthnResponse | undefined
}

export interface AuthnData {
  walletAddr: string
  peerId: string
  timestamp: number
}

function createBaseV1ClientAuthnRequest(): V1ClientAuthnRequest {
  return {
    identityKeyBytes: new Uint8Array(),
    walletSignature: undefined,
    authnDataBytes: new Uint8Array(),
    authnSignature: undefined,
  }
}

export const V1ClientAuthnRequest = {
  encode(
    message: V1ClientAuthnRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.identityKeyBytes.length !== 0) {
      writer.uint32(10).bytes(message.identityKeyBytes)
    }
    if (message.walletSignature !== undefined) {
      Signature.encode(
        message.walletSignature,
        writer.uint32(18).fork()
      ).ldelim()
    }
    if (message.authnDataBytes.length !== 0) {
      writer.uint32(26).bytes(message.authnDataBytes)
    }
    if (message.authnSignature !== undefined) {
      Signature.encode(
        message.authnSignature,
        writer.uint32(34).fork()
      ).ldelim()
    }
    return writer
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): V1ClientAuthnRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseV1ClientAuthnRequest()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.identityKeyBytes = reader.bytes()
          break
        case 2:
          message.walletSignature = Signature.decode(reader, reader.uint32())
          break
        case 3:
          message.authnDataBytes = reader.bytes()
          break
        case 4:
          message.authnSignature = Signature.decode(reader, reader.uint32())
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): V1ClientAuthnRequest {
    return {
      identityKeyBytes: isSet(object.identityKeyBytes)
        ? bytesFromBase64(object.identityKeyBytes)
        : new Uint8Array(),
      walletSignature: isSet(object.walletSignature)
        ? Signature.fromJSON(object.walletSignature)
        : undefined,
      authnDataBytes: isSet(object.authnDataBytes)
        ? bytesFromBase64(object.authnDataBytes)
        : new Uint8Array(),
      authnSignature: isSet(object.authnSignature)
        ? Signature.fromJSON(object.authnSignature)
        : undefined,
    }
  },

  toJSON(message: V1ClientAuthnRequest): unknown {
    const obj: any = {}
    message.identityKeyBytes !== undefined &&
      (obj.identityKeyBytes = base64FromBytes(
        message.identityKeyBytes !== undefined
          ? message.identityKeyBytes
          : new Uint8Array()
      ))
    message.walletSignature !== undefined &&
      (obj.walletSignature = message.walletSignature
        ? Signature.toJSON(message.walletSignature)
        : undefined)
    message.authnDataBytes !== undefined &&
      (obj.authnDataBytes = base64FromBytes(
        message.authnDataBytes !== undefined
          ? message.authnDataBytes
          : new Uint8Array()
      ))
    message.authnSignature !== undefined &&
      (obj.authnSignature = message.authnSignature
        ? Signature.toJSON(message.authnSignature)
        : undefined)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<V1ClientAuthnRequest>, I>>(
    object: I
  ): V1ClientAuthnRequest {
    const message = createBaseV1ClientAuthnRequest()
    message.identityKeyBytes = object.identityKeyBytes ?? new Uint8Array()
    message.walletSignature =
      object.walletSignature !== undefined && object.walletSignature !== null
        ? Signature.fromPartial(object.walletSignature)
        : undefined
    message.authnDataBytes = object.authnDataBytes ?? new Uint8Array()
    message.authnSignature =
      object.authnSignature !== undefined && object.authnSignature !== null
        ? Signature.fromPartial(object.authnSignature)
        : undefined
    return message
  },
}

function createBaseClientAuthnRequest(): ClientAuthnRequest {
  return { v1: undefined }
}

export const ClientAuthnRequest = {
  encode(
    message: ClientAuthnRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.v1 !== undefined) {
      V1ClientAuthnRequest.encode(message.v1, writer.uint32(10).fork()).ldelim()
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClientAuthnRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseClientAuthnRequest()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.v1 = V1ClientAuthnRequest.decode(reader, reader.uint32())
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): ClientAuthnRequest {
    return {
      v1: isSet(object.v1)
        ? V1ClientAuthnRequest.fromJSON(object.v1)
        : undefined,
    }
  },

  toJSON(message: ClientAuthnRequest): unknown {
    const obj: any = {}
    message.v1 !== undefined &&
      (obj.v1 = message.v1
        ? V1ClientAuthnRequest.toJSON(message.v1)
        : undefined)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<ClientAuthnRequest>, I>>(
    object: I
  ): ClientAuthnRequest {
    const message = createBaseClientAuthnRequest()
    message.v1 =
      object.v1 !== undefined && object.v1 !== null
        ? V1ClientAuthnRequest.fromPartial(object.v1)
        : undefined
    return message
  },
}

function createBaseV1ClientAuthnResponse(): V1ClientAuthnResponse {
  return { authnSuccessful: false, errorStr: '' }
}

export const V1ClientAuthnResponse = {
  encode(
    message: V1ClientAuthnResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.authnSuccessful === true) {
      writer.uint32(8).bool(message.authnSuccessful)
    }
    if (message.errorStr !== '') {
      writer.uint32(18).string(message.errorStr)
    }
    return writer
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): V1ClientAuthnResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseV1ClientAuthnResponse()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.authnSuccessful = reader.bool()
          break
        case 2:
          message.errorStr = reader.string()
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): V1ClientAuthnResponse {
    return {
      authnSuccessful: isSet(object.authnSuccessful)
        ? Boolean(object.authnSuccessful)
        : false,
      errorStr: isSet(object.errorStr) ? String(object.errorStr) : '',
    }
  },

  toJSON(message: V1ClientAuthnResponse): unknown {
    const obj: any = {}
    message.authnSuccessful !== undefined &&
      (obj.authnSuccessful = message.authnSuccessful)
    message.errorStr !== undefined && (obj.errorStr = message.errorStr)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<V1ClientAuthnResponse>, I>>(
    object: I
  ): V1ClientAuthnResponse {
    const message = createBaseV1ClientAuthnResponse()
    message.authnSuccessful = object.authnSuccessful ?? false
    message.errorStr = object.errorStr ?? ''
    return message
  },
}

function createBaseClientAuthnResponse(): ClientAuthnResponse {
  return { v1: undefined }
}

export const ClientAuthnResponse = {
  encode(
    message: ClientAuthnResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.v1 !== undefined) {
      V1ClientAuthnResponse.encode(
        message.v1,
        writer.uint32(10).fork()
      ).ldelim()
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClientAuthnResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseClientAuthnResponse()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.v1 = V1ClientAuthnResponse.decode(reader, reader.uint32())
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): ClientAuthnResponse {
    return {
      v1: isSet(object.v1)
        ? V1ClientAuthnResponse.fromJSON(object.v1)
        : undefined,
    }
  },

  toJSON(message: ClientAuthnResponse): unknown {
    const obj: any = {}
    message.v1 !== undefined &&
      (obj.v1 = message.v1
        ? V1ClientAuthnResponse.toJSON(message.v1)
        : undefined)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<ClientAuthnResponse>, I>>(
    object: I
  ): ClientAuthnResponse {
    const message = createBaseClientAuthnResponse()
    message.v1 =
      object.v1 !== undefined && object.v1 !== null
        ? V1ClientAuthnResponse.fromPartial(object.v1)
        : undefined
    return message
  },
}

function createBaseAuthnData(): AuthnData {
  return { walletAddr: '', peerId: '', timestamp: 0 }
}

export const AuthnData = {
  encode(
    message: AuthnData,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.walletAddr !== '') {
      writer.uint32(10).string(message.walletAddr)
    }
    if (message.peerId !== '') {
      writer.uint32(18).string(message.peerId)
    }
    if (message.timestamp !== 0) {
      writer.uint32(24).uint64(message.timestamp)
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): AuthnData {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseAuthnData()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.walletAddr = reader.string()
          break
        case 2:
          message.peerId = reader.string()
          break
        case 3:
          message.timestamp = longToNumber(reader.uint64() as Long)
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): AuthnData {
    return {
      walletAddr: isSet(object.walletAddr) ? String(object.walletAddr) : '',
      peerId: isSet(object.peerId) ? String(object.peerId) : '',
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
    }
  },

  toJSON(message: AuthnData): unknown {
    const obj: any = {}
    message.walletAddr !== undefined && (obj.walletAddr = message.walletAddr)
    message.peerId !== undefined && (obj.peerId = message.peerId)
    message.timestamp !== undefined &&
      (obj.timestamp = Math.round(message.timestamp))
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<AuthnData>, I>>(
    object: I
  ): AuthnData {
    const message = createBaseAuthnData()
    message.walletAddr = object.walletAddr ?? ''
    message.peerId = object.peerId ?? ''
    message.timestamp = object.timestamp ?? 0
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

function longToNumber(long: Long): number {
  if (long.gt(Number.MAX_SAFE_INTEGER)) {
    throw new globalThis.Error('Value is larger than Number.MAX_SAFE_INTEGER')
  }
  return long.toNumber()
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any
  _m0.configure()
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined
}
