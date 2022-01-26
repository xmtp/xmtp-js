/* eslint-disable */
import Long from 'long';
import _m0 from 'protobufjs/minimal';

export const protobufPackage = '';

export interface Signature {
  ecdsaCompact: Signature_ECDSACompact | undefined;
}

export interface Signature_ECDSACompact {
  /** compact representation [ R || S ], 64 bytes */
  bytes: Uint8Array;
  /** recovery bit */
  recovery: number;
}

export interface PublicKey {
  secp256k1Uncompressed: PublicKey_Secp256k1Uncompresed | undefined;
  signature?: Signature | undefined;
}

export interface PublicKey_Secp256k1Uncompresed {
  /** uncompressed point with prefix (0x04) [ P || X || Y ], 65 bytes */
  bytes: Uint8Array;
}

export interface PrivateKey {
  secp256k1: PrivateKey_Secp256k1 | undefined;
}

export interface PrivateKey_Secp256k1 {
  /** D big-endian, 32 bytes */
  bytes: Uint8Array;
}

export interface Ciphertext {
  aes256GcmHkdfSha256: Ciphertext_Aes256gcmHkdfsha256 | undefined;
}

export interface Ciphertext_Aes256gcmHkdfsha256 {
  hkdfSalt: Uint8Array;
  gcmNonce: Uint8Array;
  payload: Uint8Array;
}

export interface PublicKeyBundle {
  identityKey: PublicKey | undefined;
  preKey: PublicKey | undefined;
}

export interface Message {
  header: Message_Header | undefined;
  ciphertext: Ciphertext | undefined;
}

export interface Message_Header {
  sender: PublicKeyBundle | undefined;
  recipient: PublicKeyBundle | undefined;
  timestamp: number;
}

export interface PrivateKeyBundle {
  identityKey: PrivateKey | undefined;
  preKeys: PrivateKey[];
}

export interface EncryptedPrivateKeyBundle {
  walletPreKey: Uint8Array;
  ciphertext: Ciphertext | undefined;
}

