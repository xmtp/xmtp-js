function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/* eslint-disable */
import Long from 'long';
import _m0 from 'protobufjs/minimal';
export var protobufPackage = '';

function createBaseSignature() {
  return {
    ecdsaCompact: undefined
  };
}

export var Signature = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.ecdsaCompact !== undefined) {
      Signature_ECDSACompact.encode(message.ecdsaCompact, writer.uint32(10).fork()).ldelim();
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    var end = length === undefined ? reader.len : reader.pos + length;
    var message = createBaseSignature();

    while (reader.pos < end) {
      var tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.ecdsaCompact = Signature_ECDSACompact.decode(reader, reader.uint32());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },
  fromJSON: function fromJSON(object) {
    return {
      ecdsaCompact: isSet(object.ecdsaCompact) ? Signature_ECDSACompact.fromJSON(object.ecdsaCompact) : undefined
    };
  },
  toJSON: function toJSON(message) {
    var obj = {};
    message.ecdsaCompact !== undefined && (obj.ecdsaCompact = message.ecdsaCompact ? Signature_ECDSACompact.toJSON(message.ecdsaCompact) : undefined);
    return obj;
  },
  fromPartial: function fromPartial(object) {
    var message = createBaseSignature();
    message.ecdsaCompact = object.ecdsaCompact !== undefined && object.ecdsaCompact !== null ? Signature_ECDSACompact.fromPartial(object.ecdsaCompact) : undefined;
    return message;
  }
};

function createBaseSignature_ECDSACompact() {
  return {
    bytes: new Uint8Array(),
    recovery: 0
  };
}

export var Signature_ECDSACompact = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.bytes.length !== 0) {
      writer.uint32(10).bytes(message.bytes);
    }

    if (message.recovery !== 0) {
      writer.uint32(16).uint32(message.recovery);
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    var end = length === undefined ? reader.len : reader.pos + length;
    var message = createBaseSignature_ECDSACompact();

    while (reader.pos < end) {
      var tag = reader.uint32();

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
  fromJSON: function fromJSON(object) {
    return {
      bytes: isSet(object.bytes) ? bytesFromBase64(object.bytes) : new Uint8Array(),
      recovery: isSet(object.recovery) ? Number(object.recovery) : 0
    };
  },
  toJSON: function toJSON(message) {
    var obj = {};
    message.bytes !== undefined && (obj.bytes = base64FromBytes(message.bytes !== undefined ? message.bytes : new Uint8Array()));
    message.recovery !== undefined && (obj.recovery = Math.round(message.recovery));
    return obj;
  },
  fromPartial: function fromPartial(object) {
    var _object$bytes, _object$recovery;

    var message = createBaseSignature_ECDSACompact();
    message.bytes = (_object$bytes = object.bytes) !== null && _object$bytes !== void 0 ? _object$bytes : new Uint8Array();
    message.recovery = (_object$recovery = object.recovery) !== null && _object$recovery !== void 0 ? _object$recovery : 0;
    return message;
  }
};

function createBasePublicKey() {
  return {
    secp256k1Uncompressed: undefined,
    signature: undefined
  };
}

export var PublicKey = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.secp256k1Uncompressed !== undefined) {
      PublicKey_Secp256k1Uncompresed.encode(message.secp256k1Uncompressed, writer.uint32(10).fork()).ldelim();
    }

    if (message.signature !== undefined) {
      Signature.encode(message.signature, writer.uint32(18).fork()).ldelim();
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    var end = length === undefined ? reader.len : reader.pos + length;
    var message = createBasePublicKey();

    while (reader.pos < end) {
      var tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.secp256k1Uncompressed = PublicKey_Secp256k1Uncompresed.decode(reader, reader.uint32());
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
  fromJSON: function fromJSON(object) {
    return {
      secp256k1Uncompressed: isSet(object.secp256k1Uncompressed) ? PublicKey_Secp256k1Uncompresed.fromJSON(object.secp256k1Uncompressed) : undefined,
      signature: isSet(object.signature) ? Signature.fromJSON(object.signature) : undefined
    };
  },
  toJSON: function toJSON(message) {
    var obj = {};
    message.secp256k1Uncompressed !== undefined && (obj.secp256k1Uncompressed = message.secp256k1Uncompressed ? PublicKey_Secp256k1Uncompresed.toJSON(message.secp256k1Uncompressed) : undefined);
    message.signature !== undefined && (obj.signature = message.signature ? Signature.toJSON(message.signature) : undefined);
    return obj;
  },
  fromPartial: function fromPartial(object) {
    var message = createBasePublicKey();
    message.secp256k1Uncompressed = object.secp256k1Uncompressed !== undefined && object.secp256k1Uncompressed !== null ? PublicKey_Secp256k1Uncompresed.fromPartial(object.secp256k1Uncompressed) : undefined;
    message.signature = object.signature !== undefined && object.signature !== null ? Signature.fromPartial(object.signature) : undefined;
    return message;
  }
};

function createBasePublicKey_Secp256k1Uncompresed() {
  return {
    bytes: new Uint8Array()
  };
}

export var PublicKey_Secp256k1Uncompresed = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.bytes.length !== 0) {
      writer.uint32(10).bytes(message.bytes);
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    var end = length === undefined ? reader.len : reader.pos + length;
    var message = createBasePublicKey_Secp256k1Uncompresed();

    while (reader.pos < end) {
      var tag = reader.uint32();

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
  fromJSON: function fromJSON(object) {
    return {
      bytes: isSet(object.bytes) ? bytesFromBase64(object.bytes) : new Uint8Array()
    };
  },
  toJSON: function toJSON(message) {
    var obj = {};
    message.bytes !== undefined && (obj.bytes = base64FromBytes(message.bytes !== undefined ? message.bytes : new Uint8Array()));
    return obj;
  },
  fromPartial: function fromPartial(object) {
    var _object$bytes2;

    var message = createBasePublicKey_Secp256k1Uncompresed();
    message.bytes = (_object$bytes2 = object.bytes) !== null && _object$bytes2 !== void 0 ? _object$bytes2 : new Uint8Array();
    return message;
  }
};

function createBasePrivateKey() {
  return {
    secp256k1: undefined
  };
}

export var PrivateKey = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.secp256k1 !== undefined) {
      PrivateKey_Secp256k1.encode(message.secp256k1, writer.uint32(10).fork()).ldelim();
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    var end = length === undefined ? reader.len : reader.pos + length;
    var message = createBasePrivateKey();

    while (reader.pos < end) {
      var tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.secp256k1 = PrivateKey_Secp256k1.decode(reader, reader.uint32());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },
  fromJSON: function fromJSON(object) {
    return {
      secp256k1: isSet(object.secp256k1) ? PrivateKey_Secp256k1.fromJSON(object.secp256k1) : undefined
    };
  },
  toJSON: function toJSON(message) {
    var obj = {};
    message.secp256k1 !== undefined && (obj.secp256k1 = message.secp256k1 ? PrivateKey_Secp256k1.toJSON(message.secp256k1) : undefined);
    return obj;
  },
  fromPartial: function fromPartial(object) {
    var message = createBasePrivateKey();
    message.secp256k1 = object.secp256k1 !== undefined && object.secp256k1 !== null ? PrivateKey_Secp256k1.fromPartial(object.secp256k1) : undefined;
    return message;
  }
};

function createBasePrivateKey_Secp256k1() {
  return {
    bytes: new Uint8Array()
  };
}

export var PrivateKey_Secp256k1 = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.bytes.length !== 0) {
      writer.uint32(10).bytes(message.bytes);
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    var end = length === undefined ? reader.len : reader.pos + length;
    var message = createBasePrivateKey_Secp256k1();

    while (reader.pos < end) {
      var tag = reader.uint32();

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
  fromJSON: function fromJSON(object) {
    return {
      bytes: isSet(object.bytes) ? bytesFromBase64(object.bytes) : new Uint8Array()
    };
  },
  toJSON: function toJSON(message) {
    var obj = {};
    message.bytes !== undefined && (obj.bytes = base64FromBytes(message.bytes !== undefined ? message.bytes : new Uint8Array()));
    return obj;
  },
  fromPartial: function fromPartial(object) {
    var _object$bytes3;

    var message = createBasePrivateKey_Secp256k1();
    message.bytes = (_object$bytes3 = object.bytes) !== null && _object$bytes3 !== void 0 ? _object$bytes3 : new Uint8Array();
    return message;
  }
};

function createBaseCiphertext() {
  return {
    aes256GcmHkdfSha256: undefined
  };
}

export var Ciphertext = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.aes256GcmHkdfSha256 !== undefined) {
      Ciphertext_Aes256gcmHkdfsha256.encode(message.aes256GcmHkdfSha256, writer.uint32(10).fork()).ldelim();
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    var end = length === undefined ? reader.len : reader.pos + length;
    var message = createBaseCiphertext();

    while (reader.pos < end) {
      var tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.aes256GcmHkdfSha256 = Ciphertext_Aes256gcmHkdfsha256.decode(reader, reader.uint32());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },
  fromJSON: function fromJSON(object) {
    return {
      aes256GcmHkdfSha256: isSet(object.aes256GcmHkdfSha256) ? Ciphertext_Aes256gcmHkdfsha256.fromJSON(object.aes256GcmHkdfSha256) : undefined
    };
  },
  toJSON: function toJSON(message) {
    var obj = {};
    message.aes256GcmHkdfSha256 !== undefined && (obj.aes256GcmHkdfSha256 = message.aes256GcmHkdfSha256 ? Ciphertext_Aes256gcmHkdfsha256.toJSON(message.aes256GcmHkdfSha256) : undefined);
    return obj;
  },
  fromPartial: function fromPartial(object) {
    var message = createBaseCiphertext();
    message.aes256GcmHkdfSha256 = object.aes256GcmHkdfSha256 !== undefined && object.aes256GcmHkdfSha256 !== null ? Ciphertext_Aes256gcmHkdfsha256.fromPartial(object.aes256GcmHkdfSha256) : undefined;
    return message;
  }
};

function createBaseCiphertext_Aes256gcmHkdfsha256() {
  return {
    hkdfSalt: new Uint8Array(),
    gcmNonce: new Uint8Array(),
    payload: new Uint8Array()
  };
}

export var Ciphertext_Aes256gcmHkdfsha256 = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

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
  decode: function decode(input, length) {
    var reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    var end = length === undefined ? reader.len : reader.pos + length;
    var message = createBaseCiphertext_Aes256gcmHkdfsha256();

    while (reader.pos < end) {
      var tag = reader.uint32();

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
  fromJSON: function fromJSON(object) {
    return {
      hkdfSalt: isSet(object.hkdfSalt) ? bytesFromBase64(object.hkdfSalt) : new Uint8Array(),
      gcmNonce: isSet(object.gcmNonce) ? bytesFromBase64(object.gcmNonce) : new Uint8Array(),
      payload: isSet(object.payload) ? bytesFromBase64(object.payload) : new Uint8Array()
    };
  },
  toJSON: function toJSON(message) {
    var obj = {};
    message.hkdfSalt !== undefined && (obj.hkdfSalt = base64FromBytes(message.hkdfSalt !== undefined ? message.hkdfSalt : new Uint8Array()));
    message.gcmNonce !== undefined && (obj.gcmNonce = base64FromBytes(message.gcmNonce !== undefined ? message.gcmNonce : new Uint8Array()));
    message.payload !== undefined && (obj.payload = base64FromBytes(message.payload !== undefined ? message.payload : new Uint8Array()));
    return obj;
  },
  fromPartial: function fromPartial(object) {
    var _object$hkdfSalt, _object$gcmNonce, _object$payload;

    var message = createBaseCiphertext_Aes256gcmHkdfsha256();
    message.hkdfSalt = (_object$hkdfSalt = object.hkdfSalt) !== null && _object$hkdfSalt !== void 0 ? _object$hkdfSalt : new Uint8Array();
    message.gcmNonce = (_object$gcmNonce = object.gcmNonce) !== null && _object$gcmNonce !== void 0 ? _object$gcmNonce : new Uint8Array();
    message.payload = (_object$payload = object.payload) !== null && _object$payload !== void 0 ? _object$payload : new Uint8Array();
    return message;
  }
};

function createBasePublicKeyBundle() {
  return {
    identityKey: undefined,
    preKey: undefined
  };
}

export var PublicKeyBundle = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.identityKey !== undefined) {
      PublicKey.encode(message.identityKey, writer.uint32(10).fork()).ldelim();
    }

    if (message.preKey !== undefined) {
      PublicKey.encode(message.preKey, writer.uint32(18).fork()).ldelim();
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    var end = length === undefined ? reader.len : reader.pos + length;
    var message = createBasePublicKeyBundle();

    while (reader.pos < end) {
      var tag = reader.uint32();

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
  fromJSON: function fromJSON(object) {
    return {
      identityKey: isSet(object.identityKey) ? PublicKey.fromJSON(object.identityKey) : undefined,
      preKey: isSet(object.preKey) ? PublicKey.fromJSON(object.preKey) : undefined
    };
  },
  toJSON: function toJSON(message) {
    var obj = {};
    message.identityKey !== undefined && (obj.identityKey = message.identityKey ? PublicKey.toJSON(message.identityKey) : undefined);
    message.preKey !== undefined && (obj.preKey = message.preKey ? PublicKey.toJSON(message.preKey) : undefined);
    return obj;
  },
  fromPartial: function fromPartial(object) {
    var message = createBasePublicKeyBundle();
    message.identityKey = object.identityKey !== undefined && object.identityKey !== null ? PublicKey.fromPartial(object.identityKey) : undefined;
    message.preKey = object.preKey !== undefined && object.preKey !== null ? PublicKey.fromPartial(object.preKey) : undefined;
    return message;
  }
};

function createBaseMessage() {
  return {
    header: undefined,
    ciphertext: undefined
  };
}

export var Message = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.header !== undefined) {
      Message_Header.encode(message.header, writer.uint32(10).fork()).ldelim();
    }

    if (message.ciphertext !== undefined) {
      Ciphertext.encode(message.ciphertext, writer.uint32(18).fork()).ldelim();
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    var end = length === undefined ? reader.len : reader.pos + length;
    var message = createBaseMessage();

    while (reader.pos < end) {
      var tag = reader.uint32();

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
  fromJSON: function fromJSON(object) {
    return {
      header: isSet(object.header) ? Message_Header.fromJSON(object.header) : undefined,
      ciphertext: isSet(object.ciphertext) ? Ciphertext.fromJSON(object.ciphertext) : undefined
    };
  },
  toJSON: function toJSON(message) {
    var obj = {};
    message.header !== undefined && (obj.header = message.header ? Message_Header.toJSON(message.header) : undefined);
    message.ciphertext !== undefined && (obj.ciphertext = message.ciphertext ? Ciphertext.toJSON(message.ciphertext) : undefined);
    return obj;
  },
  fromPartial: function fromPartial(object) {
    var message = createBaseMessage();
    message.header = object.header !== undefined && object.header !== null ? Message_Header.fromPartial(object.header) : undefined;
    message.ciphertext = object.ciphertext !== undefined && object.ciphertext !== null ? Ciphertext.fromPartial(object.ciphertext) : undefined;
    return message;
  }
};

function createBaseMessage_Header() {
  return {
    sender: undefined,
    recipient: undefined
  };
}

export var Message_Header = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.sender !== undefined) {
      PublicKeyBundle.encode(message.sender, writer.uint32(10).fork()).ldelim();
    }

    if (message.recipient !== undefined) {
      PublicKeyBundle.encode(message.recipient, writer.uint32(18).fork()).ldelim();
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    var end = length === undefined ? reader.len : reader.pos + length;
    var message = createBaseMessage_Header();

    while (reader.pos < end) {
      var tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.sender = PublicKeyBundle.decode(reader, reader.uint32());
          break;

        case 2:
          message.recipient = PublicKeyBundle.decode(reader, reader.uint32());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },
  fromJSON: function fromJSON(object) {
    return {
      sender: isSet(object.sender) ? PublicKeyBundle.fromJSON(object.sender) : undefined,
      recipient: isSet(object.recipient) ? PublicKeyBundle.fromJSON(object.recipient) : undefined
    };
  },
  toJSON: function toJSON(message) {
    var obj = {};
    message.sender !== undefined && (obj.sender = message.sender ? PublicKeyBundle.toJSON(message.sender) : undefined);
    message.recipient !== undefined && (obj.recipient = message.recipient ? PublicKeyBundle.toJSON(message.recipient) : undefined);
    return obj;
  },
  fromPartial: function fromPartial(object) {
    var message = createBaseMessage_Header();
    message.sender = object.sender !== undefined && object.sender !== null ? PublicKeyBundle.fromPartial(object.sender) : undefined;
    message.recipient = object.recipient !== undefined && object.recipient !== null ? PublicKeyBundle.fromPartial(object.recipient) : undefined;
    return message;
  }
};

