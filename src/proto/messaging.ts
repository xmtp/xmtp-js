/* eslint-disable */
import Long from 'long'
import _m0 from 'protobufjs/minimal'

export const protobufPackage = ''

/** Recognized compression algorithms */
export enum Compression {
  deflate = 0,
  gzip = 1,
  UNRECOGNIZED = -1,
}

export function compressionFromJSON(object: any): Compression {
  switch (object) {
    case 0:
    case 'deflate':
      return Compression.deflate
    case 1:
    case 'gzip':
      return Compression.gzip
    case -1:
    case 'UNRECOGNIZED':
    default:
      return Compression.UNRECOGNIZED
  }
}

export function compressionToJSON(object: Compression): string {
  switch (object) {
    case Compression.deflate:
      return 'deflate'
    case Compression.gzip:
      return 'gzip'
    default:
      return 'UNKNOWN'
  }
}

/**
 * Signature represents a generalized public key signature,
 * defined as a union to support cryptographic algorithm agility.
 */
export interface Signature {
  ecdsaCompact: Signature_ECDSACompact | undefined
}

export interface Signature_ECDSACompact {
  /** compact representation [ R || S ], 64 bytes */
  bytes: Uint8Array
  /** recovery bit */
  recovery: number
}

/**
 * PublicKey represents a generalized public key,
 * defined as a union to support cryptographic algorithm agility.
 */
export interface PublicKey {
  timestamp: number
  signature?: Signature | undefined
  secp256k1Uncompressed: PublicKey_Secp256k1Uncompresed | undefined
}

export interface PublicKey_Secp256k1Uncompresed {
  /** uncompressed point with prefix (0x04) [ P || X || Y ], 65 bytes */
  bytes: Uint8Array
}

/**
 * PublicKeyBundle packages the cryptographic keys associated with a wallet,
 * both senders and recipients are identified by their key bundles.
 */
export interface PublicKeyBundle {
  identityKey: PublicKey | undefined
  preKey: PublicKey | undefined
}

/** ContentTypeId is used to identify the type of content stored in a Message. */
export interface ContentTypeId {
  /** authority governing this content type */
  authorityId: string
  /** type identifier */
  typeId: string
  /** major version of the type */
  versionMajor: number
  /** minor version of the type */
  versionMinor: number
}

/**
 * EncodedContent is the type embedded in Ciphertext.payload bytes,
 * it bundles the encoded content with metadata identifying the type of content
 * and parameters required for correct decoding and presentation of the content.
 */
export interface EncodedContent {
  /** content type identifier used to match the payload with the correct decoding machinery */
  type: ContentTypeId | undefined
  /** optional encoding parameters required to correctly decode the content */
  parameters: { [key: string]: string }
  /**
   * optional fallback description of the content that can be used in case
   * the client cannot decode or render the content
   */
  fallback?: string | undefined
  /** optional compression; the value indicates algorithm used to compress the encoded content bytes */
  compression?: Compression | undefined
  /** encoded content itself */
  content: Uint8Array
}

export interface EncodedContent_ParametersEntry {
  key: string
  value: string
}

/**
 * Ciphertext represents the payload of the message encoded and encrypted for transport.
 * It is definited as a union to support cryptographic algorithm agility.
 */
export interface Ciphertext {
  aes256GcmHkdfSha256: Ciphertext_aes256gcmHkdfsha256 | undefined
}

export interface Ciphertext_aes256gcmHkdfsha256 {
  hkdfSalt: Uint8Array
  gcmNonce: Uint8Array
  /** payload MUST contain encoding of a EncodedContent message */
  payload: Uint8Array
}

/**
 * MessageHeader is encoded separately as the bytes are also used
 * as associated data for authenticated encryption
 */
export interface MessageHeader {
  sender: PublicKeyBundle | undefined
  recipient: PublicKeyBundle | undefined
  timestamp: number
}

/** Message is the top level protocol element */
export interface Message {
  /** encapsulates the encoded MessageHeader */
  headerBytes: Uint8Array
  ciphertext: Ciphertext | undefined
}

export interface PrivateKey {
  timestamp: number
  secp256k1: PrivateKey_Secp256k1 | undefined
  publicKey: PublicKey | undefined
}

export interface PrivateKey_Secp256k1 {
  /** D big-endian, 32 bytes */
  bytes: Uint8Array
}

