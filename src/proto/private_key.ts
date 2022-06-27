/* eslint-disable */
import Long from 'long'
import _m0 from 'protobufjs/minimal'
import { PublicKey, Ciphertext } from './messaging'

export const protobufPackage = ''

export interface PrivateKey {
  timestamp: number
  secp256k1: PrivateKey_Secp256k1 | undefined
  publicKey: PublicKey | undefined
}

export interface PrivateKey_Secp256k1 {
  /** D big-endian, 32 bytes */
  bytes: Uint8Array
}

export interface PrivateKeyBundleV1 {
  identityKey: PrivateKey | undefined
  preKeys: PrivateKey[]
}

export interface PrivateKeyBundle {
  v1: PrivateKeyBundleV1 | undefined
}

export interface EncryptedPrivateKeyBundleV1 {
  walletPreKey: Uint8Array
  ciphertext: Ciphertext | undefined
}

export interface EncryptedPrivateKeyBundle {
  v1: EncryptedPrivateKeyBundleV1 | undefined
}

function createBasePrivateKey(): PrivateKey {
  return { timestamp: 0, secp256k1: undefined, publicKey: undefined }
}

export const PrivateKey = {
  encode(
    message: PrivateKey,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.timestamp !== 0) {
      writer.uint32(8).uint64(message.timestamp)
    }
    if (message.secp256k1 !== undefined) {
      PrivateKey_Secp256k1.encode(
        message.secp256k1,
        writer.uint32(18).fork()
      ).ldelim()
    }
    if (message.publicKey !== undefined) {
      PublicKey.encode(message.publicKey, writer.uint32(26).fork()).ldelim()
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PrivateKey {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBasePrivateKey()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.timestamp = longToNumber(reader.uint64() as Long)
          break
        case 2:
          message.secp256k1 = PrivateKey_Secp256k1.decode(
            reader,
            reader.uint32()
          )
          break
        case 3:
          message.publicKey = PublicKey.decode(reader, reader.uint32())
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): PrivateKey {
    return {
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
      secp256k1: isSet(object.secp256k1)
        ? PrivateKey_Secp256k1.fromJSON(object.secp256k1)
        : undefined,
      publicKey: isSet(object.publicKey)
        ? PublicKey.fromJSON(object.publicKey)
        : undefined,
    }
  },

  toJSON(message: PrivateKey): unknown {
    const obj: any = {}
    message.timestamp !== undefined &&
      (obj.timestamp = Math.round(message.timestamp))
    message.secp256k1 !== undefined &&
      (obj.secp256k1 = message.secp256k1
        ? PrivateKey_Secp256k1.toJSON(message.secp256k1)
        : undefined)
    message.publicKey !== undefined &&
      (obj.publicKey = message.publicKey
        ? PublicKey.toJSON(message.publicKey)
        : undefined)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<PrivateKey>, I>>(
    object: I
  ): PrivateKey {
    const message = createBasePrivateKey()
    message.timestamp = object.timestamp ?? 0
    message.secp256k1 =
      object.secp256k1 !== undefined && object.secp256k1 !== null
        ? PrivateKey_Secp256k1.fromPartial(object.secp256k1)
        : undefined
    message.publicKey =
      object.publicKey !== undefined && object.publicKey !== null
        ? PublicKey.fromPartial(object.publicKey)
        : undefined
    return message
  },
}

function createBasePrivateKey_Secp256k1(): PrivateKey_Secp256k1 {
  return { bytes: new Uint8Array() }
}

export const PrivateKey_Secp256k1 = {
  encode(
    message: PrivateKey_Secp256k1,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.bytes.length !== 0) {
      writer.uint32(10).bytes(message.bytes)
    }
    return writer
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): PrivateKey_Secp256k1 {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBasePrivateKey_Secp256k1()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.bytes = reader.bytes()
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): PrivateKey_Secp256k1 {
    return {
      bytes: isSet(object.bytes)
        ? bytesFromBase64(object.bytes)
        : new Uint8Array(),
    }
  },

  toJSON(message: PrivateKey_Secp256k1): unknown {
    const obj: any = {}
    message.bytes !== undefined &&
      (obj.bytes = base64FromBytes(
        message.bytes !== undefined ? message.bytes : new Uint8Array()
      ))
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<PrivateKey_Secp256k1>, I>>(
    object: I
  ): PrivateKey_Secp256k1 {
    const message = createBasePrivateKey_Secp256k1()
    message.bytes = object.bytes ?? new Uint8Array()
    return message
  },
}

function createBasePrivateKeyBundleV1(): PrivateKeyBundleV1 {
  return { identityKey: undefined, preKeys: [] }
}

export const PrivateKeyBundleV1 = {
  encode(
    message: PrivateKeyBundleV1,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.identityKey !== undefined) {
      PrivateKey.encode(message.identityKey, writer.uint32(10).fork()).ldelim()
    }
    for (const v of message.preKeys) {
      PrivateKey.encode(v!, writer.uint32(18).fork()).ldelim()
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PrivateKeyBundleV1 {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBasePrivateKeyBundleV1()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.identityKey = PrivateKey.decode(reader, reader.uint32())
          break
        case 2:
          message.preKeys.push(PrivateKey.decode(reader, reader.uint32()))
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): PrivateKeyBundleV1 {
    return {
      identityKey: isSet(object.identityKey)
        ? PrivateKey.fromJSON(object.identityKey)
        : undefined,
      preKeys: Array.isArray(object?.preKeys)
        ? object.preKeys.map((e: any) => PrivateKey.fromJSON(e))
        : [],
    }
  },

  toJSON(message: PrivateKeyBundleV1): unknown {
    const obj: any = {}
    message.identityKey !== undefined &&
      (obj.identityKey = message.identityKey
        ? PrivateKey.toJSON(message.identityKey)
        : undefined)
    if (message.preKeys) {
      obj.preKeys = message.preKeys.map((e) =>
        e ? PrivateKey.toJSON(e) : undefined
      )
    } else {
      obj.preKeys = []
    }
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<PrivateKeyBundleV1>, I>>(
    object: I
  ): PrivateKeyBundleV1 {
    const message = createBasePrivateKeyBundleV1()
    message.identityKey =
      object.identityKey !== undefined && object.identityKey !== null
        ? PrivateKey.fromPartial(object.identityKey)
        : undefined
    message.preKeys =
      object.preKeys?.map((e) => PrivateKey.fromPartial(e)) || []
    return message
  },
}

function createBasePrivateKeyBundle(): PrivateKeyBundle {
  return { v1: undefined }
}

export const PrivateKeyBundle = {
  encode(
    message: PrivateKeyBundle,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.v1 !== undefined) {
      PrivateKeyBundleV1.encode(message.v1, writer.uint32(10).fork()).ldelim()
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PrivateKeyBundle {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBasePrivateKeyBundle()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.v1 = PrivateKeyBundleV1.decode(reader, reader.uint32())
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): PrivateKeyBundle {
    return {
      v1: isSet(object.v1) ? PrivateKeyBundleV1.fromJSON(object.v1) : undefined,
    }
  },

  toJSON(message: PrivateKeyBundle): unknown {
    const obj: any = {}
    message.v1 !== undefined &&
      (obj.v1 = message.v1 ? PrivateKeyBundleV1.toJSON(message.v1) : undefined)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<PrivateKeyBundle>, I>>(
    object: I
  ): PrivateKeyBundle {
    const message = createBasePrivateKeyBundle()
    message.v1 =
      object.v1 !== undefined && object.v1 !== null
        ? PrivateKeyBundleV1.fromPartial(object.v1)
        : undefined
    return message
  },
}

function createBaseEncryptedPrivateKeyBundleV1(): EncryptedPrivateKeyBundleV1 {
  return { walletPreKey: new Uint8Array(), ciphertext: undefined }
}

export const EncryptedPrivateKeyBundleV1 = {
  encode(
    message: EncryptedPrivateKeyBundleV1,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.walletPreKey.length !== 0) {
      writer.uint32(10).bytes(message.walletPreKey)
    }
    if (message.ciphertext !== undefined) {
      Ciphertext.encode(message.ciphertext, writer.uint32(18).fork()).ldelim()
    }
    return writer
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): EncryptedPrivateKeyBundleV1 {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseEncryptedPrivateKeyBundleV1()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.walletPreKey = reader.bytes()
          break
        case 2:
          message.ciphertext = Ciphertext.decode(reader, reader.uint32())
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): EncryptedPrivateKeyBundleV1 {
    return {
      walletPreKey: isSet(object.walletPreKey)
        ? bytesFromBase64(object.walletPreKey)
        : new Uint8Array(),
      ciphertext: isSet(object.ciphertext)
        ? Ciphertext.fromJSON(object.ciphertext)
        : undefined,
    }
  },

  toJSON(message: EncryptedPrivateKeyBundleV1): unknown {
    const obj: any = {}
    message.walletPreKey !== undefined &&
      (obj.walletPreKey = base64FromBytes(
        message.walletPreKey !== undefined
          ? message.walletPreKey
          : new Uint8Array()
      ))
    message.ciphertext !== undefined &&
      (obj.ciphertext = message.ciphertext
        ? Ciphertext.toJSON(message.ciphertext)
        : undefined)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<EncryptedPrivateKeyBundleV1>, I>>(
    object: I
  ): EncryptedPrivateKeyBundleV1 {
    const message = createBaseEncryptedPrivateKeyBundleV1()
    message.walletPreKey = object.walletPreKey ?? new Uint8Array()
    message.ciphertext =
      object.ciphertext !== undefined && object.ciphertext !== null
        ? Ciphertext.fromPartial(object.ciphertext)
        : undefined
    return message
  },
}

function createBaseEncryptedPrivateKeyBundle(): EncryptedPrivateKeyBundle {
  return { v1: undefined }
}

export const EncryptedPrivateKeyBundle = {
  encode(
    message: EncryptedPrivateKeyBundle,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.v1 !== undefined) {
      EncryptedPrivateKeyBundleV1.encode(
        message.v1,
        writer.uint32(10).fork()
      ).ldelim()
    }
    return writer
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): EncryptedPrivateKeyBundle {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseEncryptedPrivateKeyBundle()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.v1 = EncryptedPrivateKeyBundleV1.decode(
            reader,
            reader.uint32()
          )
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): EncryptedPrivateKeyBundle {
    return {
      v1: isSet(object.v1)
        ? EncryptedPrivateKeyBundleV1.fromJSON(object.v1)
        : undefined,
    }
  },

  toJSON(message: EncryptedPrivateKeyBundle): unknown {
    const obj: any = {}
    message.v1 !== undefined &&
      (obj.v1 = message.v1
        ? EncryptedPrivateKeyBundleV1.toJSON(message.v1)
        : undefined)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<EncryptedPrivateKeyBundle>, I>>(
    object: I
  ): EncryptedPrivateKeyBundle {
    const message = createBaseEncryptedPrivateKeyBundle()
    message.v1 =
      object.v1 !== undefined && object.v1 !== null
        ? EncryptedPrivateKeyBundleV1.fromPartial(object.v1)
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