function createBasePrivateKeyBundle() {
  return {
    identityKey: undefined,
    preKeys: []
  };
}

export var PrivateKeyBundle = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.identityKey !== undefined) {
      PrivateKey.encode(message.identityKey, writer.uint32(10).fork()).ldelim();
    }

    var _iterator = _createForOfIteratorHelper(message.preKeys),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var v = _step.value;
        PrivateKey.encode(v, writer.uint32(18).fork()).ldelim();
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    var end = length === undefined ? reader.len : reader.pos + length;
    var message = createBasePrivateKeyBundle();

    while (reader.pos < end) {
      var tag = reader.uint32();

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
  fromJSON: function fromJSON(object) {
    return {
      identityKey: isSet(object.identityKey) ? PrivateKey.fromJSON(object.identityKey) : undefined,
      preKeys: Array.isArray(object === null || object === void 0 ? void 0 : object.preKeys) ? object.preKeys.map(function (e) {
        return PrivateKey.fromJSON(e);
      }) : []
    };
  },
  toJSON: function toJSON(message) {
    var obj = {};
    message.identityKey !== undefined && (obj.identityKey = message.identityKey ? PrivateKey.toJSON(message.identityKey) : undefined);

    if (message.preKeys) {
      obj.preKeys = message.preKeys.map(function (e) {
        return e ? PrivateKey.toJSON(e) : undefined;
      });
    } else {
      obj.preKeys = [];
    }

    return obj;
  },
  fromPartial: function fromPartial(object) {
    var _object$preKeys;

    var message = createBasePrivateKeyBundle();
    message.identityKey = object.identityKey !== undefined && object.identityKey !== null ? PrivateKey.fromPartial(object.identityKey) : undefined;
    message.preKeys = ((_object$preKeys = object.preKeys) === null || _object$preKeys === void 0 ? void 0 : _object$preKeys.map(function (e) {
      return PrivateKey.fromPartial(e);
    })) || [];
    return message;
  }
};

function createBaseEncryptedPrivateKeyBundle() {
  return {
    walletPreKey: new Uint8Array(),
    ciphertext: undefined
  };
}

export var EncryptedPrivateKeyBundle = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.walletPreKey.length !== 0) {
      writer.uint32(10).bytes(message.walletPreKey);
    }

    if (message.ciphertext !== undefined) {
      Ciphertext.encode(message.ciphertext, writer.uint32(18).fork()).ldelim();
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    var end = length === undefined ? reader.len : reader.pos + length;
    var message = createBaseEncryptedPrivateKeyBundle();

    while (reader.pos < end) {
      var tag = reader.uint32();

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
  fromJSON: function fromJSON(object) {
    return {
      walletPreKey: isSet(object.walletPreKey) ? bytesFromBase64(object.walletPreKey) : new Uint8Array(),
      ciphertext: isSet(object.ciphertext) ? Ciphertext.fromJSON(object.ciphertext) : undefined
    };
  },
  toJSON: function toJSON(message) {
    var obj = {};
    message.walletPreKey !== undefined && (obj.walletPreKey = base64FromBytes(message.walletPreKey !== undefined ? message.walletPreKey : new Uint8Array()));
    message.ciphertext !== undefined && (obj.ciphertext = message.ciphertext ? Ciphertext.toJSON(message.ciphertext) : undefined);
    return obj;
  },
  fromPartial: function fromPartial(object) {
    var _object$walletPreKey;

    var message = createBaseEncryptedPrivateKeyBundle();
    message.walletPreKey = (_object$walletPreKey = object.walletPreKey) !== null && _object$walletPreKey !== void 0 ? _object$walletPreKey : new Uint8Array();
    message.ciphertext = object.ciphertext !== undefined && object.ciphertext !== null ? Ciphertext.fromPartial(object.ciphertext) : undefined;
    return message;
  }
};

var globalThis = function () {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof self !== 'undefined') return self;
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global;
  throw 'Unable to locate global object';
}();

var atob = globalThis.atob || function (b64) {
  return globalThis.Buffer.from(b64, 'base64').toString('binary');
};

function bytesFromBase64(b64) {
  var bin = atob(b64);
  var arr = new Uint8Array(bin.length);

  for (var i = 0; i < bin.length; ++i) {
    arr[i] = bin.charCodeAt(i);
  }

  return arr;
}

var btoa = globalThis.btoa || function (bin) {
  return globalThis.Buffer.from(bin, 'binary').toString('base64');
};

function base64FromBytes(arr) {
  var bin = [];

  var _iterator2 = _createForOfIteratorHelper(arr),
      _step2;

  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var _byte = _step2.value;
      bin.push(String.fromCharCode(_byte));
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }

  return btoa(bin.join(''));
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long;

  _m0.configure();
}

