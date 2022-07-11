/* eslint-disable */
import Long from 'long'
import _m0 from 'protobufjs/minimal'
import { Signature } from './messaging'

export const protobufPackage = ''

export interface V1ClientAuthRequest {
  identityKeyBytes: Uint8Array
  walletSignature: Signature | undefined
  authDataBytes: Uint8Array
  authSignature: Signature | undefined
}

export interface ClientAuthRequest {
  v1: V1ClientAuthRequest | undefined
}

export interface V1ClientAuthResponse {
  authSuccessful: boolean
  errorStr: string
}

export interface ClientAuthResponse {
  v1: V1ClientAuthResponse | undefined
}

export interface AuthData {
  walletAddr: string
  peerId: string
  timestamp: number
}

function createBaseV1ClientAuthRequest(): V1ClientAuthRequest {
  return {
    identityKeyBytes: new Uint8Array(),
    walletSignature: undefined,
    authDataBytes: new Uint8Array(),
    authSignature: undefined,
  }
}

export const V1ClientAuthRequest = {
  encode(
    message: V1ClientAuthRequest,
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
    if (message.authDataBytes.length !== 0) {
      writer.uint32(26).bytes(message.authDataBytes)
    }
    if (message.authSignature !== undefined) {
      Signature.encode(message.authSignature, writer.uint32(34).fork()).ldelim()
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): V1ClientAuthRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseV1ClientAuthRequest()
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
          message.authDataBytes = reader.bytes()
          break
        case 4:
          message.authSignature = Signature.decode(reader, reader.uint32())
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): V1ClientAuthRequest {
    return {
      identityKeyBytes: isSet(object.identityKeyBytes)
        ? bytesFromBase64(object.identityKeyBytes)
        : new Uint8Array(),
      walletSignature: isSet(object.walletSignature)
        ? Signature.fromJSON(object.walletSignature)
        : undefined,
      authDataBytes: isSet(object.authDataBytes)
        ? bytesFromBase64(object.authDataBytes)
        : new Uint8Array(),
      authSignature: isSet(object.authSignature)
        ? Signature.fromJSON(object.authSignature)
        : undefined,
    }
  },

  toJSON(message: V1ClientAuthRequest): unknown {
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
    message.authDataBytes !== undefined &&
      (obj.authDataBytes = base64FromBytes(
        message.authDataBytes !== undefined
          ? message.authDataBytes
          : new Uint8Array()
      ))
    message.authSignature !== undefined &&
      (obj.authSignature = message.authSignature
        ? Signature.toJSON(message.authSignature)
        : undefined)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<V1ClientAuthRequest>, I>>(
    object: I
  ): V1ClientAuthRequest {
    const message = createBaseV1ClientAuthRequest()
    message.identityKeyBytes = object.identityKeyBytes ?? new Uint8Array()
    message.walletSignature =
      object.walletSignature !== undefined && object.walletSignature !== null
        ? Signature.fromPartial(object.walletSignature)
        : undefined
    message.authDataBytes = object.authDataBytes ?? new Uint8Array()
    message.authSignature =
      object.authSignature !== undefined && object.authSignature !== null
        ? Signature.fromPartial(object.authSignature)
        : undefined
    return message
  },
}

function createBaseClientAuthRequest(): ClientAuthRequest {
  return { v1: undefined }
}

export const ClientAuthRequest = {
  encode(
    message: ClientAuthRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.v1 !== undefined) {
      V1ClientAuthRequest.encode(message.v1, writer.uint32(10).fork()).ldelim()
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClientAuthRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseClientAuthRequest()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.v1 = V1ClientAuthRequest.decode(reader, reader.uint32())
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): ClientAuthRequest {
    return {
      v1: isSet(object.v1)
        ? V1ClientAuthRequest.fromJSON(object.v1)
        : undefined,
    }
  },

  toJSON(message: ClientAuthRequest): unknown {
    const obj: any = {}
    message.v1 !== undefined &&
      (obj.v1 = message.v1 ? V1ClientAuthRequest.toJSON(message.v1) : undefined)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<ClientAuthRequest>, I>>(
    object: I
  ): ClientAuthRequest {
    const message = createBaseClientAuthRequest()
    message.v1 =
      object.v1 !== undefined && object.v1 !== null
        ? V1ClientAuthRequest.fromPartial(object.v1)
        : undefined
    return message
  },
}

function createBaseV1ClientAuthResponse(): V1ClientAuthResponse {
  return { authSuccessful: false, errorStr: '' }
}

export const V1ClientAuthResponse = {
  encode(
    message: V1ClientAuthResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.authSuccessful === true) {
      writer.uint32(8).bool(message.authSuccessful)
    }
    if (message.errorStr !== '') {
      writer.uint32(18).string(message.errorStr)
    }
    return writer
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): V1ClientAuthResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseV1ClientAuthResponse()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.authSuccessful = reader.bool()
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

  fromJSON(object: any): V1ClientAuthResponse {
    return {
      authSuccessful: isSet(object.authSuccessful)
        ? Boolean(object.authSuccessful)
        : false,
      errorStr: isSet(object.errorStr) ? String(object.errorStr) : '',
    }
  },

  toJSON(message: V1ClientAuthResponse): unknown {
    const obj: any = {}
    message.authSuccessful !== undefined &&
      (obj.authSuccessful = message.authSuccessful)
    message.errorStr !== undefined && (obj.errorStr = message.errorStr)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<V1ClientAuthResponse>, I>>(
    object: I
  ): V1ClientAuthResponse {
    const message = createBaseV1ClientAuthResponse()
    message.authSuccessful = object.authSuccessful ?? false
    message.errorStr = object.errorStr ?? ''
    return message
  },
}

function createBaseClientAuthResponse(): ClientAuthResponse {
  return { v1: undefined }
}

export const ClientAuthResponse = {
  encode(
    message: ClientAuthResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.v1 !== undefined) {
      V1ClientAuthResponse.encode(message.v1, writer.uint32(10).fork()).ldelim()
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClientAuthResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseClientAuthResponse()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.v1 = V1ClientAuthResponse.decode(reader, reader.uint32())
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): ClientAuthResponse {
    return {
      v1: isSet(object.v1)
        ? V1ClientAuthResponse.fromJSON(object.v1)
        : undefined,
    }
  },

  toJSON(message: ClientAuthResponse): unknown {
    const obj: any = {}
    message.v1 !== undefined &&
      (obj.v1 = message.v1
        ? V1ClientAuthResponse.toJSON(message.v1)
        : undefined)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<ClientAuthResponse>, I>>(
    object: I
  ): ClientAuthResponse {
    const message = createBaseClientAuthResponse()
    message.v1 =
      object.v1 !== undefined && object.v1 !== null
        ? V1ClientAuthResponse.fromPartial(object.v1)
        : undefined
    return message
  },
}

function createBaseAuthData(): AuthData {
  return { walletAddr: '', peerId: '', timestamp: 0 }
}

export const AuthData = {
  encode(
    message: AuthData,
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

  decode(input: _m0.Reader | Uint8Array, length?: number): AuthData {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseAuthData()
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

  fromJSON(object: any): AuthData {
    return {
      walletAddr: isSet(object.walletAddr) ? String(object.walletAddr) : '',
      peerId: isSet(object.peerId) ? String(object.peerId) : '',
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
    }
  },

  toJSON(message: AuthData): unknown {
    const obj: any = {}
    message.walletAddr !== undefined && (obj.walletAddr = message.walletAddr)
    message.peerId !== undefined && (obj.peerId = message.peerId)
    message.timestamp !== undefined &&
      (obj.timestamp = Math.round(message.timestamp))
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<AuthData>, I>>(object: I): AuthData {
    const message = createBaseAuthData()
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