function createBaseSignature(): Signature {
  return { ecdsaCompact: undefined };
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
      ).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Signature {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignature();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.ecdsaCompact = Signature_ECDSACompact.decode(
            reader,
            reader.uint32()
          );
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Signature {
    return {
      ecdsaCompact: isSet(object.ecdsaCompact)
        ? Signature_ECDSACompact.fromJSON(object.ecdsaCompact)
        : undefined
    };
  },

  toJSON(message: Signature): unknown {
    const obj: any = {};
    message.ecdsaCompact !== undefined &&
      (obj.ecdsaCompact = message.ecdsaCompact
        ? Signature_ECDSACompact.toJSON(message.ecdsaCompact)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Signature>, I>>(
    object: I
  ): Signature {
    const message = createBaseSignature();
    message.ecdsaCompact =
      object.ecdsaCompact !== undefined && object.ecdsaCompact !== null
        ? Signature_ECDSACompact.fromPartial(object.ecdsaCompact)
        : undefined;
    return message;
  }
};

function createBaseSignature_ECDSACompact(): Signature_ECDSACompact {
  return { bytes: new Uint8Array(), recovery: 0 };
}

export const Signature_ECDSACompact = {
  encode(
    message: Signature_ECDSACompact,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.bytes.length !== 0) {
      writer.uint32(10).bytes(message.bytes);
    }
    if (message.recovery !== 0) {
      writer.uint32(16).uint32(message.recovery);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): Signature_ECDSACompact {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignature_ECDSACompact();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.bytes = reader.bytes();
          break;
        case 2:
          message.recovery = reader.uint32();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Signature_ECDSACompact {
    return {
      bytes: isSet(object.bytes)
        ? bytesFromBase64(object.bytes)
        : new Uint8Array(),
      recovery: isSet(object.recovery) ? Number(object.recovery) : 0
    };
  },

  toJSON(message: Signature_ECDSACompact): unknown {
    const obj: any = {};
    message.bytes !== undefined &&
      (obj.bytes = base64FromBytes(
        message.bytes !== undefined ? message.bytes : new Uint8Array()
      ));
    message.recovery !== undefined &&
      (obj.recovery = Math.round(message.recovery));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Signature_ECDSACompact>, I>>(
    object: I
  ): Signature_ECDSACompact {
    const message = createBaseSignature_ECDSACompact();
    message.bytes = object.bytes ?? new Uint8Array();
    message.recovery = object.recovery ?? 0;
    return message;
  }
};

function createBasePublicKey(): PublicKey {
  return { secp256k1Uncompressed: undefined, signature: undefined };
}

export const PublicKey = {
  encode(
    message: PublicKey,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.secp256k1Uncompressed !== undefined) {
      PublicKey_Secp256k1Uncompresed.encode(
        message.secp256k1Uncompressed,
        writer.uint32(10).fork()
      ).ldelim();
    }
    if (message.signature !== undefined) {
      Signature.encode(message.signature, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PublicKey {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePublicKey();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.secp256k1Uncompressed = PublicKey_Secp256k1Uncompresed.decode(
            reader,
            reader.uint32()
          );
          break;
        case 2:
          message.signature = Signature.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): PublicKey {
    return {
      secp256k1Uncompressed: isSet(object.secp256k1Uncompressed)
        ? PublicKey_Secp256k1Uncompresed.fromJSON(object.secp256k1Uncompressed)
        : undefined,
      signature: isSet(object.signature)
        ? Signature.fromJSON(object.signature)
        : undefined
    };
  },

  toJSON(message: PublicKey): unknown {
    const obj: any = {};
    message.secp256k1Uncompressed !== undefined &&
      (obj.secp256k1Uncompressed = message.secp256k1Uncompressed
        ? PublicKey_Secp256k1Uncompresed.toJSON(message.secp256k1Uncompressed)
        : undefined);
    message.signature !== undefined &&
      (obj.signature = message.signature
        ? Signature.toJSON(message.signature)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<PublicKey>, I>>(
    object: I
  ): PublicKey {
    const message = createBasePublicKey();
    message.secp256k1Uncompressed =
      object.secp256k1Uncompressed !== undefined &&
      object.secp256k1Uncompressed !== null
        ? PublicKey_Secp256k1Uncompresed.fromPartial(
            object.secp256k1Uncompressed
          )
        : undefined;
    message.signature =
      object.signature !== undefined && object.signature !== null
        ? Signature.fromPartial(object.signature)
        : undefined;
    return message;
  }
};

function createBasePublicKey_Secp256k1Uncompresed(): PublicKey_Secp256k1Uncompresed {
  return { bytes: new Uint8Array() };
}

export const PublicKey_Secp256k1Uncompresed = {
  encode(
    message: PublicKey_Secp256k1Uncompresed,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.bytes.length !== 0) {
      writer.uint32(10).bytes(message.bytes);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): PublicKey_Secp256k1Uncompresed {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePublicKey_Secp256k1Uncompresed();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.bytes = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): PublicKey_Secp256k1Uncompresed {
    return {
      bytes: isSet(object.bytes)
        ? bytesFromBase64(object.bytes)
        : new Uint8Array()
    };
  },

  toJSON(message: PublicKey_Secp256k1Uncompresed): unknown {
    const obj: any = {};
    message.bytes !== undefined &&
      (obj.bytes = base64FromBytes(
        message.bytes !== undefined ? message.bytes : new Uint8Array()
      ));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<PublicKey_Secp256k1Uncompresed>, I>>(
    object: I
  ): PublicKey_Secp256k1Uncompresed {
    const message = createBasePublicKey_Secp256k1Uncompresed();
    message.bytes = object.bytes ?? new Uint8Array();
    return message;
  }
};

function createBasePrivateKey(): PrivateKey {
  return { secp256k1: undefined };
}

export const PrivateKey = {
  encode(
    message: PrivateKey,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.secp256k1 !== undefined) {
      PrivateKey_Secp256k1.encode(
        message.secp256k1,
        writer.uint32(10).fork()
      ).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PrivateKey {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePrivateKey();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.secp256k1 = PrivateKey_Secp256k1.decode(
            reader,
            reader.uint32()
          );
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): PrivateKey {
    return {
      secp256k1: isSet(object.secp256k1)
        ? PrivateKey_Secp256k1.fromJSON(object.secp256k1)
        : undefined
    };
  },

  toJSON(message: PrivateKey): unknown {
    const obj: any = {};
    message.secp256k1 !== undefined &&
      (obj.secp256k1 = message.secp256k1
        ? PrivateKey_Secp256k1.toJSON(message.secp256k1)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<PrivateKey>, I>>(
    object: I
  ): PrivateKey {
    const message = createBasePrivateKey();
    message.secp256k1 =
      object.secp256k1 !== undefined && object.secp256k1 !== null
        ? PrivateKey_Secp256k1.fromPartial(object.secp256k1)
        : undefined;
    return message;
  }
};

function createBasePrivateKey_Secp256k1(): PrivateKey_Secp256k1 {
  return { bytes: new Uint8Array() };
}

export const PrivateKey_Secp256k1 = {
  encode(
    message: PrivateKey_Secp256k1,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.bytes.length !== 0) {
      writer.uint32(10).bytes(message.bytes);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): PrivateKey_Secp256k1 {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePrivateKey_Secp256k1();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.bytes = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): PrivateKey_Secp256k1 {
    return {
      bytes: isSet(object.bytes)
        ? bytesFromBase64(object.bytes)
        : new Uint8Array()
    };
  },

  toJSON(message: PrivateKey_Secp256k1): unknown {
    const obj: any = {};
    message.bytes !== undefined &&
      (obj.bytes = base64FromBytes(
        message.bytes !== undefined ? message.bytes : new Uint8Array()
      ));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<PrivateKey_Secp256k1>, I>>(
    object: I
  ): PrivateKey_Secp256k1 {
    const message = createBasePrivateKey_Secp256k1();
    message.bytes = object.bytes ?? new Uint8Array();
    return message;
  }
};

function createBaseCiphertext(): Ciphertext {
  return { aes256GcmHkdfSha256: undefined };
}

export const Ciphertext = {
  encode(
    message: Ciphertext,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.aes256GcmHkdfSha256 !== undefined) {
      Ciphertext_Aes256gcmHkdfsha256.encode(
        message.aes256GcmHkdfSha256,
        writer.uint32(10).fork()
      ).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Ciphertext {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCiphertext();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.aes256GcmHkdfSha256 = Ciphertext_Aes256gcmHkdfsha256.decode(
            reader,
            reader.uint32()
          );
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Ciphertext {
    return {
      aes256GcmHkdfSha256: isSet(object.aes256GcmHkdfSha256)
        ? Ciphertext_Aes256gcmHkdfsha256.fromJSON(object.aes256GcmHkdfSha256)
        : undefined
    };
  },

  toJSON(message: Ciphertext): unknown {
    const obj: any = {};
    message.aes256GcmHkdfSha256 !== undefined &&
      (obj.aes256GcmHkdfSha256 = message.aes256GcmHkdfSha256
        ? Ciphertext_Aes256gcmHkdfsha256.toJSON(message.aes256GcmHkdfSha256)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Ciphertext>, I>>(
    object: I
  ): Ciphertext {
    const message = createBaseCiphertext();
    message.aes256GcmHkdfSha256 =
      object.aes256GcmHkdfSha256 !== undefined &&
      object.aes256GcmHkdfSha256 !== null
        ? Ciphertext_Aes256gcmHkdfsha256.fromPartial(object.aes256GcmHkdfSha256)
        : undefined;
    return message;
  }
};

function createBaseCiphertext_Aes256gcmHkdfsha256(): Ciphertext_Aes256gcmHkdfsha256 {
  return {
    hkdfSalt: new Uint8Array(),
    gcmNonce: new Uint8Array(),
    payload: new Uint8Array()
  };
}

export const Ciphertext_Aes256gcmHkdfsha256 = {
  encode(
    message: Ciphertext_Aes256gcmHkdfsha256,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.hkdfSalt.length !== 0) {
      writer.uint32(10).bytes(message.hkdfSalt);
    }
    if (message.gcmNonce.length !== 0) {
      writer.uint32(18).bytes(message.gcmNonce);
    }
    if (message.payload.length !== 0) {
      writer.uint32(26).bytes(message.payload);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): Ciphertext_Aes256gcmHkdfsha256 {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCiphertext_Aes256gcmHkdfsha256();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.hkdfSalt = reader.bytes();
          break;
        case 2:
          message.gcmNonce = reader.bytes();
          break;
        case 3:
          message.payload = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Ciphertext_Aes256gcmHkdfsha256 {
    return {
      hkdfSalt: isSet(object.hkdfSalt)
        ? bytesFromBase64(object.hkdfSalt)
        : new Uint8Array(),
      gcmNonce: isSet(object.gcmNonce)
        ? bytesFromBase64(object.gcmNonce)
        : new Uint8Array(),
      payload: isSet(object.payload)
        ? bytesFromBase64(object.payload)
        : new Uint8Array()
    };
  },

  toJSON(message: Ciphertext_Aes256gcmHkdfsha256): unknown {
    const obj: any = {};
    message.hkdfSalt !== undefined &&
      (obj.hkdfSalt = base64FromBytes(
        message.hkdfSalt !== undefined ? message.hkdfSalt : new Uint8Array()
      ));
    message.gcmNonce !== undefined &&
      (obj.gcmNonce = base64FromBytes(
        message.gcmNonce !== undefined ? message.gcmNonce : new Uint8Array()
      ));
    message.payload !== undefined &&
      (obj.payload = base64FromBytes(
        message.payload !== undefined ? message.payload : new Uint8Array()
      ));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Ciphertext_Aes256gcmHkdfsha256>, I>>(
    object: I
  ): Ciphertext_Aes256gcmHkdfsha256 {
    const message = createBaseCiphertext_Aes256gcmHkdfsha256();
    message.hkdfSalt = object.hkdfSalt ?? new Uint8Array();
    message.gcmNonce = object.gcmNonce ?? new Uint8Array();
    message.payload = object.payload ?? new Uint8Array();
    return message;
  }
};

function createBasePublicKeyBundle(): PublicKeyBundle {
  return { identityKey: undefined, preKey: undefined };
}

export const PublicKeyBundle = {
  encode(
    message: PublicKeyBundle,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.identityKey !== undefined) {
      PublicKey.encode(message.identityKey, writer.uint32(10).fork()).ldelim();
    }
    if (message.preKey !== undefined) {
      PublicKey.encode(message.preKey, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PublicKeyBundle {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePublicKeyBundle();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.identityKey = PublicKey.decode(reader, reader.uint32());
          break;
        case 2:
          message.preKey = PublicKey.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): PublicKeyBundle {
    return {
      identityKey: isSet(object.identityKey)
        ? PublicKey.fromJSON(object.identityKey)
        : undefined,
      preKey: isSet(object.preKey)
        ? PublicKey.fromJSON(object.preKey)
        : undefined
    };
  },

  toJSON(message: PublicKeyBundle): unknown {
    const obj: any = {};
    message.identityKey !== undefined &&
      (obj.identityKey = message.identityKey
        ? PublicKey.toJSON(message.identityKey)
        : undefined);
    message.preKey !== undefined &&
      (obj.preKey = message.preKey
        ? PublicKey.toJSON(message.preKey)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<PublicKeyBundle>, I>>(
    object: I
  ): PublicKeyBundle {
    const message = createBasePublicKeyBundle();
    message.identityKey =
      object.identityKey !== undefined && object.identityKey !== null
        ? PublicKey.fromPartial(object.identityKey)
        : undefined;
    message.preKey =
      object.preKey !== undefined && object.preKey !== null
        ? PublicKey.fromPartial(object.preKey)
        : undefined;
    return message;
  }
};

function createBaseMessage(): Message {
  return { header: undefined, ciphertext: undefined };
}

export const Message = {
  encode(
    message: Message,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.header !== undefined) {
      Message_Header.encode(message.header, writer.uint32(10).fork()).ldelim();
    }
    if (message.ciphertext !== undefined) {
      Ciphertext.encode(message.ciphertext, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Message {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.header = Message_Header.decode(reader, reader.uint32());
          break;
        case 2:
          message.ciphertext = Ciphertext.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Message {
    return {
      header: isSet(object.header)
        ? Message_Header.fromJSON(object.header)
        : undefined,
      ciphertext: isSet(object.ciphertext)
        ? Ciphertext.fromJSON(object.ciphertext)
        : undefined
    };
  },

  toJSON(message: Message): unknown {
    const obj: any = {};
    message.header !== undefined &&
      (obj.header = message.header
        ? Message_Header.toJSON(message.header)
        : undefined);
    message.ciphertext !== undefined &&
      (obj.ciphertext = message.ciphertext
        ? Ciphertext.toJSON(message.ciphertext)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Message>, I>>(object: I): Message {
    const message = createBaseMessage();
    message.header =
      object.header !== undefined && object.header !== null
        ? Message_Header.fromPartial(object.header)
        : undefined;
    message.ciphertext =
      object.ciphertext !== undefined && object.ciphertext !== null
        ? Ciphertext.fromPartial(object.ciphertext)
        : undefined;
    return message;
  }
};

function createBaseMessage_Header(): Message_Header {
  return { sender: undefined, recipient: undefined, timestamp: 0 };
}

export const Message_Header = {
  encode(
    message: Message_Header,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.sender !== undefined) {
      PublicKeyBundle.encode(message.sender, writer.uint32(10).fork()).ldelim();
    }
    if (message.recipient !== undefined) {
      PublicKeyBundle.encode(
        message.recipient,
        writer.uint32(18).fork()
      ).ldelim();
    }
    if (message.timestamp !== 0) {
      writer.uint32(24).uint64(message.timestamp);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Message_Header {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMessage_Header();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.sender = PublicKeyBundle.decode(reader, reader.uint32());
          break;
        case 2:
          message.recipient = PublicKeyBundle.decode(reader, reader.uint32());
          break;
        case 3:
          message.timestamp = longToNumber(reader.uint64() as Long);
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Message_Header {
    return {
      sender: isSet(object.sender)
        ? PublicKeyBundle.fromJSON(object.sender)
        : undefined,
      recipient: isSet(object.recipient)
        ? PublicKeyBundle.fromJSON(object.recipient)
        : undefined,
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0
    };
  },

  toJSON(message: Message_Header): unknown {
    const obj: any = {};
    message.sender !== undefined &&
      (obj.sender = message.sender
        ? PublicKeyBundle.toJSON(message.sender)
        : undefined);
    message.recipient !== undefined &&
      (obj.recipient = message.recipient
        ? PublicKeyBundle.toJSON(message.recipient)
        : undefined);
    message.timestamp !== undefined &&
      (obj.timestamp = Math.round(message.timestamp));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Message_Header>, I>>(
    object: I
  ): Message_Header {
    const message = createBaseMessage_Header();
    message.sender =
      object.sender !== undefined && object.sender !== null
        ? PublicKeyBundle.fromPartial(object.sender)
        : undefined;
    message.recipient =
      object.recipient !== undefined && object.recipient !== null
        ? PublicKeyBundle.fromPartial(object.recipient)
        : undefined;
    message.timestamp = object.timestamp ?? 0;
    return message;
  }
};

function createBasePrivateKeyBundle(): PrivateKeyBundle {
  return { identityKey: undefined, preKeys: [] };
}

export const PrivateKeyBundle = {
  encode(
    message: PrivateKeyBundle,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.identityKey !== undefined) {
      PrivateKey.encode(message.identityKey, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.preKeys) {
      PrivateKey.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PrivateKeyBundle {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePrivateKeyBundle();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.identityKey = PrivateKey.decode(reader, reader.uint32());
          break;
        case 2:
          message.preKeys.push(PrivateKey.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): PrivateKeyBundle {
    return {
      identityKey: isSet(object.identityKey)
        ? PrivateKey.fromJSON(object.identityKey)
        : undefined,
      preKeys: Array.isArray(object?.preKeys)
        ? object.preKeys.map((e: any) => PrivateKey.fromJSON(e))
        : []
    };
  },

  toJSON(message: PrivateKeyBundle): unknown {
    const obj: any = {};
    message.identityKey !== undefined &&
      (obj.identityKey = message.identityKey
        ? PrivateKey.toJSON(message.identityKey)
        : undefined);
    if (message.preKeys) {
      obj.preKeys = message.preKeys.map(e =>
        e ? PrivateKey.toJSON(e) : undefined
      );
    } else {
      obj.preKeys = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<PrivateKeyBundle>, I>>(
    object: I
  ): PrivateKeyBundle {
    const message = createBasePrivateKeyBundle();
    message.identityKey =
      object.identityKey !== undefined && object.identityKey !== null
        ? PrivateKey.fromPartial(object.identityKey)
        : undefined;
    message.preKeys = object.preKeys?.map(e => PrivateKey.fromPartial(e)) || [];
    return message;
  }
};

function createBaseEncryptedPrivateKeyBundle(): EncryptedPrivateKeyBundle {
  return { walletPreKey: new Uint8Array(), ciphertext: undefined };
}

export const EncryptedPrivateKeyBundle = {
  encode(
    message: EncryptedPrivateKeyBundle,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.walletPreKey.length !== 0) {
      writer.uint32(10).bytes(message.walletPreKey);
    }
    if (message.ciphertext !== undefined) {
      Ciphertext.encode(message.ciphertext, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): EncryptedPrivateKeyBundle {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEncryptedPrivateKeyBundle();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.walletPreKey = reader.bytes();
          break;
        case 2:
          message.ciphertext = Ciphertext.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): EncryptedPrivateKeyBundle {
    return {
      walletPreKey: isSet(object.walletPreKey)
        ? bytesFromBase64(object.walletPreKey)
        : new Uint8Array(),
      ciphertext: isSet(object.ciphertext)
        ? Ciphertext.fromJSON(object.ciphertext)
        : undefined
    };
  },

  toJSON(message: EncryptedPrivateKeyBundle): unknown {
    const obj: any = {};
    message.walletPreKey !== undefined &&
      (obj.walletPreKey = base64FromBytes(
        message.walletPreKey !== undefined
          ? message.walletPreKey
          : new Uint8Array()
      ));
    message.ciphertext !== undefined &&
      (obj.ciphertext = message.ciphertext
        ? Ciphertext.toJSON(message.ciphertext)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<EncryptedPrivateKeyBundle>, I>>(
    object: I
  ): EncryptedPrivateKeyBundle {
    const message = createBaseEncryptedPrivateKeyBundle();
    message.walletPreKey = object.walletPreKey ?? new Uint8Array();
    message.ciphertext =
      object.ciphertext !== undefined && object.ciphertext !== null
        ? Ciphertext.fromPartial(object.ciphertext)
        : undefined;
    return message;
  }
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var globalThis: any = (() => {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof self !== 'undefined') return self;
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global;
  throw 'Unable to locate global object';
})();

const atob: (b64: string) => string =
  globalThis.atob ||
  (b64 => globalThis.Buffer.from(b64, 'base64').toString('binary'));
function bytesFromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; ++i) {
    arr[i] = bin.charCodeAt(i);
  }
  return arr;
}

const btoa: (bin: string) => string =
  globalThis.btoa ||
  (bin => globalThis.Buffer.from(bin, 'binary').toString('base64'));
function base64FromBytes(arr: Uint8Array): string {
  const bin: string[] = [];
  for (const byte of arr) {
    bin.push(String.fromCharCode(byte));
  }
  return btoa(bin.join(''));
}

type Builtin =
  | Date
  | Function
  | Uint8Array
  | string
  | number
  | boolean
  | undefined;

export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin
  ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & Record<
        Exclude<keyof I, KeysOfUnion<P>>,
        never
      >;

function longToNumber(long: Long): number {
  if (long.gt(Number.MAX_SAFE_INTEGER)) {
    throw new globalThis.Error('Value is larger than Number.MAX_SAFE_INTEGER');
  }
  return long.toNumber();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