function isSet(value) {
  return value !== null && value !== undefined;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wcm90by9tZXNzYWdlLnRzIl0sIm5hbWVzIjpbIkxvbmciLCJfbTAiLCJwcm90b2J1ZlBhY2thZ2UiLCJjcmVhdGVCYXNlU2lnbmF0dXJlIiwiZWNkc2FDb21wYWN0IiwidW5kZWZpbmVkIiwiU2lnbmF0dXJlIiwiZW5jb2RlIiwibWVzc2FnZSIsIndyaXRlciIsIldyaXRlciIsImNyZWF0ZSIsIlNpZ25hdHVyZV9FQ0RTQUNvbXBhY3QiLCJ1aW50MzIiLCJmb3JrIiwibGRlbGltIiwiZGVjb2RlIiwiaW5wdXQiLCJsZW5ndGgiLCJyZWFkZXIiLCJSZWFkZXIiLCJlbmQiLCJsZW4iLCJwb3MiLCJ0YWciLCJza2lwVHlwZSIsImZyb21KU09OIiwib2JqZWN0IiwiaXNTZXQiLCJ0b0pTT04iLCJvYmoiLCJmcm9tUGFydGlhbCIsImNyZWF0ZUJhc2VTaWduYXR1cmVfRUNEU0FDb21wYWN0IiwiYnl0ZXMiLCJVaW50OEFycmF5IiwicmVjb3ZlcnkiLCJieXRlc0Zyb21CYXNlNjQiLCJOdW1iZXIiLCJiYXNlNjRGcm9tQnl0ZXMiLCJNYXRoIiwicm91bmQiLCJjcmVhdGVCYXNlUHVibGljS2V5Iiwic2VjcDI1NmsxVW5jb21wcmVzc2VkIiwic2lnbmF0dXJlIiwiUHVibGljS2V5IiwiUHVibGljS2V5X1NlY3AyNTZrMVVuY29tcHJlc2VkIiwiY3JlYXRlQmFzZVB1YmxpY0tleV9TZWNwMjU2azFVbmNvbXByZXNlZCIsImNyZWF0ZUJhc2VQcml2YXRlS2V5Iiwic2VjcDI1NmsxIiwiUHJpdmF0ZUtleSIsIlByaXZhdGVLZXlfU2VjcDI1NmsxIiwiY3JlYXRlQmFzZVByaXZhdGVLZXlfU2VjcDI1NmsxIiwiY3JlYXRlQmFzZUNpcGhlcnRleHQiLCJhZXMyNTZHY21Ia2RmU2hhMjU2IiwiQ2lwaGVydGV4dCIsIkNpcGhlcnRleHRfQWVzMjU2Z2NtSGtkZnNoYTI1NiIsImNyZWF0ZUJhc2VDaXBoZXJ0ZXh0X0FlczI1NmdjbUhrZGZzaGEyNTYiLCJoa2RmU2FsdCIsImdjbU5vbmNlIiwicGF5bG9hZCIsImNyZWF0ZUJhc2VQdWJsaWNLZXlCdW5kbGUiLCJpZGVudGl0eUtleSIsInByZUtleSIsIlB1YmxpY0tleUJ1bmRsZSIsImNyZWF0ZUJhc2VNZXNzYWdlIiwiaGVhZGVyIiwiY2lwaGVydGV4dCIsIk1lc3NhZ2UiLCJNZXNzYWdlX0hlYWRlciIsImNyZWF0ZUJhc2VNZXNzYWdlX0hlYWRlciIsInNlbmRlciIsInJlY2lwaWVudCIsImNyZWF0ZUJhc2VQcml2YXRlS2V5QnVuZGxlIiwicHJlS2V5cyIsIlByaXZhdGVLZXlCdW5kbGUiLCJ2IiwicHVzaCIsIkFycmF5IiwiaXNBcnJheSIsIm1hcCIsImUiLCJjcmVhdGVCYXNlRW5jcnlwdGVkUHJpdmF0ZUtleUJ1bmRsZSIsIndhbGxldFByZUtleSIsIkVuY3J5cHRlZFByaXZhdGVLZXlCdW5kbGUiLCJnbG9iYWxUaGlzIiwic2VsZiIsIndpbmRvdyIsImdsb2JhbCIsImF0b2IiLCJiNjQiLCJCdWZmZXIiLCJmcm9tIiwidG9TdHJpbmciLCJiaW4iLCJhcnIiLCJpIiwiY2hhckNvZGVBdCIsImJ0b2EiLCJieXRlIiwiU3RyaW5nIiwiZnJvbUNoYXJDb2RlIiwiam9pbiIsInV0aWwiLCJjb25maWd1cmUiLCJ2YWx1ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7QUFDQSxPQUFPQSxJQUFQLE1BQWlCLE1BQWpCO0FBQ0EsT0FBT0MsR0FBUCxNQUFnQixvQkFBaEI7QUFFQSxPQUFPLElBQU1DLGVBQWUsR0FBRyxFQUF4Qjs7QUFtRVAsU0FBU0MsbUJBQVQsR0FBMEM7QUFDeEMsU0FBTztBQUFFQyxJQUFBQSxZQUFZLEVBQUVDO0FBQWhCLEdBQVA7QUFDRDs7QUFFRCxPQUFPLElBQU1DLFNBQVMsR0FBRztBQUN2QkMsRUFBQUEsTUFEdUIsa0JBRXJCQyxPQUZxQixFQUlUO0FBQUEsUUFEWkMsTUFDWSx1RUFEU1IsR0FBRyxDQUFDUyxNQUFKLENBQVdDLE1BQVgsRUFDVDs7QUFDWixRQUFJSCxPQUFPLENB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Ki9cbmltcG9ydCBMb25nIGZyb20gJ2xvbmcnO1xuaW1wb3J0IF9tMCBmcm9tICdwcm90b2J1ZmpzL21pbmltYWwnO1xuXG5leHBvcnQgY29uc3QgcHJvdG9idWZQYWNrYWdlID0gJyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2lnbmF0dXJlIHtcbiAgZWNkc2FDb21wYWN0OiBTaWduYXR1cmVfRUNEU0FDb21wYWN0IHwgdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25hdHVyZV9FQ0RTQUNvbXBhY3Qge1xuICAvKiogY29tcGFjdCByZXByZXNlbnRhdGlvbiBbIFIgfHwgUyBdLCA2NCBieXRlcyAqL1xuICBieXRlczogVWludDhBcnJheTtcbiAgLyoqIHJlY292ZXJ5IGJpdCAqL1xuICByZWNvdmVyeTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFB1YmxpY0tleSB7XG4gIHNlY3AyNTZrMVVuY29tcHJlc3NlZDogUHVibGljS2V5X1NlY3AyNTZrMVVuY29tcHJlc2VkIHwgdW5kZWZpbmVkO1xuICBzaWduYXR1cmU/OiBTaWduYXR1cmUgfCB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHVibGljS2V5X1NlY3AyNTZrMVVuY29tcHJlc2VkIHtcbiAgLyoqIHVuY29tcHJlc3NlZCBwb2ludCB3aXRoIHByZWZpeCAoMHgwNCkgWyBQIHx8IFggfHwgWSBdLCA2NSBieXRlcyAqL1xuICBieXRlczogVWludDhBcnJheTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcml2YXRlS2V5IHtcbiAgc2VjcDI1NmsxOiBQcml2YXRlS2V5X1NlY3AyNTZrMSB8IHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcml2YXRlS2V5X1NlY3AyNTZrMSB7XG4gIC8qKiBEIGJpZy1lbmRpYW4sIDMyIGJ5dGVzICovXG4gIGJ5dGVzOiBVaW50OEFycmF5O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENpcGhlcnRleHQge1xuICBhZXMyNTZHY21Ia2RmU2hhMjU2OiBDaXBoZXJ0ZXh0X0FlczI1NmdjbUhrZGZzaGEyNTYgfCB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2lwaGVydGV4dF9BZXMyNTZnY21Ia2Rmc2hhMjU2IHtcbiAgaGtkZlNhbHQ6IFVpbnQ4QXJyYXk7XG4gIGdjbU5vbmNlOiBVaW50OEFycmF5O1xuICBwYXlsb2FkOiBVaW50OEFycmF5O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFB1YmxpY0tleUJ1bmRsZSB7XG4gIGlkZW50aXR5S2V5OiBQdWJsaWNLZXkgfCB1bmRlZmluZWQ7XG4gIHByZUtleTogUHVibGljS2V5IHwgdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1lc3NhZ2Uge1xuICBoZWFkZXI6IE1lc3NhZ2VfSGVhZGVyIHwgdW5kZWZpbmVkO1xuICBjaXBoZXJ0ZXh0OiBDaXBoZXJ0ZXh0IHwgdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1lc3NhZ2VfSGVhZGVyIHtcbiAgc2VuZGVyOiBQdWJsaWNLZXlCdW5kbGUgfCB1bmRlZmluZWQ7XG4gIHJlY2lwaWVudDogUHVibGljS2V5QnVuZGxlIHwgdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFByaXZhdGVLZXlCdW5kbGUge1xuICBpZGVudGl0eUtleTogUHJpdmF0ZUtleSB8IHVuZGVmaW5lZDtcbiAgcHJlS2V5czogUHJpdmF0ZUtleVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVuY3J5cHRlZFByaXZhdGVLZXlCdW5kbGUge1xuICB3YWxsZXRQcmVLZXk6IFVpbnQ4QXJyYXk7XG4gIGNpcGhlcnRleHQ6IENpcGhlcnRleHQgfCB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUJhc2VTaWduYXR1cmUoKTogU2lnbmF0dXJlIHtcbiAgcmV0dXJuIHsgZWNkc2FDb21wYWN0OiB1bmRlZmluZWQgfTtcbn1cblxuZXhwb3J0IGNvbnN0IFNpZ25hdHVyZSA9IHtcbiAgZW5jb2RlKFxuICAgIG1lc3NhZ2U6IFNpZ25hdHVyZSxcbiAgICB3cml0ZXI6IF9tMC5Xcml0ZXIgPSBfbTAuV3JpdGVyLmNyZWF0ZSgpXG4gICk6IF9tMC5Xcml0ZXIge1xuICAgIGlmIChtZXNzYWdlLmVjZHNhQ29tcGFjdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBTaWduYXR1cmVfRUNEU0FDb21wYWN0LmVuY29kZShcbiAgICAgICAgbWVzc2FnZS5lY2RzYUNvbXBhY3QsXG4gICAgICAgIHdyaXRlci51aW50MzIoMTApLmZvcmsoKVxuICAgICAgKS5sZGVsaW0oKTtcbiAgICB9XG4gICAgcmV0dXJuIHdyaXRlcjtcbiAgfSxcblxuICBkZWNvZGUoaW5wdXQ6IF9tMC5SZWFkZXIgfCBVaW50OEFycmF5LCBsZW5ndGg/OiBudW1iZXIpOiBTaWduYXR1cmUge1xuICAgIGNvbnN0IHJlYWRlciA9IGlucHV0IGluc3RhbmNlb2YgX20wLlJlYWRlciA/IGlucHV0IDogbmV3IF9tMC5SZWFkZXIoaW5wdXQpO1xuICAgIGxldCBlbmQgPSBsZW5ndGggPT09IHVuZGVmaW5lZCA/IHJlYWRlci5sZW4gOiByZWFkZXIucG9zICsgbGVuZ3RoO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBjcmVhdGVCYXNlU2lnbmF0dXJlKCk7XG4gICAgd2hpbGUgKHJlYWRlci5wb3MgPCBlbmQpIHtcbiAgICAgIGNvbnN0IHRhZyA9IHJlYWRlci51aW50MzIoKTtcbiAgICAgIHN3aXRjaCAodGFnID4+PiAzKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBtZXNzYWdlLmVjZHNhQ29tcGFjdCA9IFNpZ25hdHVyZV9FQ0RTQUNvbXBhY3QuZGVjb2RlKFxuICAgICAgICAgICAgcmVhZGVyLFxuICAgICAgICAgICAgcmVhZGVyLnVpbnQzMigpXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZWFkZXIuc2tpcFR5cGUodGFnICYgNyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlO1xuICB9LFxuXG4gIGZyb21KU09OKG9iamVjdDogYW55KTogU2lnbmF0dXJlIHtcbiAgICByZXR1cm4ge1xuICAgICAgZWNkc2FDb21wYWN0OiBpc1NldChvYmplY3QuZWNkc2FDb21wYWN0KVxuICAgICAgICA/IFNpZ25hdHVyZV9FQ0RTQUNvbXBhY3QuZnJvbUpTT04ob2JqZWN0LmVjZHNhQ29tcGFjdClcbiAgICAgICAgOiB1bmRlZmluZWRcbiAgICB9O1xuICB9LFxuXG4gIHRvSlNPTihtZXNzYWdlOiBTaWduYXR1cmUpOiB1bmtub3duIHtcbiAgICBjb25zdCBvYmo6IGFueSA9IHt9O1xuICAgIG1lc3NhZ2UuZWNkc2FDb21wYWN0ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIChvYmouZWNkc2FDb21wYWN0ID0gbWVzc2FnZS5lY2RzYUNvbXBhY3RcbiAgICAgICAgPyBTaWduYXR1cmVfRUNEU0FDb21wYWN0LnRvSlNPTihtZXNzYWdlLmVjZHNhQ29tcGFjdClcbiAgICAgICAgOiB1bmRlZmluZWQpO1xuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgZnJvbVBhcnRpYWw8SSBleHRlbmRzIEV4YWN0PERlZXBQYXJ0aWFsPFNpZ25hdHVyZT4sIEk+PihcbiAgICBvYmplY3Q6IElcbiAgKTogU2lnbmF0dXJlIHtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZVNpZ25hdHVyZSgpO1xuICAgIG1lc3NhZ2UuZWNkc2FDb21wYWN0ID1cbiAgICAgIG9iamVjdC5lY2RzYUNvbXBhY3QgIT09IHVuZGVmaW5lZCAmJiBvYmplY3QuZWNkc2FDb21wYWN0ICE9PSBudWxsXG4gICAgICAgID8gU2lnbmF0dXJlX0VDRFNBQ29tcGFjdC5mcm9tUGFydGlhbChvYmplY3QuZWNkc2FDb21wYWN0KVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfVxufTtcblxuZnVuY3Rpb24gY3JlYXRlQmFzZVNpZ25hdHVyZV9FQ0RTQUNvbXBhY3QoKTogU2lnbmF0dXJlX0VDRFNBQ29tcGFjdCB7XG4gIHJldHVybiB7IGJ5dGVzOiBuZXcgVWludDhBcnJheSgpLCByZWNvdmVyeTogMCB9O1xufVxuXG5leHBvcnQgY29uc3QgU2lnbmF0dXJlX0VDRFNBQ29tcGFjdCA9IHtcbiAgZW5jb2RlKFxuICAgIG1lc3NhZ2U6IFNpZ25hdHVyZV9FQ0RTQUNvbXBhY3QsXG4gICAgd3JpdGVyOiBfbTAuV3JpdGVyID0gX20wLldyaXRlci5jcmVhdGUoKVxuICApOiBfbTAuV3JpdGVyIHtcbiAgICBpZiAobWVzc2FnZS5ieXRlcy5sZW5ndGggIT09IDApIHtcbiAgICAgIHdyaXRlci51aW50MzIoMTApLmJ5dGVzKG1lc3NhZ2UuYnl0ZXMpO1xuICAgIH1cbiAgICBpZiAobWVzc2FnZS5yZWNvdmVyeSAhPT0gMCkge1xuICAgICAgd3JpdGVyLnVpbnQzMigxNikudWludDMyKG1lc3NhZ2UucmVjb3ZlcnkpO1xuICAgIH1cbiAgICByZXR1cm4gd3JpdGVyO1xuICB9LFxuXG4gIGRlY29kZShcbiAgICBpbnB1dDogX20wLlJlYWRlciB8IFVpbnQ4QXJyYXksXG4gICAgbGVuZ3RoPzogbnVtYmVyXG4gICk6IFNpZ25hdHVyZV9FQ0RTQUNvbXBhY3Qge1xuICAgIGNvbnN0IHJlYWRlciA9IGlucHV0IGluc3RhbmNlb2YgX20wLlJlYWRlciA/IGlucHV0IDogbmV3IF9tMC5SZWFkZXIoaW5wdXQpO1xuICAgIGxldCBlbmQgPSBsZW5ndGggPT09IHVuZGVmaW5lZCA/IHJlYWRlci5sZW4gOiByZWFkZXIucG9zICsgbGVuZ3RoO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBjcmVhdGVCYXNlU2lnbmF0dXJlX0VDRFNBQ29tcGFjdCgpO1xuICAgIHdoaWxlIChyZWFkZXIucG9zIDwgZW5kKSB7XG4gICAgICBjb25zdCB0YWcgPSByZWFkZXIudWludDMyKCk7XG4gICAgICBzd2l0Y2ggKHRhZyA+Pj4gMykge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgbWVzc2FnZS5ieXRlcyA9IHJlYWRlci5ieXRlcygpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgbWVzc2FnZS5yZWNvdmVyeSA9IHJlYWRlci51aW50MzIoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZWFkZXIuc2tpcFR5cGUodGFnICYgNyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlO1xuICB9LFxuXG4gIGZyb21KU09OKG9iamVjdDogYW55KTogU2lnbmF0dXJlX0VDRFNBQ29tcGFjdCB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJ5dGVzOiBpc1NldChvYmplY3QuYnl0ZXMpXG4gICAgICAgID8gYnl0ZXNGcm9tQmFzZTY0KG9iamVjdC5ieXRlcylcbiAgICAgICAgOiBuZXcgVWludDhBcnJheSgpLFxuICAgICAgcmVjb3Zlcnk6IGlzU2V0KG9iamVjdC5yZWNvdmVyeSkgPyBOdW1iZXIob2JqZWN0LnJlY292ZXJ5KSA6IDBcbiAgICB9O1xuICB9LFxuXG4gIHRvSlNPTihtZXNzYWdlOiBTaWduYXR1cmVfRUNEU0FDb21wYWN0KTogdW5rbm93biB7XG4gICAgY29uc3Qgb2JqOiBhbnkgPSB7fTtcbiAgICBtZXNzYWdlLmJ5dGVzICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIChvYmouYnl0ZXMgPSBiYXNlNjRGcm9tQnl0ZXMoXG4gICAgICAgIG1lc3NhZ2UuYnl0ZXMgIT09IHVuZGVmaW5lZCA/IG1lc3NhZ2UuYnl0ZXMgOiBuZXcgVWludDhBcnJheSgpXG4gICAgICApKTtcbiAgICBtZXNzYWdlLnJlY292ZXJ5ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIChvYmoucmVjb3ZlcnkgPSBNYXRoLnJvdW5kKG1lc3NhZ2UucmVjb3ZlcnkpKTtcbiAgICByZXR1cm4gb2JqO1xuICB9LFxuXG4gIGZyb21QYXJ0aWFsPEkgZXh0ZW5kcyBFeGFjdDxEZWVwUGFydGlhbDxTaWduYXR1cmVfRUNEU0FDb21wYWN0PiwgST4+KFxuICAgIG9iamVjdDogSVxuICApOiBTaWduYXR1cmVfRUNEU0FDb21wYWN0IHtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZVNpZ25hdHVyZV9FQ0RTQUNvbXBhY3QoKTtcbiAgICBtZXNzYWdlLmJ5dGVzID0gb2JqZWN0LmJ5dGVzID8/IG5ldyBVaW50OEFycmF5KCk7XG4gICAgbWVzc2FnZS5yZWNvdmVyeSA9IG9iamVjdC5yZWNvdmVyeSA/PyAwO1xuICAgIHJldHVybiBtZXNzYWdlO1xuICB9XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVCYXNlUHVibGljS2V5KCk6IFB1YmxpY0tleSB7XG4gIHJldHVybiB7IHNlY3AyNTZrMVVuY29tcHJlc3NlZDogdW5kZWZpbmVkLCBzaWduYXR1cmU6IHVuZGVmaW5lZCB9O1xufVxuXG5leHBvcnQgY29uc3QgUHVibGljS2V5ID0ge1xuICBlbmNvZGUoXG4gICAgbWVzc2FnZTogUHVibGljS2V5LFxuICAgIHdyaXRlcjogX20wLldyaXRlciA9IF9tMC5Xcml0ZXIuY3JlYXRlKClcbiAgKTogX20wLldyaXRlciB7XG4gICAgaWYgKG1lc3NhZ2Uuc2VjcDI1NmsxVW5jb21wcmVzc2VkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIFB1YmxpY0tleV9TZWNwMjU2azFVbmNvbXByZXNlZC5lbmNvZGUoXG4gICAgICAgIG1lc3NhZ2Uuc2VjcDI1NmsxVW5jb21wcmVzc2VkLFxuICAgICAgICB3cml0ZXIudWludDMyKDEwKS5mb3JrKClcbiAgICAgICkubGRlbGltKCk7XG4gICAgfVxuICAgIGlmIChtZXNzYWdlLnNpZ25hdHVyZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBTaWduYXR1cmUuZW5jb2RlKG1lc3NhZ2Uuc2lnbmF0dXJlLCB3cml0ZXIudWludDMyKDE4KS5mb3JrKCkpLmxkZWxpbSgpO1xuICAgIH1cbiAgICByZXR1cm4gd3JpdGVyO1xuICB9LFxuXG4gIGRlY29kZShpbnB1dDogX20wLlJlYWRlciB8IFVpbnQ4QXJyYXksIGxlbmd0aD86IG51bWJlcik6IFB1YmxpY0tleSB7XG4gICAgY29uc3QgcmVhZGVyID0gaW5wdXQgaW5zdGFuY2VvZiBfbTAuUmVhZGVyID8gaW5wdXQgOiBuZXcgX20wLlJlYWRlcihpbnB1dCk7XG4gICAgbGV0IGVuZCA9IGxlbmd0aCA9PT0gdW5kZWZpbmVkID8gcmVhZGVyLmxlbiA6IHJlYWRlci5wb3MgKyBsZW5ndGg7XG4gICAgY29uc3QgbWVzc2FnZSA9IGNyZWF0ZUJhc2VQdWJsaWNLZXkoKTtcbiAgICB3aGlsZSAocmVhZGVyLnBvcyA8IGVuZCkge1xuICAgICAgY29uc3QgdGFnID0gcmVhZGVyLnVpbnQzMigpO1xuICAgICAgc3dpdGNoICh0YWcgPj4+IDMpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIG1lc3NhZ2Uuc2VjcDI1NmsxVW5jb21wcmVzc2VkID0gUHVibGljS2V5X1NlY3AyNTZrMVVuY29tcHJlc2VkLmRlY29kZShcbiAgICAgICAgICAgIHJlYWRlcixcbiAgICAgICAgICAgIHJlYWRlci51aW50MzIoKVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBtZXNzYWdlLnNpZ25hdHVyZSA9IFNpZ25hdHVyZS5kZWNvZGUocmVhZGVyLCByZWFkZXIudWludDMyKCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJlYWRlci5za2lwVHlwZSh0YWcgJiA3KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH0sXG5cbiAgZnJvbUpTT04ob2JqZWN0OiBhbnkpOiBQdWJsaWNLZXkge1xuICAgIHJldHVybiB7XG4gICAgICBzZWNwMjU2azFVbmNvbXByZXNzZWQ6IGlzU2V0KG9iamVjdC5zZWNwMjU2azFVbmNvbXByZXNzZWQpXG4gICAgICAgID8gUHVibGljS2V5X1NlY3AyNTZrMVVuY29tcHJlc2VkLmZyb21KU09OKG9iamVjdC5zZWNwMjU2azFVbmNvbXByZXNzZWQpXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgc2lnbmF0dXJlOiBpc1NldChvYmplY3Quc2lnbmF0dXJlKVxuICAgICAgICA/IFNpZ25hdHVyZS5mcm9tSlNPTihvYmplY3Quc2lnbmF0dXJlKVxuICAgICAgICA6IHVuZGVmaW5lZFxuICAgIH07XG4gIH0sXG5cbiAgdG9KU09OKG1lc3NhZ2U6IFB1YmxpY0tleSk6IHVua25vd24ge1xuICAgIGNvbnN0IG9iajogYW55ID0ge307XG4gICAgbWVzc2FnZS5zZWNwMjU2azFVbmNvbXByZXNzZWQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgKG9iai5zZWNwMjU2azFVbmNvbXByZXNzZWQgPSBtZXNzYWdlLnNlY3AyNTZrMVVuY29tcHJlc3NlZFxuICAgICAgICA/IFB1YmxpY0tleV9TZWNwMjU2azFVbmNvbXByZXNlZC50b0pTT04obWVzc2FnZS5zZWNwMjU2azFVbmNvbXByZXNzZWQpXG4gICAgICAgIDogdW5kZWZpbmVkKTtcbiAgICBtZXNzYWdlLnNpZ25hdHVyZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAob2JqLnNpZ25hdHVyZSA9IG1lc3NhZ2Uuc2lnbmF0dXJlXG4gICAgICAgID8gU2lnbmF0dXJlLnRvSlNPTihtZXNzYWdlLnNpZ25hdHVyZSlcbiAgICAgICAgOiB1bmRlZmluZWQpO1xuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgZnJvbVBhcnRpYWw8SSBleHRlbmRzIEV4YWN0PERlZXBQYXJ0aWFsPFB1YmxpY0tleT4sIEk+PihcbiAgICBvYmplY3Q6IElcbiAgKTogUHVibGljS2V5IHtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZVB1YmxpY0tleSgpO1xuICAgIG1lc3NhZ2Uuc2VjcDI1NmsxVW5jb21wcmVzc2VkID1cbiAgICAgIG9iamVjdC5zZWNwMjU2azFVbmNvbXByZXNzZWQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgb2JqZWN0LnNlY3AyNTZrMVVuY29tcHJlc3NlZCAhPT0gbnVsbFxuICAgICAgICA/IFB1YmxpY0tleV9TZWNwMjU2azFVbmNvbXByZXNlZC5mcm9tUGFydGlhbChcbiAgICAgICAgICAgIG9iamVjdC5zZWNwMjU2azFVbmNvbXByZXNzZWRcbiAgICAgICAgICApXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIG1lc3NhZ2Uuc2lnbmF0dXJlID1cbiAgICAgIG9iamVjdC5zaWduYXR1cmUgIT09IHVuZGVmaW5lZCAmJiBvYmplY3Quc2lnbmF0dXJlICE9PSBudWxsXG4gICAgICAgID8gU2lnbmF0dXJlLmZyb21QYXJ0aWFsKG9iamVjdC5zaWduYXR1cmUpXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIHJldHVybiBtZXNzYWdlO1xuICB9XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVCYXNlUHVibGljS2V5X1NlY3AyNTZrMVVuY29tcHJlc2VkKCk6IFB1YmxpY0tleV9TZWNwMjU2azFVbmNvbXByZXNlZCB7XG4gIHJldHVybiB7IGJ5dGVzOiBuZXcgVWludDhBcnJheSgpIH07XG59XG5cbmV4cG9ydCBjb25zdCBQdWJsaWNLZXlfU2VjcDI1NmsxVW5jb21wcmVzZWQgPSB7XG4gIGVuY29kZShcbiAgICBtZXNzYWdlOiBQdWJsaWNLZXlfU2VjcDI1NmsxVW5jb21wcmVzZWQsXG4gICAgd3JpdGVyOiBfbTAuV3JpdGVyID0gX20wLldyaXRlci5jcmVhdGUoKVxuICApOiBfbTAuV3JpdGVyIHtcbiAgICBpZiAobWVzc2FnZS5ieXRlcy5sZW5ndGggIT09IDApIHtcbiAgICAgIHdyaXRlci51aW50MzIoMTApLmJ5dGVzKG1lc3NhZ2UuYnl0ZXMpO1xuICAgIH1cbiAgICByZXR1cm4gd3JpdGVyO1xuICB9LFxuXG4gIGRlY29kZShcbiAgICBpbnB1dDogX20wLlJlYWRlciB8IFVpbnQ4QXJyYXksXG4gICAgbGVuZ3RoPzogbnVtYmVyXG4gICk6IFB1YmxpY0tleV9TZWNwMjU2azFVbmNvbXByZXNlZCB7XG4gICAgY29uc3QgcmVhZGVyID0gaW5wdXQgaW5zdGFuY2VvZiBfbTAuUmVhZGVyID8gaW5wdXQgOiBuZXcgX20wLlJlYWRlcihpbnB1dCk7XG4gICAgbGV0IGVuZCA9IGxlbmd0aCA9PT0gdW5kZWZpbmVkID8gcmVhZGVyLmxlbiA6IHJlYWRlci5wb3MgKyBsZW5ndGg7XG4gICAgY29uc3QgbWVzc2FnZSA9IGNyZWF0ZUJhc2VQdWJsaWNLZXlfU2VjcDI1NmsxVW5jb21wcmVzZWQoKTtcbiAgICB3aGlsZSAocmVhZGVyLnBvcyA8IGVuZCkge1xuICAgICAgY29uc3QgdGFnID0gcmVhZGVyLnVpbnQzMigpO1xuICAgICAgc3dpdGNoICh0YWcgPj4+IDMpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIG1lc3NhZ2UuYnl0ZXMgPSByZWFkZXIuYnl0ZXMoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZWFkZXIuc2tpcFR5cGUodGFnICYgNyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlO1xuICB9LFxuXG4gIGZyb21KU09OKG9iamVjdDogYW55KTogUHVibGljS2V5X1NlY3AyNTZrMVVuY29tcHJlc2VkIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnl0ZXM6IGlzU2V0KG9iamVjdC5ieXRlcylcbiAgICAgICAgPyBieXRlc0Zyb21CYXNlNjQob2JqZWN0LmJ5dGVzKVxuICAgICAgICA6IG5ldyBVaW50OEFycmF5KClcbiAgICB9O1xuICB9LFxuXG4gIHRvSlNPTihtZXNzYWdlOiBQdWJsaWNLZXlfU2VjcDI1NmsxVW5jb21wcmVzZWQpOiB1bmtub3duIHtcbiAgICBjb25zdCBvYmo6IGFueSA9IHt9O1xuICAgIG1lc3NhZ2UuYnl0ZXMgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgKG9iai5ieXRlcyA9IGJhc2U2NEZyb21CeXRlcyhcbiAgICAgICAgbWVzc2FnZS5ieXRlcyAhPT0gdW5kZWZpbmVkID8gbWVzc2FnZS5ieXRlcyA6IG5ldyBVaW50OEFycmF5KClcbiAgICAgICkpO1xuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgZnJvbVBhcnRpYWw8SSBleHRlbmRzIEV4YWN0PERlZXBQYXJ0aWFsPFB1YmxpY0tleV9TZWNwMjU2azFVbmNvbXByZXNlZD4sIEk+PihcbiAgICBvYmplY3Q6IElcbiAgKTogUHVibGljS2V5X1NlY3AyNTZrMVVuY29tcHJlc2VkIHtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZVB1YmxpY0tleV9TZWNwMjU2azFVbmNvbXByZXNlZCgpO1xuICAgIG1lc3NhZ2UuYnl0ZXMgPSBvYmplY3QuYnl0ZXMgPz8gbmV3IFVpbnQ4QXJyYXkoKTtcbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfVxufTtcblxuZnVuY3Rpb24gY3JlYXRlQmFzZVByaXZhdGVLZXkoKTogUHJpdmF0ZUtleSB7XG4gIHJldHVybiB7IHNlY3AyNTZrMTogdW5kZWZpbmVkIH07XG59XG5cbmV4cG9ydCBjb25zdCBQcml2YXRlS2V5ID0ge1xuICBlbmNvZGUoXG4gICAgbWVzc2FnZTogUHJpdmF0ZUtleSxcbiAgICB3cml0ZXI6IF9tMC5Xcml0ZXIgPSBfbTAuV3JpdGVyLmNyZWF0ZSgpXG4gICk6IF9tMC5Xcml0ZXIge1xuICAgIGlmIChtZXNzYWdlLnNlY3AyNTZrMSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBQcml2YXRlS2V5X1NlY3AyNTZrMS5lbmNvZGUoXG4gICAgICAgIG1lc3NhZ2Uuc2VjcDI1NmsxLFxuICAgICAgICB3cml0ZXIudWludDMyKDEwKS5mb3JrKClcbiAgICAgICkubGRlbGltKCk7XG4gICAgfVxuICAgIHJldHVybiB3cml0ZXI7XG4gIH0sXG5cbiAgZGVjb2RlKGlucHV0OiBfbTAuUmVhZGVyIHwgVWludDhBcnJheSwgbGVuZ3RoPzogbnVtYmVyKTogUHJpdmF0ZUtleSB7XG4gICAgY29uc3QgcmVhZGVyID0gaW5wdXQgaW5zdGFuY2VvZiBfbTAuUmVhZGVyID8gaW5wdXQgOiBuZXcgX20wLlJlYWRlcihpbnB1dCk7XG4gICAgbGV0IGVuZCA9IGxlbmd0aCA9PT0gdW5kZWZpbmVkID8gcmVhZGVyLmxlbiA6IHJlYWRlci5wb3MgKyBsZW5ndGg7XG4gICAgY29uc3QgbWVzc2FnZSA9IGNyZWF0ZUJhc2VQcml2YXRlS2V5KCk7XG4gICAgd2hpbGUgKHJlYWRlci5wb3MgPCBlbmQpIHtcbiAgICAgIGNvbnN0IHRhZyA9IHJlYWRlci51aW50MzIoKTtcbiAgICAgIHN3aXRjaCAodGFnID4+PiAzKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBtZXNzYWdlLnNlY3AyNTZrMSA9IFByaXZhdGVLZXlfU2VjcDI1NmsxLmRlY29kZShcbiAgICAgICAgICAgIHJlYWRlcixcbiAgICAgICAgICAgIHJlYWRlci51aW50MzIoKVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmVhZGVyLnNraXBUeXBlKHRhZyAmIDcpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfSxcblxuICBmcm9tSlNPTihvYmplY3Q6IGFueSk6IFByaXZhdGVLZXkge1xuICAgIHJldHVybiB7XG4gICAgICBzZWNwMjU2azE6IGlzU2V0KG9iamVjdC5zZWNwMjU2azEpXG4gICAgICAgID8gUHJpdmF0ZUtleV9TZWNwMjU2azEuZnJvbUpTT04ob2JqZWN0LnNlY3AyNTZrMSlcbiAgICAgICAgOiB1bmRlZmluZWRcbiAgICB9O1xuICB9LFxuXG4gIHRvSlNPTihtZXNzYWdlOiBQcml2YXRlS2V5KTogdW5rbm93biB7XG4gICAgY29uc3Qgb2JqOiBhbnkgPSB7fTtcbiAgICBtZXNzYWdlLnNlY3AyNTZrMSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAob2JqLnNlY3AyNTZrMSA9IG1lc3NhZ2Uuc2VjcDI1NmsxXG4gICAgICAgID8gUHJpdmF0ZUtleV9TZWNwMjU2azEudG9KU09OKG1lc3NhZ2Uuc2VjcDI1NmsxKVxuICAgICAgICA6IHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIG9iajtcbiAgfSxcblxuICBmcm9tUGFydGlhbDxJIGV4dGVuZHMgRXhhY3Q8RGVlcFBhcnRpYWw8UHJpdmF0ZUtleT4sIEk+PihcbiAgICBvYmplY3Q6IElcbiAgKTogUHJpdmF0ZUtleSB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGNyZWF0ZUJhc2VQcml2YXRlS2V5KCk7XG4gICAgbWVzc2FnZS5zZWNwMjU2azEgPVxuICAgICAgb2JqZWN0LnNlY3AyNTZrMSAhPT0gdW5kZWZpbmVkICYmIG9iamVjdC5zZWNwMjU2azEgIT09IG51bGxcbiAgICAgICAgPyBQcml2YXRlS2V5X1NlY3AyNTZrMS5mcm9tUGFydGlhbChvYmplY3Quc2VjcDI1NmsxKVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfVxufTtcblxuZnVuY3Rpb24gY3JlYXRlQmFzZVByaXZhdGVLZXlfU2VjcDI1NmsxKCk6IFByaXZhdGVLZXlfU2VjcDI1NmsxIHtcbiAgcmV0dXJuIHsgYnl0ZXM6IG5ldyBVaW50OEFycmF5KCkgfTtcbn1cblxuZXhwb3J0IGNvbnN0IFByaXZhdGVLZXlfU2VjcDI1NmsxID0ge1xuICBlbmNvZGUoXG4gICAgbWVzc2FnZTogUHJpdmF0ZUtleV9TZWNwMjU2azEsXG4gICAgd3JpdGVyOiBfbTAuV3JpdGVyID0gX20wLldyaXRlci5jcmVhdGUoKVxuICApOiBfbTAuV3JpdGVyIHtcbiAgICBpZiAobWVzc2FnZS5ieXRlcy5sZW5ndGggIT09IDApIHtcbiAgICAgIHdyaXRlci51aW50MzIoMTApLmJ5dGVzKG1lc3NhZ2UuYnl0ZXMpO1xuICAgIH1cbiAgICByZXR1cm4gd3JpdGVyO1xuICB9LFxuXG4gIGRlY29kZShcbiAgICBpbnB1dDogX20wLlJlYWRlciB8IFVpbnQ4QXJyYXksXG4gICAgbGVuZ3RoPzogbnVtYmVyXG4gICk6IFByaXZhdGVLZXlfU2VjcDI1NmsxIHtcbiAgICBjb25zdCByZWFkZXIgPSBpbnB1dCBpbnN0YW5jZW9mIF9tMC5SZWFkZXIgPyBpbnB1dCA6IG5ldyBfbTAuUmVhZGVyKGlucHV0KTtcbiAgICBsZXQgZW5kID0gbGVuZ3RoID09PSB1bmRlZmluZWQgPyByZWFkZXIubGVuIDogcmVhZGVyLnBvcyArIGxlbmd0aDtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZVByaXZhdGVLZXlfU2VjcDI1NmsxKCk7XG4gICAgd2hpbGUgKHJlYWRlci5wb3MgPCBlbmQpIHtcbiAgICAgIGNvbnN0IHRhZyA9IHJlYWRlci51aW50MzIoKTtcbiAgICAgIHN3aXRjaCAodGFnID4+PiAzKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBtZXNzYWdlLmJ5dGVzID0gcmVhZGVyLmJ5dGVzKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmVhZGVyLnNraXBUeXBlKHRhZyAmIDcpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfSxcblxuICBmcm9tSlNPTihvYmplY3Q6IGFueSk6IFByaXZhdGVLZXlfU2VjcDI1NmsxIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnl0ZXM6IGlzU2V0KG9iamVjdC5ieXRlcylcbiAgICAgICAgPyBieXRlc0Zyb21CYXNlNjQob2JqZWN0LmJ5dGVzKVxuICAgICAgICA6IG5ldyBVaW50OEFycmF5KClcbiAgICB9O1xuICB9LFxuXG4gIHRvSlNPTihtZXNzYWdlOiBQcml2YXRlS2V5X1NlY3AyNTZrMSk6IHVua25vd24ge1xuICAgIGNvbnN0IG9iajogYW55ID0ge307XG4gICAgbWVzc2FnZS5ieXRlcyAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAob2JqLmJ5dGVzID0gYmFzZTY0RnJvbUJ5dGVzKFxuICAgICAgICBtZXNzYWdlLmJ5dGVzICE9PSB1bmRlZmluZWQgPyBtZXNzYWdlLmJ5dGVzIDogbmV3IFVpbnQ4QXJyYXkoKVxuICAgICAgKSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfSxcblxuICBmcm9tUGFydGlhbDxJIGV4dGVuZHMgRXhhY3Q8RGVlcFBhcnRpYWw8UHJpdmF0ZUtleV9TZWNwMjU2azE+LCBJPj4oXG4gICAgb2JqZWN0OiBJXG4gICk6IFByaXZhdGVLZXlfU2VjcDI1NmsxIHtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZVByaXZhdGVLZXlfU2VjcDI1NmsxKCk7XG4gICAgbWVzc2FnZS5ieXRlcyA9IG9iamVjdC5ieXRlcyA/PyBuZXcgVWludDhBcnJheSgpO1xuICAgIHJldHVybiBtZXNzYWdlO1xuICB9XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVCYXNlQ2lwaGVydGV4dCgpOiBDaXBoZXJ0ZXh0IHtcbiAgcmV0dXJuIHsgYWVzMjU2R2NtSGtkZlNoYTI1NjogdW5kZWZpbmVkIH07XG59XG5cbmV4cG9ydCBjb25zdCBDaXBoZXJ0ZXh0ID0ge1xuICBlbmNvZGUoXG4gICAgbWVzc2FnZTogQ2lwaGVydGV4dCxcbiAgICB3cml0ZXI6IF9tMC5Xcml0ZXIgPSBfbTAuV3JpdGVyLmNyZWF0ZSgpXG4gICk6IF9tMC5Xcml0ZXIge1xuICAgIGlmIChtZXNzYWdlLmFlczI1NkdjbUhrZGZTaGEyNTYgIT09IHVuZGVmaW5lZCkge1xuICAgICAgQ2lwaGVydGV4dF9BZXMyNTZnY21Ia2Rmc2hhMjU2LmVuY29kZShcbiAgICAgICAgbWVzc2FnZS5hZXMyNTZHY21Ia2RmU2hhMjU2LFxuICAgICAgICB3cml0ZXIudWludDMyKDEwKS5mb3JrKClcbiAgICAgICkubGRlbGltKCk7XG4gICAgfVxuICAgIHJldHVybiB3cml0ZXI7XG4gIH0sXG5cbiAgZGVjb2RlKGlucHV0OiBfbTAuUmVhZGVyIHwgVWludDhBcnJheSwgbGVuZ3RoPzogbnVtYmVyKTogQ2lwaGVydGV4dCB7XG4gICAgY29uc3QgcmVhZGVyID0gaW5wdXQgaW5zdGFuY2VvZiBfbTAuUmVhZGVyID8gaW5wdXQgOiBuZXcgX20wLlJlYWRlcihpbnB1dCk7XG4gICAgbGV0IGVuZCA9IGxlbmd0aCA9PT0gdW5kZWZpbmVkID8gcmVhZGVyLmxlbiA6IHJlYWRlci5wb3MgKyBsZW5ndGg7XG4gICAgY29uc3QgbWVzc2FnZSA9IGNyZWF0ZUJhc2VDaXBoZXJ0ZXh0KCk7XG4gICAgd2hpbGUgKHJlYWRlci5wb3MgPCBlbmQpIHtcbiAgICAgIGNvbnN0IHRhZyA9IHJlYWRlci51aW50MzIoKTtcbiAgICAgIHN3aXRjaCAodGFnID4+PiAzKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBtZXNzYWdlLmFlczI1NkdjbUhrZGZTaGEyNTYgPSBDaXBoZXJ0ZXh0X0FlczI1NmdjbUhrZGZzaGEyNTYuZGVjb2RlKFxuICAgICAgICAgICAgcmVhZGVyLFxuICAgICAgICAgICAgcmVhZGVyLnVpbnQzMigpXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZWFkZXIuc2tpcFR5cGUodGFnICYgNyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlO1xuICB9LFxuXG4gIGZyb21KU09OKG9iamVjdDogYW55KTogQ2lwaGVydGV4dCB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFlczI1NkdjbUhrZGZTaGEyNTY6IGlzU2V0KG9iamVjdC5hZXMyNTZHY21Ia2RmU2hhMjU2KVxuICAgICAgICA/IENpcGhlcnRleHRfQWVzMjU2Z2NtSGtkZnNoYTI1Ni5mcm9tSlNPTihvYmplY3QuYWVzMjU2R2NtSGtkZlNoYTI1NilcbiAgICAgICAgOiB1bmRlZmluZWRcbiAgICB9O1xuICB9LFxuXG4gIHRvSlNPTihtZXNzYWdlOiBDaXBoZXJ0ZXh0KTogdW5rbm93biB7XG4gICAgY29uc3Qgb2JqOiBhbnkgPSB7fTtcbiAgICBtZXNzYWdlLmFlczI1NkdjbUhrZGZTaGEyNTYgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgKG9iai5hZXMyNTZHY21Ia2RmU2hhMjU2ID0gbWVzc2FnZS5hZXMyNTZHY21Ia2RmU2hhMjU2XG4gICAgICAgID8gQ2lwaGVydGV4dF9BZXMyNTZnY21Ia2Rmc2hhMjU2LnRvSlNPTihtZXNzYWdlLmFlczI1NkdjbUhrZGZTaGEyNTYpXG4gICAgICAgIDogdW5kZWZpbmVkKTtcbiAgICByZXR1cm4gb2JqO1xuICB9LFxuXG4gIGZyb21QYXJ0aWFsPEkgZXh0ZW5kcyBFeGFjdDxEZWVwUGFydGlhbDxDaXBoZXJ0ZXh0PiwgST4+KFxuICAgIG9iamVjdDogSVxuICApOiBDaXBoZXJ0ZXh0IHtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZUNpcGhlcnRleHQoKTtcbiAgICBtZXNzYWdlLmFlczI1NkdjbUhrZGZTaGEyNTYgPVxuICAgICAgb2JqZWN0LmFlczI1NkdjbUhrZGZTaGEyNTYgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgb2JqZWN0LmFlczI1NkdjbUhrZGZTaGEyNTYgIT09IG51bGxcbiAgICAgICAgPyBDaXBoZXJ0ZXh0X0FlczI1NmdjbUhrZGZzaGEyNTYuZnJvbVBhcnRpYWwob2JqZWN0LmFlczI1NkdjbUhrZGZTaGEyNTYpXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIHJldHVybiBtZXNzYWdlO1xuICB9XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVCYXNlQ2lwaGVydGV4dF9BZXMyNTZnY21Ia2Rmc2hhMjU2KCk6IENpcGhlcnRleHRfQWVzMjU2Z2NtSGtkZnNoYTI1NiB7XG4gIHJldHVybiB7XG4gICAgaGtkZlNhbHQ6IG5ldyBVaW50OEFycmF5KCksXG4gICAgZ2NtTm9uY2U6IG5ldyBVaW50OEFycmF5KCksXG4gICAgcGF5bG9hZDogbmV3IFVpbnQ4QXJyYXkoKVxuICB9O1xufVxuXG5leHBvcnQgY29uc3QgQ2lwaGVydGV4dF9BZXMyNTZnY21Ia2Rmc2hhMjU2ID0ge1xuICBlbmNvZGUoXG4gICAgbWVzc2FnZTogQ2lwaGVydGV4dF9BZXMyNTZnY21Ia2Rmc2hhMjU2LFxuICAgIHdyaXRlcjogX20wLldyaXRlciA9IF9tMC5Xcml0ZXIuY3JlYXRlKClcbiAgKTogX20wLldyaXRlciB7XG4gICAgaWYgKG1lc3NhZ2UuaGtkZlNhbHQubGVuZ3RoICE9PSAwKSB7XG4gICAgICB3cml0ZXIudWludDMyKDEwKS5ieXRlcyhtZXNzYWdlLmhrZGZTYWx0KTtcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2UuZ2NtTm9uY2UubGVuZ3RoICE9PSAwKSB7XG4gICAgICB3cml0ZXIudWludDMyKDE4KS5ieXRlcyhtZXNzYWdlLmdjbU5vbmNlKTtcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2UucGF5bG9hZC5sZW5ndGggIT09IDApIHtcbiAgICAgIHdyaXRlci51aW50MzIoMjYpLmJ5dGVzKG1lc3NhZ2UucGF5bG9hZCk7XG4gICAgfVxuICAgIHJldHVybiB3cml0ZXI7XG4gIH0sXG5cbiAgZGVjb2RlKFxuICAgIGlucHV0OiBfbTAuUmVhZGVyIHwgVWludDhBcnJheSxcbiAgICBsZW5ndGg/OiBudW1iZXJcbiAgKTogQ2lwaGVydGV4dF9BZXMyNTZnY21Ia2Rmc2hhMjU2IHtcbiAgICBjb25zdCByZWFkZXIgPSBpbnB1dCBpbnN0YW5jZW9mIF9tMC5SZWFkZXIgPyBpbnB1dCA6IG5ldyBfbTAuUmVhZGVyKGlucHV0KTtcbiAgICBsZXQgZW5kID0gbGVuZ3RoID09PSB1bmRlZmluZWQgPyByZWFkZXIubGVuIDogcmVhZGVyLnBvcyArIGxlbmd0aDtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZUNpcGhlcnRleHRfQWVzMjU2Z2NtSGtkZnNoYTI1NigpO1xuICAgIHdoaWxlIChyZWFkZXIucG9zIDwgZW5kKSB7XG4gICAgICBjb25zdCB0YWcgPSByZWFkZXIudWludDMyKCk7XG4gICAgICBzd2l0Y2ggKHRhZyA+Pj4gMykge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgbWVzc2FnZS5oa2RmU2FsdCA9IHJlYWRlci5ieXRlcygpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgbWVzc2FnZS5nY21Ob25jZSA9IHJlYWRlci5ieXRlcygpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgbWVzc2FnZS5wYXlsb2FkID0gcmVhZGVyLmJ5dGVzKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmVhZGVyLnNraXBUeXBlKHRhZyAmIDcpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfSxcblxuICBmcm9tSlNPTihvYmplY3Q6IGFueSk6IENpcGhlcnRleHRfQWVzMjU2Z2NtSGtkZnNoYTI1NiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhrZGZTYWx0OiBpc1NldChvYmplY3QuaGtkZlNhbHQpXG4gICAgICAgID8gYnl0ZXNGcm9tQmFzZTY0KG9iamVjdC5oa2RmU2FsdClcbiAgICAgICAgOiBuZXcgVWludDhBcnJheSgpLFxuICAgICAgZ2NtTm9uY2U6IGlzU2V0KG9iamVjdC5nY21Ob25jZSlcbiAgICAgICAgPyBieXRlc0Zyb21CYXNlNjQob2JqZWN0LmdjbU5vbmNlKVxuICAgICAgICA6IG5ldyBVaW50OEFycmF5KCksXG4gICAgICBwYXlsb2FkOiBpc1NldChvYmplY3QucGF5bG9hZClcbiAgICAgICAgPyBieXRlc0Zyb21CYXNlNjQob2JqZWN0LnBheWxvYWQpXG4gICAgICAgIDogbmV3IFVpbnQ4QXJyYXkoKVxuICAgIH07XG4gIH0sXG5cbiAgdG9KU09OKG1lc3NhZ2U6IENpcGhlcnRleHRfQWVzMjU2Z2NtSGtkZnNoYTI1Nik6IHVua25vd24ge1xuICAgIGNvbnN0IG9iajogYW55ID0ge307XG4gICAgbWVzc2FnZS5oa2RmU2FsdCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAob2JqLmhrZGZTYWx0ID0gYmFzZTY0RnJvbUJ5dGVzKFxuICAgICAgICBtZXNzYWdlLmhrZGZTYWx0ICE9PSB1bmRlZmluZWQgPyBtZXNzYWdlLmhrZGZTYWx0IDogbmV3IFVpbnQ4QXJyYXkoKVxuICAgICAgKSk7XG4gICAgbWVzc2FnZS5nY21Ob25jZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAob2JqLmdjbU5vbmNlID0gYmFzZTY0RnJvbUJ5dGVzKFxuICAgICAgICBtZXNzYWdlLmdjbU5vbmNlICE9PSB1bmRlZmluZWQgPyBtZXNzYWdlLmdjbU5vbmNlIDogbmV3IFVpbnQ4QXJyYXkoKVxuICAgICAgKSk7XG4gICAgbWVzc2FnZS5wYXlsb2FkICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIChvYmoucGF5bG9hZCA9IGJhc2U2NEZyb21CeXRlcyhcbiAgICAgICAgbWVzc2FnZS5wYXlsb2FkICE9PSB1bmRlZmluZWQgPyBtZXNzYWdlLnBheWxvYWQgOiBuZXcgVWludDhBcnJheSgpXG4gICAgICApKTtcbiAgICByZXR1cm4gb2JqO1xuICB9LFxuXG4gIGZyb21QYXJ0aWFsPEkgZXh0ZW5kcyBFeGFjdDxEZWVwUGFydGlhbDxDaXBoZXJ0ZXh0X0FlczI1NmdjbUhrZGZzaGEyNTY+LCBJPj4oXG4gICAgb2JqZWN0OiBJXG4gICk6IENpcGhlcnRleHRfQWVzMjU2Z2NtSGtkZnNoYTI1NiB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGNyZWF0ZUJhc2VDaXBoZXJ0ZXh0X0FlczI1NmdjbUhrZGZzaGEyNTYoKTtcbiAgICBtZXNzYWdlLmhrZGZTYWx0ID0gb2JqZWN0LmhrZGZTYWx0ID8/IG5ldyBVaW50OEFycmF5KCk7XG4gICAgbWVzc2FnZS5nY21Ob25jZSA9IG9iamVjdC5nY21Ob25jZSA/PyBuZXcgVWludDhBcnJheSgpO1xuICAgIG1lc3NhZ2UucGF5bG9hZCA9IG9iamVjdC5wYXlsb2FkID8/IG5ldyBVaW50OEFycmF5KCk7XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUJhc2VQdWJsaWNLZXlCdW5kbGUoKTogUHVibGljS2V5QnVuZGxlIHtcbiAgcmV0dXJuIHsgaWRlbnRpdHlLZXk6IHVuZGVmaW5lZCwgcHJlS2V5OiB1bmRlZmluZWQgfTtcbn1cblxuZXhwb3J0IGNvbnN0IFB1YmxpY0tleUJ1bmRsZSA9IHtcbiAgZW5jb2RlKFxuICAgIG1lc3NhZ2U6IFB1YmxpY0tleUJ1bmRsZSxcbiAgICB3cml0ZXI6IF9tMC5Xcml0ZXIgPSBfbTAuV3JpdGVyLmNyZWF0ZSgpXG4gICk6IF9tMC5Xcml0ZXIge1xuICAgIGlmIChtZXNzYWdlLmlkZW50aXR5S2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIFB1YmxpY0tleS5lbmNvZGUobWVzc2FnZS5pZGVudGl0eUtleSwgd3JpdGVyLnVpbnQzMigxMCkuZm9yaygpKS5sZGVsaW0oKTtcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2UucHJlS2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIFB1YmxpY0tleS5lbmNvZGUobWVzc2FnZS5wcmVLZXksIHdyaXRlci51aW50MzIoMTgpLmZvcmsoKSkubGRlbGltKCk7XG4gICAgfVxuICAgIHJldHVybiB3cml0ZXI7XG4gIH0sXG5cbiAgZGVjb2RlKGlucHV0OiBfbTAuUmVhZGVyIHwgVWludDhBcnJheSwgbGVuZ3RoPzogbnVtYmVyKTogUHVibGljS2V5QnVuZGxlIHtcbiAgICBjb25zdCByZWFkZXIgPSBpbnB1dCBpbnN0YW5jZW9mIF9tMC5SZWFkZXIgPyBpbnB1dCA6IG5ldyBfbTAuUmVhZGVyKGlucHV0KTtcbiAgICBsZXQgZW5kID0gbGVuZ3RoID09PSB1bmRlZmluZWQgPyByZWFkZXIubGVuIDogcmVhZGVyLnBvcyArIGxlbmd0aDtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZVB1YmxpY0tleUJ1bmRsZSgpO1xuICAgIHdoaWxlIChyZWFkZXIucG9zIDwgZW5kKSB7XG4gICAgICBjb25zdCB0YWcgPSByZWFkZXIudWludDMyKCk7XG4gICAgICBzd2l0Y2ggKHRhZyA+Pj4gMykge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgbWVzc2FnZS5pZGVudGl0eUtleSA9IFB1YmxpY0tleS5kZWNvZGUocmVhZGVyLCByZWFkZXIudWludDMyKCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgbWVzc2FnZS5wcmVLZXkgPSBQdWJsaWNLZXkuZGVjb2RlKHJlYWRlciwgcmVhZGVyLnVpbnQzMigpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZWFkZXIuc2tpcFR5cGUodGFnICYgNyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlO1xuICB9LFxuXG4gIGZyb21KU09OKG9iamVjdDogYW55KTogUHVibGljS2V5QnVuZGxlIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWRlbnRpdHlLZXk6IGlzU2V0KG9iamVjdC5pZGVudGl0eUtleSlcbiAgICAgICAgPyBQdWJsaWNLZXkuZnJvbUpTT04ob2JqZWN0LmlkZW50aXR5S2V5KVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgIHByZUtleTogaXNTZXQob2JqZWN0LnByZUtleSlcbiAgICAgICAgPyBQdWJsaWNLZXkuZnJvbUpTT04ob2JqZWN0LnByZUtleSlcbiAgICAgICAgOiB1bmRlZmluZWRcbiAgICB9O1xuICB9LFxuXG4gIHRvSlNPTihtZXNzYWdlOiBQdWJsaWNLZXlCdW5kbGUpOiB1bmtub3duIHtcbiAgICBjb25zdCBvYmo6IGFueSA9IHt9O1xuICAgIG1lc3NhZ2UuaWRlbnRpdHlLZXkgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgKG9iai5pZGVudGl0eUtleSA9IG1lc3NhZ2UuaWRlbnRpdHlLZXlcbiAgICAgICAgPyBQdWJsaWNLZXkudG9KU09OKG1lc3NhZ2UuaWRlbnRpdHlLZXkpXG4gICAgICAgIDogdW5kZWZpbmVkKTtcbiAgICBtZXNzYWdlLnByZUtleSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAob2JqLnByZUtleSA9IG1lc3NhZ2UucHJlS2V5XG4gICAgICAgID8gUHVibGljS2V5LnRvSlNPTihtZXNzYWdlLnByZUtleSlcbiAgICAgICAgOiB1bmRlZmluZWQpO1xuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgZnJvbVBhcnRpYWw8SSBleHRlbmRzIEV4YWN0PERlZXBQYXJ0aWFsPFB1YmxpY0tleUJ1bmRsZT4sIEk+PihcbiAgICBvYmplY3Q6IElcbiAgKTogUHVibGljS2V5QnVuZGxlIHtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZVB1YmxpY0tleUJ1bmRsZSgpO1xuICAgIG1lc3NhZ2UuaWRlbnRpdHlLZXkgPVxuICAgICAgb2JqZWN0LmlkZW50aXR5S2V5ICE9PSB1bmRlZmluZWQgJiYgb2JqZWN0LmlkZW50aXR5S2V5ICE9PSBudWxsXG4gICAgICAgID8gUHVibGljS2V5LmZyb21QYXJ0aWFsKG9iamVjdC5pZGVudGl0eUtleSlcbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgbWVzc2FnZS5wcmVLZXkgPVxuICAgICAgb2JqZWN0LnByZUtleSAhPT0gdW5kZWZpbmVkICYmIG9iamVjdC5wcmVLZXkgIT09IG51bGxcbiAgICAgICAgPyBQdWJsaWNLZXkuZnJvbVBhcnRpYWwob2JqZWN0LnByZUtleSlcbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUJhc2VNZXNzYWdlKCk6IE1lc3NhZ2Uge1xuICByZXR1cm4geyBoZWFkZXI6IHVuZGVmaW5lZCwgY2lwaGVydGV4dDogdW5kZWZpbmVkIH07XG59XG5cbmV4cG9ydCBjb25zdCBNZXNzYWdlID0ge1xuICBlbmNvZGUoXG4gICAgbWVzc2FnZTogTWVzc2FnZSxcbiAgICB3cml0ZXI6IF9tMC5Xcml0ZXIgPSBfbTAuV3JpdGVyLmNyZWF0ZSgpXG4gICk6IF9tMC5Xcml0ZXIge1xuICAgIGlmIChtZXNzYWdlLmhlYWRlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBNZXNzYWdlX0hlYWRlci5lbmNvZGUobWVzc2FnZS5oZWFkZXIsIHdyaXRlci51aW50MzIoMTApLmZvcmsoKSkubGRlbGltKCk7XG4gICAgfVxuICAgIGlmIChtZXNzYWdlLmNpcGhlcnRleHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgQ2lwaGVydGV4dC5lbmNvZGUobWVzc2FnZS5jaXBoZXJ0ZXh0LCB3cml0ZXIudWludDMyKDE4KS5mb3JrKCkpLmxkZWxpbSgpO1xuICAgIH1cbiAgICByZXR1cm4gd3JpdGVyO1xuICB9LFxuXG4gIGRlY29kZShpbnB1dDogX20wLlJlYWRlciB8IFVpbnQ4QXJyYXksIGxlbmd0aD86IG51bWJlcik6IE1lc3NhZ2Uge1xuICAgIGNvbnN0IHJlYWRlciA9IGlucHV0IGluc3RhbmNlb2YgX20wLlJlYWRlciA/IGlucHV0IDogbmV3IF9tMC5SZWFkZXIoaW5wdXQpO1xuICAgIGxldCBlbmQgPSBsZW5ndGggPT09IHVuZGVmaW5lZCA/IHJlYWRlci5sZW4gOiByZWFkZXIucG9zICsgbGVuZ3RoO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBjcmVhdGVCYXNlTWVzc2FnZSgpO1xuICAgIHdoaWxlIChyZWFkZXIucG9zIDwgZW5kKSB7XG4gICAgICBjb25zdCB0YWcgPSByZWFkZXIudWludDMyKCk7XG4gICAgICBzd2l0Y2ggKHRhZyA+Pj4gMykge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgbWVzc2FnZS5oZWFkZXIgPSBNZXNzYWdlX0hlYWRlci5kZWNvZGUocmVhZGVyLCByZWFkZXIudWludDMyKCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgbWVzc2FnZS5jaXBoZXJ0ZXh0ID0gQ2lwaGVydGV4dC5kZWNvZGUocmVhZGVyLCByZWFkZXIudWludDMyKCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJlYWRlci5za2lwVHlwZSh0YWcgJiA3KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH0sXG5cbiAgZnJvbUpTT04ob2JqZWN0OiBhbnkpOiBNZXNzYWdlIHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVhZGVyOiBpc1NldChvYmplY3QuaGVhZGVyKVxuICAgICAgICA/IE1lc3NhZ2VfSGVhZGVyLmZyb21KU09OKG9iamVjdC5oZWFkZXIpXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgY2lwaGVydGV4dDogaXNTZXQob2JqZWN0LmNpcGhlcnRleHQpXG4gICAgICAgID8gQ2lwaGVydGV4dC5mcm9tSlNPTihvYmplY3QuY2lwaGVydGV4dClcbiAgICAgICAgOiB1bmRlZmluZWRcbiAgICB9O1xuICB9LFxuXG4gIHRvSlNPTihtZXNzYWdlOiBNZXNzYWdlKTogdW5rbm93biB7XG4gICAgY29uc3Qgb2JqOiBhbnkgPSB7fTtcbiAgICBtZXNzYWdlLmhlYWRlciAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAob2JqLmhlYWRlciA9IG1lc3NhZ2UuaGVhZGVyXG4gICAgICAgID8gTWVzc2FnZV9IZWFkZXIudG9KU09OKG1lc3NhZ2UuaGVhZGVyKVxuICAgICAgICA6IHVuZGVmaW5lZCk7XG4gICAgbWVzc2FnZS5jaXBoZXJ0ZXh0ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIChvYmouY2lwaGVydGV4dCA9IG1lc3NhZ2UuY2lwaGVydGV4dFxuICAgICAgICA/IENpcGhlcnRleHQudG9KU09OKG1lc3NhZ2UuY2lwaGVydGV4dClcbiAgICAgICAgOiB1bmRlZmluZWQpO1xuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgZnJvbVBhcnRpYWw8SSBleHRlbmRzIEV4YWN0PERlZXBQYXJ0aWFsPE1lc3NhZ2U+LCBJPj4ob2JqZWN0OiBJKTogTWVzc2FnZSB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGNyZWF0ZUJhc2VNZXNzYWdlKCk7XG4gICAgbWVzc2FnZS5oZWFkZXIgPVxuICAgICAgb2JqZWN0LmhlYWRlciAhPT0gdW5kZWZpbmVkICYmIG9iamVjdC5oZWFkZXIgIT09IG51bGxcbiAgICAgICAgPyBNZXNzYWdlX0hlYWRlci5mcm9tUGFydGlhbChvYmplY3QuaGVhZGVyKVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBtZXNzYWdlLmNpcGhlcnRleHQgPVxuICAgICAgb2JqZWN0LmNpcGhlcnRleHQgIT09IHVuZGVmaW5lZCAmJiBvYmplY3QuY2lwaGVydGV4dCAhPT0gbnVsbFxuICAgICAgICA/IENpcGhlcnRleHQuZnJvbVBhcnRpYWwob2JqZWN0LmNpcGhlcnRleHQpXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIHJldHVybiBtZXNzYWdlO1xuICB9XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVCYXNlTWVzc2FnZV9IZWFkZXIoKTogTWVzc2FnZV9IZWFkZXIge1xuICByZXR1cm4geyBzZW5kZXI6IHVuZGVmaW5lZCwgcmVjaXBpZW50OiB1bmRlZmluZWQgfTtcbn1cblxuZXhwb3J0IGNvbnN0IE1lc3NhZ2VfSGVhZGVyID0ge1xuICBlbmNvZGUoXG4gICAgbWVzc2FnZTogTWVzc2FnZV9IZWFkZXIsXG4gICAgd3JpdGVyOiBfbTAuV3JpdGVyID0gX20wLldyaXRlci5jcmVhdGUoKVxuICApOiBfbTAuV3JpdGVyIHtcbiAgICBpZiAobWVzc2FnZS5zZW5kZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgUHVibGljS2V5QnVuZGxlLmVuY29kZShtZXNzYWdlLnNlbmRlciwgd3JpdGVyLnVpbnQzMigxMCkuZm9yaygpKS5sZGVsaW0oKTtcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2UucmVjaXBpZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIFB1YmxpY0tleUJ1bmRsZS5lbmNvZGUoXG4gICAgICAgIG1lc3NhZ2UucmVjaXBpZW50LFxuICAgICAgICB3cml0ZXIudWludDMyKDE4KS5mb3JrKClcbiAgICAgICkubGRlbGltKCk7XG4gICAgfVxuICAgIHJldHVybiB3cml0ZXI7XG4gIH0sXG5cbiAgZGVjb2RlKGlucHV0OiBfbTAuUmVhZGVyIHwgVWludDhBcnJheSwgbGVuZ3RoPzogbnVtYmVyKTogTWVzc2FnZV9IZWFkZXIge1xuICAgIGNvbnN0IHJlYWRlciA9IGlucHV0IGluc3RhbmNlb2YgX20wLlJlYWRlciA/IGlucHV0IDogbmV3IF9tMC5SZWFkZXIoaW5wdXQpO1xuICAgIGxldCBlbmQgPSBsZW5ndGggPT09IHVuZGVmaW5lZCA/IHJlYWRlci5sZW4gOiByZWFkZXIucG9zICsgbGVuZ3RoO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBjcmVhdGVCYXNlTWVzc2FnZV9IZWFkZXIoKTtcbiAgICB3aGlsZSAocmVhZGVyLnBvcyA8IGVuZCkge1xuICAgICAgY29uc3QgdGFnID0gcmVhZGVyLnVpbnQzMigpO1xuICAgICAgc3dpdGNoICh0YWcgPj4+IDMpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIG1lc3NhZ2Uuc2VuZGVyID0gUHVibGljS2V5QnVuZGxlLmRlY29kZShyZWFkZXIsIHJlYWRlci51aW50MzIoKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBtZXNzYWdlLnJlY2lwaWVudCA9IFB1YmxpY0tleUJ1bmRsZS5kZWNvZGUocmVhZGVyLCByZWFkZXIudWludDMyKCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJlYWRlci5za2lwVHlwZSh0YWcgJiA3KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH0sXG5cbiAgZnJvbUpTT04ob2JqZWN0OiBhbnkpOiBNZXNzYWdlX0hlYWRlciB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNlbmRlcjogaXNTZXQob2JqZWN0LnNlbmRlcilcbiAgICAgICAgPyBQdWJsaWNLZXlCdW5kbGUuZnJvbUpTT04ob2JqZWN0LnNlbmRlcilcbiAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICByZWNpcGllbnQ6IGlzU2V0KG9iamVjdC5yZWNpcGllbnQpXG4gICAgICAgID8gUHVibGljS2V5QnVuZGxlLmZyb21KU09OKG9iamVjdC5yZWNpcGllbnQpXG4gICAgICAgIDogdW5kZWZpbmVkXG4gICAgfTtcbiAgfSxcblxuICB0b0pTT04obWVzc2FnZTogTWVzc2FnZV9IZWFkZXIpOiB1bmtub3duIHtcbiAgICBjb25zdCBvYmo6IGFueSA9IHt9O1xuICAgIG1lc3NhZ2Uuc2VuZGVyICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIChvYmouc2VuZGVyID0gbWVzc2FnZS5zZW5kZXJcbiAgICAgICAgPyBQdWJsaWNLZXlCdW5kbGUudG9KU09OKG1lc3NhZ2Uuc2VuZGVyKVxuICAgICAgICA6IHVuZGVmaW5lZCk7XG4gICAgbWVzc2FnZS5yZWNpcGllbnQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgKG9iai5yZWNpcGllbnQgPSBtZXNzYWdlLnJlY2lwaWVudFxuICAgICAgICA/IFB1YmxpY0tleUJ1bmRsZS50b0pTT04obWVzc2FnZS5yZWNpcGllbnQpXG4gICAgICAgIDogdW5kZWZpbmVkKTtcbiAgICByZXR1cm4gb2JqO1xuICB9LFxuXG4gIGZyb21QYXJ0aWFsPEkgZXh0ZW5kcyBFeGFjdDxEZWVwUGFydGlhbDxNZXNzYWdlX0hlYWRlcj4sIEk+PihcbiAgICBvYmplY3Q6IElcbiAgKTogTWVzc2FnZV9IZWFkZXIge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBjcmVhdGVCYXNlTWVzc2FnZV9IZWFkZXIoKTtcbiAgICBtZXNzYWdlLnNlbmRlciA9XG4gICAgICBvYmplY3Quc2VuZGVyICE9PSB1bmRlZmluZWQgJiYgb2JqZWN0LnNlbmRlciAhPT0gbnVsbFxuICAgICAgICA/IFB1YmxpY0tleUJ1bmRsZS5mcm9tUGFydGlhbChvYmplY3Quc2VuZGVyKVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBtZXNzYWdlLnJlY2lwaWVudCA9XG4gICAgICBvYmplY3QucmVjaXBpZW50ICE9PSB1bmRlZmluZWQgJiYgb2JqZWN0LnJlY2lwaWVudCAhPT0gbnVsbFxuICAgICAgICA/IFB1YmxpY0tleUJ1bmRsZS5mcm9tUGFydGlhbChvYmplY3QucmVjaXBpZW50KVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfVxufTtcblxuZnVuY3Rpb24gY3JlYXRlQmFzZVByaXZhdGVLZXlCdW5kbGUoKTogUHJpdmF0ZUtleUJ1bmRsZSB7XG4gIHJldHVybiB7IGlkZW50aXR5S2V5OiB1bmRlZmluZWQsIHByZUtleXM6IFtdIH07XG59XG5cbmV4cG9ydCBjb25zdCBQcml2YXRlS2V5QnVuZGxlID0ge1xuICBlbmNvZGUoXG4gICAgbWVzc2FnZTogUHJpdmF0ZUtleUJ1bmRsZSxcbiAgICB3cml0ZXI6IF9tMC5Xcml0ZXIgPSBfbTAuV3JpdGVyLmNyZWF0ZSgpXG4gICk6IF9tMC5Xcml0ZXIge1xuICAgIGlmIChtZXNzYWdlLmlkZW50aXR5S2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIFByaXZhdGVLZXkuZW5jb2RlKG1lc3NhZ2UuaWRlbnRpdHlLZXksIHdyaXRlci51aW50MzIoMTApLmZvcmsoKSkubGRlbGltKCk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgdiBvZiBtZXNzYWdlLnByZUtleXMpIHtcbiAgICAgIFByaXZhdGVLZXkuZW5jb2RlKHYhLCB3cml0ZXIudWludDMyKDE4KS5mb3JrKCkpLmxkZWxpbSgpO1xuICAgIH1cbiAgICByZXR1cm4gd3JpdGVyO1xuICB9LFxuXG4gIGRlY29kZShpbnB1dDogX20wLlJlYWRlciB8IFVpbnQ4QXJyYXksIGxlbmd0aD86IG51bWJlcik6IFByaXZhdGVLZXlCdW5kbGUge1xuICAgIGNvbnN0IHJlYWRlciA9IGlucHV0IGluc3RhbmNlb2YgX20wLlJlYWRlciA/IGlucHV0IDogbmV3IF9tMC5SZWFkZXIoaW5wdXQpO1xuICAgIGxldCBlbmQgPSBsZW5ndGggPT09IHVuZGVmaW5lZCA/IHJlYWRlci5sZW4gOiByZWFkZXIucG9zICsgbGVuZ3RoO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBjcmVhdGVCYXNlUHJpdmF0ZUtleUJ1bmRsZSgpO1xuICAgIHdoaWxlIChyZWFkZXIucG9zIDwgZW5kKSB7XG4gICAgICBjb25zdCB0YWcgPSByZWFkZXIudWludDMyKCk7XG4gICAgICBzd2l0Y2ggKHRhZyA+Pj4gMykge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgbWVzc2FnZS5pZGVudGl0eUtleSA9IFByaXZhdGVLZXkuZGVjb2RlKHJlYWRlciwgcmVhZGVyLnVpbnQzMigpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIG1lc3NhZ2UucHJlS2V5cy5wdXNoKFByaXZhdGVLZXkuZGVjb2RlKHJlYWRlciwgcmVhZGVyLnVpbnQzMigpKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmVhZGVyLnNraXBUeXBlKHRhZyAmIDcpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfSxcblxuICBmcm9tSlNPTihvYmplY3Q6IGFueSk6IFByaXZhdGVLZXlCdW5kbGUge1xuICAgIHJldHVybiB7XG4gICAgICBpZGVudGl0eUtleTogaXNTZXQob2JqZWN0LmlkZW50aXR5S2V5KVxuICAgICAgICA/IFByaXZhdGVLZXkuZnJvbUpTT04ob2JqZWN0LmlkZW50aXR5S2V5KVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgIHByZUtleXM6IEFycmF5LmlzQXJyYXkob2JqZWN0Py5wcmVLZXlzKVxuICAgICAgICA/IG9iamVjdC5wcmVLZXlzLm1hcCgoZTogYW55KSA9PiBQcml2YXRlS2V5LmZyb21KU09OKGUpKVxuICAgICAgICA6IFtdXG4gICAgfTtcbiAgfSxcblxuICB0b0pTT04obWVzc2FnZTogUHJpdmF0ZUtleUJ1bmRsZSk6IHVua25vd24ge1xuICAgIGNvbnN0IG9iajogYW55ID0ge307XG4gICAgbWVzc2FnZS5pZGVudGl0eUtleSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAob2JqLmlkZW50aXR5S2V5ID0gbWVzc2FnZS5pZGVudGl0eUtleVxuICAgICAgICA/IFByaXZhdGVLZXkudG9KU09OKG1lc3NhZ2UuaWRlbnRpdHlLZXkpXG4gICAgICAgIDogdW5kZWZpbmVkKTtcbiAgICBpZiAobWVzc2FnZS5wcmVLZXlzKSB7XG4gICAgICBvYmoucHJlS2V5cyA9IG1lc3NhZ2UucHJlS2V5cy5tYXAoZSA9PlxuICAgICAgICBlID8gUHJpdmF0ZUtleS50b0pTT04oZSkgOiB1bmRlZmluZWRcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9iai5wcmVLZXlzID0gW107XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgZnJvbVBhcnRpYWw8SSBleHRlbmRzIEV4YWN0PERlZXBQYXJ0aWFsPFByaXZhdGVLZXlCdW5kbGU+LCBJPj4oXG4gICAgb2JqZWN0OiBJXG4gICk6IFByaXZhdGVLZXlCdW5kbGUge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBjcmVhdGVCYXNlUHJpdmF0ZUtleUJ1bmRsZSgpO1xuICAgIG1lc3NhZ2UuaWRlbnRpdHlLZXkgPVxuICAgICAgb2JqZWN0LmlkZW50aXR5S2V5ICE9PSB1bmRlZmluZWQgJiYgb2JqZWN0LmlkZW50aXR5S2V5ICE9PSBudWxsXG4gICAgICAgID8gUHJpdmF0ZUtleS5mcm9tUGFydGlhbChvYmplY3QuaWRlbnRpdHlLZXkpXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIG1lc3NhZ2UucHJlS2V5cyA9IG9iamVjdC5wcmVLZXlzPy5tYXAoZSA9PiBQcml2YXRlS2V5LmZyb21QYXJ0aWFsKGUpKSB8fCBbXTtcbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfVxufTtcblxuZnVuY3Rpb24gY3JlYXRlQmFzZUVuY3J5cHRlZFByaXZhdGVLZXlCdW5kbGUoKTogRW5jcnlwdGVkUHJpdmF0ZUtleUJ1bmRsZSB7XG4gIHJldHVybiB7IHdhbGxldFByZUtleTogbmV3IFVpbnQ4QXJyYXkoKSwgY2lwaGVydGV4dDogdW5kZWZpbmVkIH07XG59XG5cbmV4cG9ydCBjb25zdCBFbmNyeXB0ZWRQcml2YXRlS2V5QnVuZGxlID0ge1xuICBlbmNvZGUoXG4gICAgbWVzc2FnZTogRW5jcnlwdGVkUHJpdmF0ZUtleUJ1bmRsZSxcbiAgICB3cml0ZXI6IF9tMC5Xcml0ZXIgPSBfbTAuV3JpdGVyLmNyZWF0ZSgpXG4gICk6IF9tMC5Xcml0ZXIge1xuICAgIGlmIChtZXNzYWdlLndhbGxldFByZUtleS5sZW5ndGggIT09IDApIHtcbiAgICAgIHdyaXRlci51aW50MzIoMTApLmJ5dGVzKG1lc3NhZ2Uud2FsbGV0UHJlS2V5KTtcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2UuY2lwaGVydGV4dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBDaXBoZXJ0ZXh0LmVuY29kZShtZXNzYWdlLmNpcGhlcnRleHQsIHdyaXRlci51aW50MzIoMTgpLmZvcmsoKSkubGRlbGltKCk7XG4gICAgfVxuICAgIHJldHVybiB3cml0ZXI7XG4gIH0sXG5cbiAgZGVjb2RlKFxuICAgIGlucHV0OiBfbTAuUmVhZGVyIHwgVWludDhBcnJheSxcbiAgICBsZW5ndGg/OiBudW1iZXJcbiAgKTogRW5jcnlwdGVkUHJpdmF0ZUtleUJ1bmRsZSB7XG4gICAgY29uc3QgcmVhZGVyID0gaW5wdXQgaW5zdGFuY2VvZiBfbTAuUmVhZGVyID8gaW5wdXQgOiBuZXcgX20wLlJlYWRlcihpbnB1dCk7XG4gICAgbGV0IGVuZCA9IGxlbmd0aCA9PT0gdW5kZWZpbmVkID8gcmVhZGVyLmxlbiA6IHJlYWRlci5wb3MgKyBsZW5ndGg7XG4gICAgY29uc3QgbWVzc2FnZSA9IGNyZWF0ZUJhc2VFbmNyeXB0ZWRQcml2YXRlS2V5QnVuZGxlKCk7XG4gICAgd2hpbGUgKHJlYWRlci5wb3MgPCBlbmQpIHtcbiAgICAgIGNvbnN0IHRhZyA9IHJlYWRlci51aW50MzIoKTtcbiAgICAgIHN3aXRjaCAodGFnID4+PiAzKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBtZXNzYWdlLndhbGxldFByZUtleSA9IHJlYWRlci5ieXRlcygpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgbWVzc2FnZS5jaXBoZXJ0ZXh0ID0gQ2lwaGVydGV4dC5kZWNvZGUocmVhZGVyLCByZWFkZXIudWludDMyKCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJlYWRlci5za2lwVHlwZSh0YWcgJiA3KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH0sXG5cbiAgZnJvbUpTT04ob2JqZWN0OiBhbnkpOiBFbmNyeXB0ZWRQcml2YXRlS2V5QnVuZGxlIHtcbiAgICByZXR1cm4ge1xuICAgICAgd2FsbGV0UHJlS2V5OiBpc1NldChvYmplY3Qud2FsbGV0UHJlS2V5KVxuICAgICAgICA/IGJ5dGVzRnJvbUJhc2U2NChvYmplY3Qud2FsbGV0UHJlS2V5KVxuICAgICAgICA6IG5ldyBVaW50OEFycmF5KCksXG4gICAgICBjaXBoZXJ0ZXh0OiBpc1NldChvYmplY3QuY2lwaGVydGV4dClcbiAgICAgICAgPyBDaXBoZXJ0ZXh0LmZyb21KU09OKG9iamVjdC5jaXBoZXJ0ZXh0KVxuICAgICAgICA6IHVuZGVmaW5lZFxuICAgIH07XG4gIH0sXG5cbiAgdG9KU09OKG1lc3NhZ2U6IEVuY3J5cHRlZFByaXZhdGVLZXlCdW5kbGUpOiB1bmtub3duIHtcbiAgICBjb25zdCBvYmo6IGFueSA9IHt9O1xuICAgIG1lc3NhZ2Uud2FsbGV0UHJlS2V5ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIChvYmoud2FsbGV0UHJlS2V5ID0gYmFzZTY0RnJvbUJ5dGVzKFxuICAgICAgICBtZXNzYWdlLndhbGxldFByZUtleSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgPyBtZXNzYWdlLndhbGxldFByZUtleVxuICAgICAgICAgIDogbmV3IFVpbnQ4QXJyYXkoKVxuICAgICAgKSk7XG4gICAgbWVzc2FnZS5jaXBoZXJ0ZXh0ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIChvYmouY2lwaGVydGV4dCA9IG1lc3NhZ2UuY2lwaGVydGV4dFxuICAgICAgICA/IENpcGhlcnRleHQudG9KU09OKG1lc3NhZ2UuY2lwaGVydGV4dClcbiAgICAgICAgOiB1bmRlZmluZWQpO1xuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgZnJvbVBhcnRpYWw8SSBleHRlbmRzIEV4YWN0PERlZXBQYXJ0aWFsPEVuY3J5cHRlZFByaXZhdGVLZXlCdW5kbGU+LCBJPj4oXG4gICAgb2JqZWN0OiBJXG4gICk6IEVuY3J5cHRlZFByaXZhdGVLZXlCdW5kbGUge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBjcmVhdGVCYXNlRW5jcnlwdGVkUHJpdmF0ZUtleUJ1bmRsZSgpO1xuICAgIG1lc3NhZ2Uud2FsbGV0UHJlS2V5ID0gb2JqZWN0LndhbGxldFByZUtleSA/PyBuZXcgVWludDhBcnJheSgpO1xuICAgIG1lc3NhZ2UuY2lwaGVydGV4dCA9XG4gICAgICBvYmplY3QuY2lwaGVydGV4dCAhPT0gdW5kZWZpbmVkICYmIG9iamVjdC5jaXBoZXJ0ZXh0ICE9PSBudWxsXG4gICAgICAgID8gQ2lwaGVydGV4dC5mcm9tUGFydGlhbChvYmplY3QuY2lwaGVydGV4dClcbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH1cbn07XG5cbmRlY2xhcmUgdmFyIHNlbGY6IGFueSB8IHVuZGVmaW5lZDtcbmRlY2xhcmUgdmFyIHdpbmRvdzogYW55IHwgdW5kZWZpbmVkO1xuZGVjbGFyZSB2YXIgZ2xvYmFsOiBhbnkgfCB1bmRlZmluZWQ7XG52YXIgZ2xvYmFsVGhpczogYW55ID0gKCgpID0+IHtcbiAgaWYgKHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJykgcmV0dXJuIGdsb2JhbFRoaXM7XG4gIGlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiBzZWxmO1xuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiB3aW5kb3c7XG4gIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykgcmV0dXJuIGdsb2JhbDtcbiAgdGhyb3cgJ1VuYWJsZSB0byBsb2NhdGUgZ2xvYmFsIG9iamVjdCc7XG59KSgpO1xuXG5jb25zdCBhdG9iOiAoYjY0OiBzdHJpbmcpID0+IHN0cmluZyA9XG4gIGdsb2JhbFRoaXMuYXRvYiB8fFxuICAoYjY0ID0+IGdsb2JhbFRoaXMuQnVmZmVyLmZyb20oYjY0LCAnYmFzZTY0JykudG9TdHJpbmcoJ2JpbmFyeScpKTtcbmZ1bmN0aW9uIGJ5dGVzRnJvbUJhc2U2NChiNjQ6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBiaW4gPSBhdG9iKGI2NCk7XG4gIGNvbnN0IGFyciA9IG5ldyBVaW50OEFycmF5KGJpbi5sZW5ndGgpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbi5sZW5ndGg7ICsraSkge1xuICAgIGFycltpXSA9IGJpbi5jaGFyQ29kZUF0KGkpO1xuICB9XG4gIHJldHVybiBhcnI7XG59XG5cbmNvbnN0IGJ0b2E6IChiaW46IHN0cmluZykgPT4gc3RyaW5nID1cbiAgZ2xvYmFsVGhpcy5idG9hIHx8XG4gIChiaW4gPT4gZ2xvYmFsVGhpcy5CdWZmZXIuZnJvbShiaW4sICdiaW5hcnknKS50b1N0cmluZygnYmFzZTY0JykpO1xuZnVuY3Rpb24gYmFzZTY0RnJvbUJ5dGVzKGFycjogVWludDhBcnJheSk6IHN0cmluZyB7XG4gIGNvbnN0IGJpbjogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBieXRlIG9mIGFycikge1xuICAgIGJpbi5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZSkpO1xuICB9XG4gIHJldHVybiBidG9hKGJpbi5qb2luKCcnKSk7XG59XG5cbnR5cGUgQnVpbHRpbiA9XG4gIHwgRGF0ZVxuICB8IEZ1bmN0aW9uXG4gIHwgVWludDhBcnJheVxuICB8IHN0cmluZ1xuICB8IG51bWJlclxuICB8IGJvb2xlYW5cbiAgfCB1bmRlZmluZWQ7XG5cbmV4cG9ydCB0eXBlIERlZXBQYXJ0aWFsPFQ+ID0gVCBleHRlbmRzIEJ1aWx0aW5cbiAgPyBUXG4gIDogVCBleHRlbmRzIEFycmF5PGluZmVyIFU+XG4gID8gQXJyYXk8RGVlcFBhcnRpYWw8VT4+XG4gIDogVCBleHRlbmRzIFJlYWRvbmx5QXJyYXk8aW5mZXIgVT5cbiAgPyBSZWFkb25seUFycmF5PERlZXBQYXJ0aWFsPFU+PlxuICA6IFQgZXh0ZW5kcyB7fVxuICA/IHsgW0sgaW4ga2V5b2YgVF0/OiBEZWVwUGFydGlhbDxUW0tdPiB9XG4gIDogUGFydGlhbDxUPjtcblxudHlwZSBLZXlzT2ZVbmlvbjxUPiA9IFQgZXh0ZW5kcyBUID8ga2V5b2YgVCA6IG5ldmVyO1xuZXhwb3J0IHR5cGUgRXhhY3Q8UCwgSSBleHRlbmRzIFA+ID0gUCBleHRlbmRzIEJ1aWx0aW5cbiAgPyBQXG4gIDogUCAmIHsgW0sgaW4ga2V5b2YgUF06IEV4YWN0PFBbS10sIElbS10+IH0gJiBSZWNvcmQ8XG4gICAgICAgIEV4Y2x1ZGU8a2V5b2YgSSwgS2V5c09mVW5pb248UD4+LFxuICAgICAgICBuZXZlclxuICAgICAgPjtcblxuaWYgKF9tMC51dGlsLkxvbmcgIT09IExvbmcpIHtcbiAgX20wLnV0aWwuTG9uZyA9IExvbmcgYXMgYW55O1xuICBfbTAuY29uZmlndXJlKCk7XG59XG5cbmZ1bmN0aW9uIGlzU2V0KHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQ7XG59XG4iXX0=