export interface PrivateKeyBundle {
  identityKey: PrivateKey | undefined
  preKeys: PrivateKey[]
}

export interface EncryptedPrivateKeyBundle {
  walletPreKey: Uint8Array
  ciphertext: Ciphertext | undefined
}

function createBaseSignature(): Signature {
  return { ecdsaCompact: undefined }
}

export const Signature = {
  encode(
    message: Signature,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.ecdsaCompact !== undefined) {
      Signature_ECDSACompact.encode(
        message.ecdsaCompact,
        writer.uint32(10).fork()
      ).ldelim()
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Signature {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseSignature()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.ecdsaCompact = Signature_ECDSACompact.decode(
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

  fromJSON(object: any): Signature {
    return {
      ecdsaCompact: isSet(object.ecdsaCompact)
        ? Signature_ECDSACompact.fromJSON(object.ecdsaCompact)
        : undefined,
    }
  },

  toJSON(message: Signature): unknown {
    const obj: any = {}
    message.ecdsaCompact !== undefined &&
      (obj.ecdsaCompact = message.ecdsaCompact
        ? Signature_ECDSACompact.toJSON(message.ecdsaCompact)
        : undefined)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<Signature>, I>>(
    object: I
  ): Signature {
    const message = createBaseSignature()
    message.ecdsaCompact =
      object.ecdsaCompact !== undefined && object.ecdsaCompact !== null
        ? Signature_ECDSACompact.fromPartial(object.ecdsaCompact)
        : undefined
    return message
  },
}

function createBaseSignature_ECDSACompact(): Signature_ECDSACompact {
  return { bytes: new Uint8Array(), recovery: 0 }
}

export const Signature_ECDSACompact = {
  encode(
    message: Signature_ECDSACompact,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.bytes.length !== 0) {
      writer.uint32(10).bytes(message.bytes)
    }
    if (message.recovery !== 0) {
      writer.uint32(16).uint32(message.recovery)
    }
    return writer
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): Signature_ECDSACompact {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseSignature_ECDSACompact()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.bytes = reader.bytes()
          break
        case 2:
          message.recovery = reader.uint32()
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): Signature_ECDSACompact {
    return {
      bytes: isSet(object.bytes)
        ? bytesFromBase64(object.bytes)
        : new Uint8Array(),
      recovery: isSet(object.recovery) ? Number(object.recovery) : 0,
    }
  },

  toJSON(message: Signature_ECDSACompact): unknown {
    const obj: any = {}
    message.bytes !== undefined &&
      (obj.bytes = base64FromBytes(
        message.bytes !== undefined ? message.bytes : new Uint8Array()
      ))
    message.recovery !== undefined &&
      (obj.recovery = Math.round(message.recovery))
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<Signature_ECDSACompact>, I>>(
    object: I
  ): Signature_ECDSACompact {
    const message = createBaseSignature_ECDSACompact()
    message.bytes = object.bytes ?? new Uint8Array()
    message.recovery = object.recovery ?? 0
    return message
  },
}

function createBasePublicKey(): PublicKey {
  return {
    timestamp: 0,
    signature: undefined,
    secp256k1Uncompressed: undefined,
  }
}

export const PublicKey = {
  encode(
    message: PublicKey,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.timestamp !== 0) {
      writer.uint32(8).uint64(message.timestamp)
    }
    if (message.signature !== undefined) {
      Signature.encode(message.signature, writer.uint32(18).fork()).ldelim()
    }
    if (message.secp256k1Uncompressed !== undefined) {
      PublicKey_Secp256k1Uncompresed.encode(
        message.secp256k1Uncompressed,
        writer.uint32(26).fork()
      ).ldelim()
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PublicKey {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBasePublicKey()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.timestamp = longToNumber(reader.uint64() as Long)
          break
        case 2:
          message.signature = Signature.decode(reader, reader.uint32())
          break
        case 3:
          message.secp256k1Uncompressed = PublicKey_Secp256k1Uncompresed.decode(
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

  fromJSON(object: any): PublicKey {
    return {
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
      signature: isSet(object.signature)
        ? Signature.fromJSON(object.signature)
        : undefined,
      secp256k1Uncompressed: isSet(object.secp256k1Uncompressed)
        ? PublicKey_Secp256k1Uncompresed.fromJSON(object.secp256k1Uncompressed)
        : undefined,
    }
  },

  toJSON(message: PublicKey): unknown {
    const obj: any = {}
    message.timestamp !== undefined &&
      (obj.timestamp = Math.round(message.timestamp))
    message.signature !== undefined &&
      (obj.signature = message.signature
        ? Signature.toJSON(message.signature)
        : undefined)
    message.secp256k1Uncompressed !== undefined &&
      (obj.secp256k1Uncompressed = message.secp256k1Uncompressed
        ? PublicKey_Secp256k1Uncompresed.toJSON(message.secp256k1Uncompressed)
        : undefined)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<PublicKey>, I>>(
    object: I
  ): PublicKey {
    const message = createBasePublicKey()
    message.timestamp = object.timestamp ?? 0
    message.signature =
      object.signature !== undefined && object.signature !== null
        ? Signature.fromPartial(object.signature)
        : undefined
    message.secp256k1Uncompressed =
      object.secp256k1Uncompressed !== undefined &&
      object.secp256k1Uncompressed !== null
        ? PublicKey_Secp256k1Uncompresed.fromPartial(
            object.secp256k1Uncompressed
          )
        : undefined
    return message
  },
}

function createBasePublicKey_Secp256k1Uncompresed(): PublicKey_Secp256k1Uncompresed {
  return { bytes: new Uint8Array() }
}

export const PublicKey_Secp256k1Uncompresed = {
  encode(
    message: PublicKey_Secp256k1Uncompresed,
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
  ): PublicKey_Secp256k1Uncompresed {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBasePublicKey_Secp256k1Uncompresed()
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

  fromJSON(object: any): PublicKey_Secp256k1Uncompresed {
    return {
      bytes: isSet(object.bytes)
        ? bytesFromBase64(object.bytes)
        : new Uint8Array(),
    }
  },

  toJSON(message: PublicKey_Secp256k1Uncompresed): unknown {
    const obj: any = {}
    message.bytes !== undefined &&
      (obj.bytes = base64FromBytes(
        message.bytes !== undefined ? message.bytes : new Uint8Array()
      ))
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<PublicKey_Secp256k1Uncompresed>, I>>(
    object: I
  ): PublicKey_Secp256k1Uncompresed {
    const message = createBasePublicKey_Secp256k1Uncompresed()
    message.bytes = object.bytes ?? new Uint8Array()
    return message
  },
}

function createBasePublicKeyBundle(): PublicKeyBundle {
  return { identityKey: undefined, preKey: undefined }
}

export const PublicKeyBundle = {
  encode(
    message: PublicKeyBundle,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.identityKey !== undefined) {
      PublicKey.encode(message.identityKey, writer.uint32(10).fork()).ldelim()
    }
    if (message.preKey !== undefined) {
      PublicKey.encode(message.preKey, writer.uint32(18).fork()).ldelim()
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PublicKeyBundle {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBasePublicKeyBundle()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.identityKey = PublicKey.decode(reader, reader.uint32())
          break
        case 2:
          message.preKey = PublicKey.decode(reader, reader.uint32())
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): PublicKeyBundle {
    return {
      identityKey: isSet(object.identityKey)
        ? PublicKey.fromJSON(object.identityKey)
        : undefined,
      preKey: isSet(object.preKey)
        ? PublicKey.fromJSON(object.preKey)
        : undefined,
    }
  },

  toJSON(message: PublicKeyBundle): unknown {
    const obj: any = {}
    message.identityKey !== undefined &&
      (obj.identityKey = message.identityKey
        ? PublicKey.toJSON(message.identityKey)
        : undefined)
    message.preKey !== undefined &&
      (obj.preKey = message.preKey
        ? PublicKey.toJSON(message.preKey)
        : undefined)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<PublicKeyBundle>, I>>(
    object: I
  ): PublicKeyBundle {
    const message = createBasePublicKeyBundle()
    message.identityKey =
      object.identityKey !== undefined && object.identityKey !== null
        ? PublicKey.fromPartial(object.identityKey)
        : undefined
    message.preKey =
      object.preKey !== undefined && object.preKey !== null
        ? PublicKey.fromPartial(object.preKey)
        : undefined
    return message
  },
}

function createBaseContentTypeId(): ContentTypeId {
  return { authorityId: '', typeId: '', versionMajor: 0, versionMinor: 0 }
}

export const ContentTypeId = {
  encode(
    message: ContentTypeId,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.authorityId !== '') {
      writer.uint32(10).string(message.authorityId)
    }
    if (message.typeId !== '') {
      writer.uint32(18).string(message.typeId)
    }
    if (message.versionMajor !== 0) {
      writer.uint32(24).uint32(message.versionMajor)
    }
    if (message.versionMinor !== 0) {
      writer.uint32(32).uint32(message.versionMinor)
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ContentTypeId {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseContentTypeId()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.authorityId = reader.string()
          break
        case 2:
          message.typeId = reader.string()
          break
        case 3:
          message.versionMajor = reader.uint32()
          break
        case 4:
          message.versionMinor = reader.uint32()
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): ContentTypeId {
    return {
      authorityId: isSet(object.authorityId) ? String(object.authorityId) : '',
      typeId: isSet(object.typeId) ? String(object.typeId) : '',
      versionMajor: isSet(object.versionMajor)
        ? Number(object.versionMajor)
        : 0,
      versionMinor: isSet(object.versionMinor)
        ? Number(object.versionMinor)
        : 0,
    }
  },

  toJSON(message: ContentTypeId): unknown {
    const obj: any = {}
    message.authorityId !== undefined && (obj.authorityId = message.authorityId)
    message.typeId !== undefined && (obj.typeId = message.typeId)
    message.versionMajor !== undefined &&
      (obj.versionMajor = Math.round(message.versionMajor))
    message.versionMinor !== undefined &&
      (obj.versionMinor = Math.round(message.versionMinor))
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<ContentTypeId>, I>>(
    object: I
  ): ContentTypeId {
    const message = createBaseContentTypeId()
    message.authorityId = object.authorityId ?? ''
    message.typeId = object.typeId ?? ''
    message.versionMajor = object.versionMajor ?? 0
    message.versionMinor = object.versionMinor ?? 0
    return message
  },
}

function createBaseEncodedContent(): EncodedContent {
  return {
    type: undefined,
    parameters: {},
    fallback: undefined,
    compression: undefined,
    content: new Uint8Array(),
  }
}

export const EncodedContent = {
  encode(
    message: EncodedContent,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.type !== undefined) {
      ContentTypeId.encode(message.type, writer.uint32(10).fork()).ldelim()
    }
    Object.entries(message.parameters).forEach(([key, value]) => {
      EncodedContent_ParametersEntry.encode(
        { key: key as any, value },
        writer.uint32(18).fork()
      ).ldelim()
    })
    if (message.fallback !== undefined) {
      writer.uint32(26).string(message.fallback)
    }
    if (message.compression !== undefined) {
      writer.uint32(40).int32(message.compression)
    }
    if (message.content.length !== 0) {
      writer.uint32(34).bytes(message.content)
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EncodedContent {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseEncodedContent()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.type = ContentTypeId.decode(reader, reader.uint32())
          break
        case 2:
          const entry2 = EncodedContent_ParametersEntry.decode(
            reader,
            reader.uint32()
          )
          if (entry2.value !== undefined) {
            message.parameters[entry2.key] = entry2.value
          }
          break
        case 3:
          message.fallback = reader.string()
          break
        case 5:
          message.compression = reader.int32() as any
          break
        case 4:
          message.content = reader.bytes()
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): EncodedContent {
    return {
      type: isSet(object.type)
        ? ContentTypeId.fromJSON(object.type)
        : undefined,
      parameters: isObject(object.parameters)
        ? Object.entries(object.parameters).reduce<{ [key: string]: string }>(
            (acc, [key, value]) => {
              acc[key] = String(value)
              return acc
            },
            {}
          )
        : {},
      fallback: isSet(object.fallback) ? String(object.fallback) : undefined,
      compression: isSet(object.compression)
        ? compressionFromJSON(object.compression)
        : undefined,
      content: isSet(object.content)
        ? bytesFromBase64(object.content)
        : new Uint8Array(),
    }
  },

  toJSON(message: EncodedContent): unknown {
    const obj: any = {}
    message.type !== undefined &&
      (obj.type = message.type ? ContentTypeId.toJSON(message.type) : undefined)
    obj.parameters = {}
    if (message.parameters) {
      Object.entries(message.parameters).forEach(([k, v]) => {
        obj.parameters[k] = v
      })
    }
    message.fallback !== undefined && (obj.fallback = message.fallback)
    message.compression !== undefined &&
      (obj.compression =
        message.compression !== undefined
          ? compressionToJSON(message.compression)
          : undefined)
    message.content !== undefined &&
      (obj.content = base64FromBytes(
        message.content !== undefined ? message.content : new Uint8Array()
      ))
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<EncodedContent>, I>>(
    object: I
  ): EncodedContent {
    const message = createBaseEncodedContent()
    message.type =
      object.type !== undefined && object.type !== null
        ? ContentTypeId.fromPartial(object.type)
        : undefined
    message.parameters = Object.entries(object.parameters ?? {}).reduce<{
      [key: string]: string
    }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = String(value)
      }
      return acc
    }, {})
    message.fallback = object.fallback ?? undefined
    message.compression = object.compression ?? undefined
    message.content = object.content ?? new Uint8Array()
    return message
  },
}

function createBaseEncodedContent_ParametersEntry(): EncodedContent_ParametersEntry {
  return { key: '', value: '' }
}

export const EncodedContent_ParametersEntry = {
  encode(
    message: EncodedContent_ParametersEntry,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.key !== '') {
      writer.uint32(10).string(message.key)
    }
    if (message.value !== '') {
      writer.uint32(18).string(message.value)
    }
    return writer
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): EncodedContent_ParametersEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseEncodedContent_ParametersEntry()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.key = reader.string()
          break
        case 2:
          message.value = reader.string()
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): EncodedContent_ParametersEntry {
    return {
      key: isSet(object.key) ? String(object.key) : '',
      value: isSet(object.value) ? String(object.value) : '',
    }
  },

  toJSON(message: EncodedContent_ParametersEntry): unknown {
    const obj: any = {}
    message.key !== undefined && (obj.key = message.key)
    message.value !== undefined && (obj.value = message.value)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<EncodedContent_ParametersEntry>, I>>(
    object: I
  ): EncodedContent_ParametersEntry {
    const message = createBaseEncodedContent_ParametersEntry()
    message.key = object.key ?? ''
    message.value = object.value ?? ''
    return message
  },
}

function createBaseCiphertext(): Ciphertext {
  return { aes256GcmHkdfSha256: undefined }
}

export const Ciphertext = {
  encode(
    message: Ciphertext,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.aes256GcmHkdfSha256 !== undefined) {
      Ciphertext_aes256gcmHkdfsha256.encode(
        message.aes256GcmHkdfSha256,
        writer.uint32(10).fork()
      ).ldelim()
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Ciphertext {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseCiphertext()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.aes256GcmHkdfSha256 = Ciphertext_aes256gcmHkdfsha256.decode(
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

  fromJSON(object: any): Ciphertext {
    return {
      aes256GcmHkdfSha256: isSet(object.aes256GcmHkdfSha256)
        ? Ciphertext_aes256gcmHkdfsha256.fromJSON(object.aes256GcmHkdfSha256)
        : undefined,
    }
  },

  toJSON(message: Ciphertext): unknown {
    const obj: any = {}
    message.aes256GcmHkdfSha256 !== undefined &&
      (obj.aes256GcmHkdfSha256 = message.aes256GcmHkdfSha256
        ? Ciphertext_aes256gcmHkdfsha256.toJSON(message.aes256GcmHkdfSha256)
        : undefined)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<Ciphertext>, I>>(
    object: I
  ): Ciphertext {
    const message = createBaseCiphertext()
    message.aes256GcmHkdfSha256 =
      object.aes256GcmHkdfSha256 !== undefined &&
      object.aes256GcmHkdfSha256 !== null
        ? Ciphertext_aes256gcmHkdfsha256.fromPartial(object.aes256GcmHkdfSha256)
        : undefined
    return message
  },
}

function createBaseCiphertext_aes256gcmHkdfsha256(): Ciphertext_aes256gcmHkdfsha256 {
  return {
    hkdfSalt: new Uint8Array(),
    gcmNonce: new Uint8Array(),
    payload: new Uint8Array(),
  }
}

export const Ciphertext_aes256gcmHkdfsha256 = {
  encode(
    message: Ciphertext_aes256gcmHkdfsha256,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.hkdfSalt.length !== 0) {
      writer.uint32(10).bytes(message.hkdfSalt)
    }
    if (message.gcmNonce.length !== 0) {
      writer.uint32(18).bytes(message.gcmNonce)
    }
    if (message.payload.length !== 0) {
      writer.uint32(26).bytes(message.payload)
    }
    return writer
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): Ciphertext_aes256gcmHkdfsha256 {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseCiphertext_aes256gcmHkdfsha256()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.hkdfSalt = reader.bytes()
          break
        case 2:
          message.gcmNonce = reader.bytes()
          break
        case 3:
          message.payload = reader.bytes()
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },

  fromJSON(object: any): Ciphertext_aes256gcmHkdfsha256 {
    return {
      hkdfSalt: isSet(object.hkdfSalt)
        ? bytesFromBase64(object.hkdfSalt)
        : new Uint8Array(),
      gcmNonce: isSet(object.gcmNonce)
        ? bytesFromBase64(object.gcmNonce)
        : new Uint8Array(),
      payload: isSet(object.payload)
        ? bytesFromBase64(object.payload)
        : new Uint8Array(),
    }
  },

  toJSON(message: Ciphertext_aes256gcmHkdfsha256): unknown {
    const obj: any = {}
    message.hkdfSalt !== undefined &&
      (obj.hkdfSalt = base64FromBytes(
        message.hkdfSalt !== undefined ? message.hkdfSalt : new Uint8Array()
      ))
    message.gcmNonce !== undefined &&
      (obj.gcmNonce = base64FromBytes(
        message.gcmNonce !== undefined ? message.gcmNonce : new Uint8Array()
      ))
    message.payload !== undefined &&
      (obj.payload = base64FromBytes(
        message.payload !== undefined ? message.payload : new Uint8Array()
      ))
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<Ciphertext_aes256gcmHkdfsha256>, I>>(
    object: I
  ): Ciphertext_aes256gcmHkdfsha256 {
    const message = createBaseCiphertext_aes256gcmHkdfsha256()
    message.hkdfSalt = object.hkdfSalt ?? new Uint8Array()
    message.gcmNonce = object.gcmNonce ?? new Uint8Array()
    message.payload = object.payload ?? new Uint8Array()
    return message
  },
}

function createBaseMessageHeader(): MessageHeader {
  return { sender: undefined, recipient: undefined, timestamp: 0 }
}

export const MessageHeader = {
  encode(
    message: MessageHeader,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.sender !== undefined) {
      PublicKeyBundle.encode(message.sender, writer.uint32(10).fork()).ldelim()
    }
    if (message.recipient !== undefined) {
      PublicKeyBundle.encode(
        message.recipient,
        writer.uint32(18).fork()
      ).ldelim()
    }
    if (message.timestamp !== 0) {
      writer.uint32(24).uint64(message.timestamp)
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MessageHeader {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseMessageHeader()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.sender = PublicKeyBundle.decode(reader, reader.uint32())
          break
        case 2:
          message.recipient = PublicKeyBundle.decode(reader, reader.uint32())
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

  fromJSON(object: any): MessageHeader {
    return {
      sender: isSet(object.sender)
        ? PublicKeyBundle.fromJSON(object.sender)
        : undefined,
      recipient: isSet(object.recipient)
        ? PublicKeyBundle.fromJSON(object.recipient)
        : undefined,
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
    }
  },

  toJSON(message: MessageHeader): unknown {
    const obj: any = {}
    message.sender !== undefined &&
      (obj.sender = message.sender
        ? PublicKeyBundle.toJSON(message.sender)
        : undefined)
    message.recipient !== undefined &&
      (obj.recipient = message.recipient
        ? PublicKeyBundle.toJSON(message.recipient)
        : undefined)
    message.timestamp !== undefined &&
      (obj.timestamp = Math.round(message.timestamp))
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<MessageHeader>, I>>(
    object: I
  ): MessageHeader {
    const message = createBaseMessageHeader()
    message.sender =
      object.sender !== undefined && object.sender !== null
        ? PublicKeyBundle.fromPartial(object.sender)
        : undefined
    message.recipient =
      object.recipient !== undefined && object.recipient !== null
        ? PublicKeyBundle.fromPartial(object.recipient)
        : undefined
    message.timestamp = object.timestamp ?? 0
    return message
  },
}

function createBaseMessage(): Message {
  return { headerBytes: new Uint8Array(), ciphertext: undefined }
}

export const Message = {
  encode(
    message: Message,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.headerBytes.length !== 0) {
      writer.uint32(10).bytes(message.headerBytes)
    }
    if (message.ciphertext !== undefined) {
      Ciphertext.encode(message.ciphertext, writer.uint32(18).fork()).ldelim()
    }
    return writer
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Message {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseMessage()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.headerBytes = reader.bytes()
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

  fromJSON(object: any): Message {
    return {
      headerBytes: isSet(object.headerBytes)
        ? bytesFromBase64(object.headerBytes)
        : new Uint8Array(),
      ciphertext: isSet(object.ciphertext)
        ? Ciphertext.fromJSON(object.ciphertext)
        : undefined,
    }
  },

  toJSON(message: Message): unknown {
    const obj: any = {}
    message.headerBytes !== undefined &&
      (obj.headerBytes = base64FromBytes(
        message.headerBytes !== undefined
          ? message.headerBytes
          : new Uint8Array()
      ))
    message.ciphertext !== undefined &&
      (obj.ciphertext = message.ciphertext
        ? Ciphertext.toJSON(message.ciphertext)
        : undefined)
    return obj
  },

  fromPartial<I extends Exact<DeepPartial<Message>, I>>(object: I): Message {
    const message = createBaseMessage()
    message.headerBytes = object.headerBytes ?? new Uint8Array()
    message.ciphertext =
      object.ciphertext !== undefined && object.ciphertext !== null
        ? Ciphertext.fromPartial(object.ciphertext)
        : undefined
    return message
  },
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

function createBasePrivateKeyBundle(): PrivateKeyBundle {
  return { identityKey: undefined, preKeys: [] }
}

export const PrivateKeyBundle = {
  encode(
    message: PrivateKeyBundle,
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

  decode(input: _m0.Reader | Uint8Array, length?: number): PrivateKeyBundle {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBasePrivateKeyBundle()
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

  fromJSON(object: any): PrivateKeyBundle {
    return {
      identityKey: isSet(object.identityKey)
        ? PrivateKey.fromJSON(object.identityKey)
        : undefined,
      preKeys: Array.isArray(object?.preKeys)
        ? object.preKeys.map((e: any) => PrivateKey.fromJSON(e))
        : [],
    }
  },

  toJSON(message: PrivateKeyBundle): unknown {
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

  fromPartial<I extends Exact<DeepPartial<PrivateKeyBundle>, I>>(
    object: I
  ): PrivateKeyBundle {
    const message = createBasePrivateKeyBundle()
    message.identityKey =
      object.identityKey !== undefined && object.identityKey !== null
        ? PrivateKey.fromPartial(object.identityKey)
        : undefined
    message.preKeys =
      object.preKeys?.map((e) => PrivateKey.fromPartial(e)) || []
    return message
  },
}

function createBaseEncryptedPrivateKeyBundle(): EncryptedPrivateKeyBundle {
  return { walletPreKey: new Uint8Array(), ciphertext: undefined }
}

export const EncryptedPrivateKeyBundle = {
  encode(
    message: EncryptedPrivateKeyBundle,
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
  ): EncryptedPrivateKeyBundle {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseEncryptedPrivateKeyBundle()
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

  fromJSON(object: any): EncryptedPrivateKeyBundle {
    return {
      walletPreKey: isSet(object.walletPreKey)
        ? bytesFromBase64(object.walletPreKey)
        : new Uint8Array(),
      ciphertext: isSet(object.ciphertext)
        ? Ciphertext.fromJSON(object.ciphertext)
        : undefined,
    }
  },

  toJSON(message: EncryptedPrivateKeyBundle): unknown {
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

  fromPartial<I extends Exact<DeepPartial<EncryptedPrivateKeyBundle>, I>>(
    object: I
  ): EncryptedPrivateKeyBundle {
    const message = createBaseEncryptedPrivateKeyBundle()
    message.walletPreKey = object.walletPreKey ?? new Uint8Array()
    message.ciphertext =
      object.ciphertext !== undefined && object.ciphertext !== null
        ? Ciphertext.fromPartial(object.ciphertext)
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

function isObject(value: any): boolean {
  return typeof value === 'object' && value !== null
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined
}
