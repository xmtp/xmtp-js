"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.protobufPackage = exports.Signature_ECDSACompact = exports.Signature = exports.PublicKey_Secp256k1Uncompresed = exports.PublicKeyBundle = exports.PublicKey = exports.PrivateKey_Secp256k1 = exports.PrivateKeyBundle = exports.PrivateKey = exports.Message_Header = exports.Message = exports.EncryptedPrivateKeyBundle = exports.Ciphertext_Aes256gcmHkdfsha256 = exports.Ciphertext = void 0;

var _long = _interopRequireDefault(require("long"));

var _minimal = _interopRequireDefault(require("protobufjs/minimal"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var protobufPackage = '';
exports.protobufPackage = protobufPackage;

function createBaseSignature() {
  return {
    ecdsaCompact: undefined
  };
}

var Signature = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _minimal["default"].Writer.create();

    if (message.ecdsaCompact !== undefined) {
      Signature_ECDSACompact.encode(message.ecdsaCompact, writer.uint32(10).fork()).ldelim();
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _minimal["default"].Reader ? input : new _minimal["default"].Reader(input);
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
exports.Signature = Signature;

function createBaseSignature_ECDSACompact() {
  return {
    bytes: new Uint8Array(),
    recovery: 0
  };
}

var Signature_ECDSACompact = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _minimal["default"].Writer.create();

    if (message.bytes.length !== 0) {
      writer.uint32(10).bytes(message.bytes);
    }

    if (message.recovery !== 0) {
      writer.uint32(16).uint32(message.recovery);
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _minimal["default"].Reader ? input : new _minimal["default"].Reader(input);
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
exports.Signature_ECDSACompact = Signature_ECDSACompact;

function createBasePublicKey() {
  return {
    secp256k1Uncompressed: undefined,
    signature: undefined
  };
}

var PublicKey = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _minimal["default"].Writer.create();

    if (message.secp256k1Uncompressed !== undefined) {
      PublicKey_Secp256k1Uncompresed.encode(message.secp256k1Uncompressed, writer.uint32(10).fork()).ldelim();
    }

    if (message.signature !== undefined) {
      Signature.encode(message.signature, writer.uint32(18).fork()).ldelim();
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _minimal["default"].Reader ? input : new _minimal["default"].Reader(input);
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
exports.PublicKey = PublicKey;

function createBasePublicKey_Secp256k1Uncompresed() {
  return {
    bytes: new Uint8Array()
  };
}

var PublicKey_Secp256k1Uncompresed = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _minimal["default"].Writer.create();

    if (message.bytes.length !== 0) {
      writer.uint32(10).bytes(message.bytes);
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _minimal["default"].Reader ? input : new _minimal["default"].Reader(input);
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
exports.PublicKey_Secp256k1Uncompresed = PublicKey_Secp256k1Uncompresed;

function createBasePrivateKey() {
  return {
    secp256k1: undefined
  };
}

var PrivateKey = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _minimal["default"].Writer.create();

    if (message.secp256k1 !== undefined) {
      PrivateKey_Secp256k1.encode(message.secp256k1, writer.uint32(10).fork()).ldelim();
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _minimal["default"].Reader ? input : new _minimal["default"].Reader(input);
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
exports.PrivateKey = PrivateKey;

function createBasePrivateKey_Secp256k1() {
  return {
    bytes: new Uint8Array()
  };
}

var PrivateKey_Secp256k1 = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _minimal["default"].Writer.create();

    if (message.bytes.length !== 0) {
      writer.uint32(10).bytes(message.bytes);
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _minimal["default"].Reader ? input : new _minimal["default"].Reader(input);
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
exports.PrivateKey_Secp256k1 = PrivateKey_Secp256k1;

function createBaseCiphertext() {
  return {
    aes256GcmHkdfSha256: undefined
  };
}

var Ciphertext = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _minimal["default"].Writer.create();

    if (message.aes256GcmHkdfSha256 !== undefined) {
      Ciphertext_Aes256gcmHkdfsha256.encode(message.aes256GcmHkdfSha256, writer.uint32(10).fork()).ldelim();
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _minimal["default"].Reader ? input : new _minimal["default"].Reader(input);
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
exports.Ciphertext = Ciphertext;

function createBaseCiphertext_Aes256gcmHkdfsha256() {
  return {
    hkdfSalt: new Uint8Array(),
    gcmNonce: new Uint8Array(),
    payload: new Uint8Array()
  };
}

var Ciphertext_Aes256gcmHkdfsha256 = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _minimal["default"].Writer.create();

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
    var reader = input instanceof _minimal["default"].Reader ? input : new _minimal["default"].Reader(input);
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
exports.Ciphertext_Aes256gcmHkdfsha256 = Ciphertext_Aes256gcmHkdfsha256;

function createBasePublicKeyBundle() {
  return {
    identityKey: undefined,
    preKey: undefined
  };
}

var PublicKeyBundle = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _minimal["default"].Writer.create();

    if (message.identityKey !== undefined) {
      PublicKey.encode(message.identityKey, writer.uint32(10).fork()).ldelim();
    }

    if (message.preKey !== undefined) {
      PublicKey.encode(message.preKey, writer.uint32(18).fork()).ldelim();
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _minimal["default"].Reader ? input : new _minimal["default"].Reader(input);
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
exports.PublicKeyBundle = PublicKeyBundle;

function createBaseMessage() {
  return {
    header: undefined,
    ciphertext: undefined
  };
}

var Message = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _minimal["default"].Writer.create();

    if (message.header !== undefined) {
      Message_Header.encode(message.header, writer.uint32(10).fork()).ldelim();
    }

    if (message.ciphertext !== undefined) {
      Ciphertext.encode(message.ciphertext, writer.uint32(18).fork()).ldelim();
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _minimal["default"].Reader ? input : new _minimal["default"].Reader(input);
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
exports.Message = Message;

function createBaseMessage_Header() {
  return {
    sender: undefined,
    recipient: undefined
  };
}

var Message_Header = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _minimal["default"].Writer.create();

    if (message.sender !== undefined) {
      PublicKeyBundle.encode(message.sender, writer.uint32(10).fork()).ldelim();
    }

    if (message.recipient !== undefined) {
      PublicKeyBundle.encode(message.recipient, writer.uint32(18).fork()).ldelim();
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _minimal["default"].Reader ? input : new _minimal["default"].Reader(input);
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
exports.Message_Header = Message_Header;

function createBasePrivateKeyBundle() {
  return {
    identityKey: undefined,
    preKeys: []
  };
}

var PrivateKeyBundle = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _minimal["default"].Writer.create();

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
    var reader = input instanceof _minimal["default"].Reader ? input : new _minimal["default"].Reader(input);
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
exports.PrivateKeyBundle = PrivateKeyBundle;

function createBaseEncryptedPrivateKeyBundle() {
  return {
    walletPreKey: new Uint8Array(),
    ciphertext: undefined
  };
}

var EncryptedPrivateKeyBundle = {
  encode: function encode(message) {
    var writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _minimal["default"].Writer.create();

    if (message.walletPreKey.length !== 0) {
      writer.uint32(10).bytes(message.walletPreKey);
    }

    if (message.ciphertext !== undefined) {
      Ciphertext.encode(message.ciphertext, writer.uint32(18).fork()).ldelim();
    }

    return writer;
  },
  decode: function decode(input, length) {
    var reader = input instanceof _minimal["default"].Reader ? input : new _minimal["default"].Reader(input);
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
exports.EncryptedPrivateKeyBundle = EncryptedPrivateKeyBundle;

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

if (_minimal["default"].util.Long !== _long["default"]) {
  _minimal["default"].util.Long = _long["default"];

  _minimal["default"].configure();
}

function isSet(value) {
  return value !== null && value !== undefined;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wcm90by9tZXNzYWdlLnRzIl0sIm5hbWVzIjpbInByb3RvYnVmUGFja2FnZSIsImNyZWF0ZUJhc2VTaWduYXR1cmUiLCJlY2RzYUNvbXBhY3QiLCJ1bmRlZmluZWQiLCJTaWduYXR1cmUiLCJlbmNvZGUiLCJtZXNzYWdlIiwid3JpdGVyIiwiX20wIiwiV3JpdGVyIiwiY3JlYXRlIiwiU2lnbmF0dXJlX0VDRFNBQ29tcGFjdCIsInVpbnQzMiIsImZvcmsiLCJsZGVsaW0iLCJkZWNvZGUiLCJpbnB1dCIsImxlbmd0aCIsInJlYWRlciIsIlJlYWRlciIsImVuZCIsImxlbiIsInBvcyIsInRhZyIsInNraXBUeXBlIiwiZnJvbUpTT04iLCJvYmplY3QiLCJpc1NldCIsInRvSlNPTiIsIm9iaiIsImZyb21QYXJ0aWFsIiwiY3JlYXRlQmFzZVNpZ25hdHVyZV9FQ0RTQUNvbXBhY3QiLCJieXRlcyIsIlVpbnQ4QXJyYXkiLCJyZWNvdmVyeSIsImJ5dGVzRnJvbUJhc2U2NCIsIk51bWJlciIsImJhc2U2NEZyb21CeXRlcyIsIk1hdGgiLCJyb3VuZCIsImNyZWF0ZUJhc2VQdWJsaWNLZXkiLCJzZWNwMjU2azFVbmNvbXByZXNzZWQiLCJzaWduYXR1cmUiLCJQdWJsaWNLZXkiLCJQdWJsaWNLZXlfU2VjcDI1NmsxVW5jb21wcmVzZWQiLCJjcmVhdGVCYXNlUHVibGljS2V5X1NlY3AyNTZrMVVuY29tcHJlc2VkIiwiY3JlYXRlQmFzZVByaXZhdGVLZXkiLCJzZWNwMjU2azEiLCJQcml2YXRlS2V5IiwiUHJpdmF0ZUtleV9TZWNwMjU2azEiLCJjcmVhdGVCYXNlUHJpdmF0ZUtleV9TZWNwMjU2azEiLCJjcmVhdGVCYXNlQ2lwaGVydGV4dCIsImFlczI1NkdjbUhrZGZTaGEyNTYiLCJDaXBoZXJ0ZXh0IiwiQ2lwaGVydGV4dF9BZXMyNTZnY21Ia2Rmc2hhMjU2IiwiY3JlYXRlQmFzZUNpcGhlcnRleHRfQWVzMjU2Z2NtSGtkZnNoYTI1NiIsImhrZGZTYWx0IiwiZ2NtTm9uY2UiLCJwYXlsb2FkIiwiY3JlYXRlQmFzZVB1YmxpY0tleUJ1bmRsZSIsImlkZW50aXR5S2V5IiwicHJlS2V5IiwiUHVibGljS2V5QnVuZGxlIiwiY3JlYXRlQmFzZU1lc3NhZ2UiLCJoZWFkZXIiLCJjaXBoZXJ0ZXh0IiwiTWVzc2FnZSIsIk1lc3NhZ2VfSGVhZGVyIiwiY3JlYXRlQmFzZU1lc3NhZ2VfSGVhZGVyIiwic2VuZGVyIiwicmVjaXBpZW50IiwiY3JlYXRlQmFzZVByaXZhdGVLZXlCdW5kbGUiLCJwcmVLZXlzIiwiUHJpdmF0ZUtleUJ1bmRsZSIsInYiLCJwdXNoIiwiQXJyYXkiLCJpc0FycmF5IiwibWFwIiwiZSIsImNyZWF0ZUJhc2VFbmNyeXB0ZWRQcml2YXRlS2V5QnVuZGxlIiwid2FsbGV0UHJlS2V5IiwiRW5jcnlwdGVkUHJpdmF0ZUtleUJ1bmRsZSIsImdsb2JhbFRoaXMiLCJzZWxmIiwid2luZG93IiwiZ2xvYmFsIiwiYXRvYiIsImI2NCIsIkJ1ZmZlciIsImZyb20iLCJ0b1N0cmluZyIsImJpbiIsImFyciIsImkiLCJjaGFyQ29kZUF0IiwiYnRvYSIsImJ5dGUiLCJTdHJpbmciLCJmcm9tQ2hhckNvZGUiLCJqb2luIiwidXRpbCIsIkxvbmciLCJjb25maWd1cmUiLCJ2YWx1ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUNBOztBQUNBOzs7Ozs7Ozs7O0FBRU8sSUFBTUEsZUFBZSxHQUFHLEVBQXhCOzs7QUFtRVAsU0FBU0MsbUJBQVQsR0FBMEM7QUFDeEMsU0FBTztBQUFFQyxJQUFBQSxZQUFZLEVBQUVDO0FBQWhCLEdBQVA7QUFDRDs7QUFFTSxJQUFNQyxTQUFTLEdBQUc7QUFDdkJDLEVBQUFBLE1BRHVCLGtCQUVyQkMsT0FGcUIsRUFJVDtBQUFBLFFBRFpDLE1BQ1ksdUVBRFNDLG9CQUFJQyxNQUFKLENBQVdDLE1BQVgsRUFDVDs7QUFDWixRQUFJSixPQUFPLENBQUNKLFlBQVIsS0FBeUJDLFNBQTdCLEVBQXdDO0FBQ3RDUSxNQUFBQSxzQkFBc0IsQ0FBQ04s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L0MsQ0FBSjtBQUFBLENBRk47O0FBR0EsU0FBU3RELGVBQVQsQ0FBeUJ3RCxHQUF6QixFQUFrRDtBQUNoRCxNQUFNRCxHQUFhLEdBQUcsRUFBdEI7O0FBRGdELDhDQUU3QkMsR0FGNkI7QUFBQTs7QUFBQTtBQUVoRCwyREFBd0I7QUFBQSxVQUFiSSxLQUFhO0FBQ3RCTCxNQUFBQSxHQUFHLENBQUNqQixJQUFKLENBQVN1QixNQUFNLENBQUNDLFlBQVAsQ0FBb0JGLEtBQXBCLENBQVQ7QUFDRDtBQUorQztBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUtoRCxTQUFPRCxJQUFJLENBQUNKLEdBQUcsQ0FBQ1EsSUFBSixDQUFTLEVBQVQsQ0FBRCxDQUFYO0FBQ0Q7O0FBNkJELElBQUk1RixvQkFBSTZGLElBQUosQ0FBU0MsSUFBVCxLQUFrQkEsZ0JBQXRCLEVBQTRCO0FBQzFCOUYsc0JBQUk2RixJQUFKLENBQVNDLElBQVQsR0FBZ0JBLGdCQUFoQjs7QUFDQTlGLHNCQUFJK0YsU0FBSjtBQUNEOztBQUVELFNBQVM1RSxLQUFULENBQWU2RSxLQUFmLEVBQW9DO0FBQ2xDLFNBQU9BLEtBQUssS0FBSyxJQUFWLElBQWtCQSxLQUFLLEtBQUtyRyxTQUFuQztBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCBMb25nIGZyb20gJ2xvbmcnO1xuaW1wb3J0IF9tMCBmcm9tICdwcm90b2J1ZmpzL21pbmltYWwnO1xuXG5leHBvcnQgY29uc3QgcHJvdG9idWZQYWNrYWdlID0gJyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2lnbmF0dXJlIHtcbiAgZWNkc2FDb21wYWN0OiBTaWduYXR1cmVfRUNEU0FDb21wYWN0IHwgdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25hdHVyZV9FQ0RTQUNvbXBhY3Qge1xuICAvKiogY29tcGFjdCByZXByZXNlbnRhdGlvbiBbIFIgfHwgUyBdLCA2NCBieXRlcyAqL1xuICBieXRlczogVWludDhBcnJheTtcbiAgLyoqIHJlY292ZXJ5IGJpdCAqL1xuICByZWNvdmVyeTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFB1YmxpY0tleSB7XG4gIHNlY3AyNTZrMVVuY29tcHJlc3NlZDogUHVibGljS2V5X1NlY3AyNTZrMVVuY29tcHJlc2VkIHwgdW5kZWZpbmVkO1xuICBzaWduYXR1cmU/OiBTaWduYXR1cmUgfCB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHVibGljS2V5X1NlY3AyNTZrMVVuY29tcHJlc2VkIHtcbiAgLyoqIHVuY29tcHJlc3NlZCBwb2ludCB3aXRoIHByZWZpeCAoMHgwNCkgWyBQIHx8IFggfHwgWSBdLCA2NSBieXRlcyAqL1xuICBieXRlczogVWludDhBcnJheTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcml2YXRlS2V5IHtcbiAgc2VjcDI1NmsxOiBQcml2YXRlS2V5X1NlY3AyNTZrMSB8IHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcml2YXRlS2V5X1NlY3AyNTZrMSB7XG4gIC8qKiBEIGJpZy1lbmRpYW4sIDMyIGJ5dGVzICovXG4gIGJ5dGVzOiBVaW50OEFycmF5O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENpcGhlcnRleHQge1xuICBhZXMyNTZHY21Ia2RmU2hhMjU2OiBDaXBoZXJ0ZXh0X0FlczI1NmdjbUhrZGZzaGEyNTYgfCB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2lwaGVydGV4dF9BZXMyNTZnY21Ia2Rmc2hhMjU2IHtcbiAgaGtkZlNhbHQ6IFVpbnQ4QXJyYXk7XG4gIGdjbU5vbmNlOiBVaW50OEFycmF5O1xuICBwYXlsb2FkOiBVaW50OEFycmF5O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFB1YmxpY0tleUJ1bmRsZSB7XG4gIGlkZW50aXR5S2V5OiBQdWJsaWNLZXkgfCB1bmRlZmluZWQ7XG4gIHByZUtleTogUHVibGljS2V5IHwgdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1lc3NhZ2Uge1xuICBoZWFkZXI6IE1lc3NhZ2VfSGVhZGVyIHwgdW5kZWZpbmVkO1xuICBjaXBoZXJ0ZXh0OiBDaXBoZXJ0ZXh0IHwgdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1lc3NhZ2VfSGVhZGVyIHtcbiAgc2VuZGVyOiBQdWJsaWNLZXlCdW5kbGUgfCB1bmRlZmluZWQ7XG4gIHJlY2lwaWVudDogUHVibGljS2V5QnVuZGxlIHwgdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFByaXZhdGVLZXlCdW5kbGUge1xuICBpZGVudGl0eUtleTogUHJpdmF0ZUtleSB8IHVuZGVmaW5lZDtcbiAgcHJlS2V5czogUHJpdmF0ZUtleVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVuY3J5cHRlZFByaXZhdGVLZXlCdW5kbGUge1xuICB3YWxsZXRQcmVLZXk6IFVpbnQ4QXJyYXk7XG4gIGNpcGhlcnRleHQ6IENpcGhlcnRleHQgfCB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUJhc2VTaWduYXR1cmUoKTogU2lnbmF0dXJlIHtcbiAgcmV0dXJuIHsgZWNkc2FDb21wYWN0OiB1bmRlZmluZWQgfTtcbn1cblxuZXhwb3J0IGNvbnN0IFNpZ25hdHVyZSA9IHtcbiAgZW5jb2RlKFxuICAgIG1lc3NhZ2U6IFNpZ25hdHVyZSxcbiAgICB3cml0ZXI6IF9tMC5Xcml0ZXIgPSBfbTAuV3JpdGVyLmNyZWF0ZSgpXG4gICk6IF9tMC5Xcml0ZXIge1xuICAgIGlmIChtZXNzYWdlLmVjZHNhQ29tcGFjdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBTaWduYXR1cmVfRUNEU0FDb21wYWN0LmVuY29kZShcbiAgICAgICAgbWVzc2FnZS5lY2RzYUNvbXBhY3QsXG4gICAgICAgIHdyaXRlci51aW50MzIoMTApLmZvcmsoKVxuICAgICAgKS5sZGVsaW0oKTtcbiAgICB9XG4gICAgcmV0dXJuIHdyaXRlcjtcbiAgfSxcblxuICBkZWNvZGUoaW5wdXQ6IF9tMC5SZWFkZXIgfCBVaW50OEFycmF5LCBsZW5ndGg/OiBudW1iZXIpOiBTaWduYXR1cmUge1xuICAgIGNvbnN0IHJlYWRlciA9IGlucHV0IGluc3RhbmNlb2YgX20wLlJlYWRlciA/IGlucHV0IDogbmV3IF9tMC5SZWFkZXIoaW5wdXQpO1xuICAgIGxldCBlbmQgPSBsZW5ndGggPT09IHVuZGVmaW5lZCA/IHJlYWRlci5sZW4gOiByZWFkZXIucG9zICsgbGVuZ3RoO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBjcmVhdGVCYXNlU2lnbmF0dXJlKCk7XG4gICAgd2hpbGUgKHJlYWRlci5wb3MgPCBlbmQpIHtcbiAgICAgIGNvbnN0IHRhZyA9IHJlYWRlci51aW50MzIoKTtcbiAgICAgIHN3aXRjaCAodGFnID4+PiAzKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBtZXNzYWdlLmVjZHNhQ29tcGFjdCA9IFNpZ25hdHVyZV9FQ0RTQUNvbXBhY3QuZGVjb2RlKFxuICAgICAgICAgICAgcmVhZGVyLFxuICAgICAgICAgICAgcmVhZGVyLnVpbnQzMigpXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZWFkZXIuc2tpcFR5cGUodGFnICYgNyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlO1xuICB9LFxuXG4gIGZyb21KU09OKG9iamVjdDogYW55KTogU2lnbmF0dXJlIHtcbiAgICByZXR1cm4ge1xuICAgICAgZWNkc2FDb21wYWN0OiBpc1NldChvYmplY3QuZWNkc2FDb21wYWN0KVxuICAgICAgICA/IFNpZ25hdHVyZV9FQ0RTQUNvbXBhY3QuZnJvbUpTT04ob2JqZWN0LmVjZHNhQ29tcGFjdClcbiAgICAgICAgOiB1bmRlZmluZWRcbiAgICB9O1xuICB9LFxuXG4gIHRvSlNPTihtZXNzYWdlOiBTaWduYXR1cmUpOiB1bmtub3duIHtcbiAgICBjb25zdCBvYmo6IGFueSA9IHt9O1xuICAgIG1lc3NhZ2UuZWNkc2FDb21wYWN0ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIChvYmouZWNkc2FDb21wYWN0ID0gbWVzc2FnZS5lY2RzYUNvbXBhY3RcbiAgICAgICAgPyBTaWduYXR1cmVfRUNEU0FDb21wYWN0LnRvSlNPTihtZXNzYWdlLmVjZHNhQ29tcGFjdClcbiAgICAgICAgOiB1bmRlZmluZWQpO1xuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgZnJvbVBhcnRpYWw8SSBleHRlbmRzIEV4YWN0PERlZXBQYXJ0aWFsPFNpZ25hdHVyZT4sIEk+PihcbiAgICBvYmplY3Q6IElcbiAgKTogU2lnbmF0dXJlIHtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZVNpZ25hdHVyZSgpO1xuICAgIG1lc3NhZ2UuZWNkc2FDb21wYWN0ID1cbiAgICAgIG9iamVjdC5lY2RzYUNvbXBhY3QgIT09IHVuZGVmaW5lZCAmJiBvYmplY3QuZWNkc2FDb21wYWN0ICE9PSBudWxsXG4gICAgICAgID8gU2lnbmF0dXJlX0VDRFNBQ29tcGFjdC5mcm9tUGFydGlhbChvYmplY3QuZWNkc2FDb21wYWN0KVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfVxufTtcblxuZnVuY3Rpb24gY3JlYXRlQmFzZVNpZ25hdHVyZV9FQ0RTQUNvbXBhY3QoKTogU2lnbmF0dXJlX0VDRFNBQ29tcGFjdCB7XG4gIHJldHVybiB7IGJ5dGVzOiBuZXcgVWludDhBcnJheSgpLCByZWNvdmVyeTogMCB9O1xufVxuXG5leHBvcnQgY29uc3QgU2lnbmF0dXJlX0VDRFNBQ29tcGFjdCA9IHtcbiAgZW5jb2RlKFxuICAgIG1lc3NhZ2U6IFNpZ25hdHVyZV9FQ0RTQUNvbXBhY3QsXG4gICAgd3JpdGVyOiBfbTAuV3JpdGVyID0gX20wLldyaXRlci5jcmVhdGUoKVxuICApOiBfbTAuV3JpdGVyIHtcbiAgICBpZiAobWVzc2FnZS5ieXRlcy5sZW5ndGggIT09IDApIHtcbiAgICAgIHdyaXRlci51aW50MzIoMTApLmJ5dGVzKG1lc3NhZ2UuYnl0ZXMpO1xuICAgIH1cbiAgICBpZiAobWVzc2FnZS5yZWNvdmVyeSAhPT0gMCkge1xuICAgICAgd3JpdGVyLnVpbnQzMigxNikudWludDMyKG1lc3NhZ2UucmVjb3ZlcnkpO1xuICAgIH1cbiAgICByZXR1cm4gd3JpdGVyO1xuICB9LFxuXG4gIGRlY29kZShcbiAgICBpbnB1dDogX20wLlJlYWRlciB8IFVpbnQ4QXJyYXksXG4gICAgbGVuZ3RoPzogbnVtYmVyXG4gICk6IFNpZ25hdHVyZV9FQ0RTQUNvbXBhY3Qge1xuICAgIGNvbnN0IHJlYWRlciA9IGlucHV0IGluc3RhbmNlb2YgX20wLlJlYWRlciA/IGlucHV0IDogbmV3IF9tMC5SZWFkZXIoaW5wdXQpO1xuICAgIGxldCBlbmQgPSBsZW5ndGggPT09IHVuZGVmaW5lZCA/IHJlYWRlci5sZW4gOiByZWFkZXIucG9zICsgbGVuZ3RoO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBjcmVhdGVCYXNlU2lnbmF0dXJlX0VDRFNBQ29tcGFjdCgpO1xuICAgIHdoaWxlIChyZWFkZXIucG9zIDwgZW5kKSB7XG4gICAgICBjb25zdCB0YWcgPSByZWFkZXIudWludDMyKCk7XG4gICAgICBzd2l0Y2ggKHRhZyA+Pj4gMykge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgbWVzc2FnZS5ieXRlcyA9IHJlYWRlci5ieXRlcygpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgbWVzc2FnZS5yZWNvdmVyeSA9IHJlYWRlci51aW50MzIoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZWFkZXIuc2tpcFR5cGUodGFnICYgNyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlO1xuICB9LFxuXG4gIGZyb21KU09OKG9iamVjdDogYW55KTogU2lnbmF0dXJlX0VDRFNBQ29tcGFjdCB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJ5dGVzOiBpc1NldChvYmplY3QuYnl0ZXMpXG4gICAgICAgID8gYnl0ZXNGcm9tQmFzZTY0KG9iamVjdC5ieXRlcylcbiAgICAgICAgOiBuZXcgVWludDhBcnJheSgpLFxuICAgICAgcmVjb3Zlcnk6IGlzU2V0KG9iamVjdC5yZWNvdmVyeSkgPyBOdW1iZXIob2JqZWN0LnJlY292ZXJ5KSA6IDBcbiAgICB9O1xuICB9LFxuXG4gIHRvSlNPTihtZXNzYWdlOiBTaWduYXR1cmVfRUNEU0FDb21wYWN0KTogdW5rbm93biB7XG4gICAgY29uc3Qgb2JqOiBhbnkgPSB7fTtcbiAgICBtZXNzYWdlLmJ5dGVzICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIChvYmouYnl0ZXMgPSBiYXNlNjRGcm9tQnl0ZXMoXG4gICAgICAgIG1lc3NhZ2UuYnl0ZXMgIT09IHVuZGVmaW5lZCA/IG1lc3NhZ2UuYnl0ZXMgOiBuZXcgVWludDhBcnJheSgpXG4gICAgICApKTtcbiAgICBtZXNzYWdlLnJlY292ZXJ5ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIChvYmoucmVjb3ZlcnkgPSBNYXRoLnJvdW5kKG1lc3NhZ2UucmVjb3ZlcnkpKTtcbiAgICByZXR1cm4gb2JqO1xuICB9LFxuXG4gIGZyb21QYXJ0aWFsPEkgZXh0ZW5kcyBFeGFjdDxEZWVwUGFydGlhbDxTaWduYXR1cmVfRUNEU0FDb21wYWN0PiwgST4+KFxuICAgIG9iamVjdDogSVxuICApOiBTaWduYXR1cmVfRUNEU0FDb21wYWN0IHtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZVNpZ25hdHVyZV9FQ0RTQUNvbXBhY3QoKTtcbiAgICBtZXNzYWdlLmJ5dGVzID0gb2JqZWN0LmJ5dGVzID8/IG5ldyBVaW50OEFycmF5KCk7XG4gICAgbWVzc2FnZS5yZWNvdmVyeSA9IG9iamVjdC5yZWNvdmVyeSA/PyAwO1xuICAgIHJldHVybiBtZXNzYWdlO1xuICB9XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVCYXNlUHVibGljS2V5KCk6IFB1YmxpY0tleSB7XG4gIHJldHVybiB7IHNlY3AyNTZrMVVuY29tcHJlc3NlZDogdW5kZWZpbmVkLCBzaWduYXR1cmU6IHVuZGVmaW5lZCB9O1xufVxuXG5leHBvcnQgY29uc3QgUHVibGljS2V5ID0ge1xuICBlbmNvZGUoXG4gICAgbWVzc2FnZTogUHVibGljS2V5LFxuICAgIHdyaXRlcjogX20wLldyaXRlciA9IF9tMC5Xcml0ZXIuY3JlYXRlKClcbiAgKTogX20wLldyaXRlciB7XG4gICAgaWYgKG1lc3NhZ2Uuc2VjcDI1NmsxVW5jb21wcmVzc2VkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIFB1YmxpY0tleV9TZWNwMjU2azFVbmNvbXByZXNlZC5lbmNvZGUoXG4gICAgICAgIG1lc3NhZ2Uuc2VjcDI1NmsxVW5jb21wcmVzc2VkLFxuICAgICAgICB3cml0ZXIudWludDMyKDEwKS5mb3JrKClcbiAgICAgICkubGRlbGltKCk7XG4gICAgfVxuICAgIGlmIChtZXNzYWdlLnNpZ25hdHVyZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBTaWduYXR1cmUuZW5jb2RlKG1lc3NhZ2Uuc2lnbmF0dXJlLCB3cml0ZXIudWludDMyKDE4KS5mb3JrKCkpLmxkZWxpbSgpO1xuICAgIH1cbiAgICByZXR1cm4gd3JpdGVyO1xuICB9LFxuXG4gIGRlY29kZShpbnB1dDogX20wLlJlYWRlciB8IFVpbnQ4QXJyYXksIGxlbmd0aD86IG51bWJlcik6IFB1YmxpY0tleSB7XG4gICAgY29uc3QgcmVhZGVyID0gaW5wdXQgaW5zdGFuY2VvZiBfbTAuUmVhZGVyID8gaW5wdXQgOiBuZXcgX20wLlJlYWRlcihpbnB1dCk7XG4gICAgbGV0IGVuZCA9IGxlbmd0aCA9PT0gdW5kZWZpbmVkID8gcmVhZGVyLmxlbiA6IHJlYWRlci5wb3MgKyBsZW5ndGg7XG4gICAgY29uc3QgbWVzc2FnZSA9IGNyZWF0ZUJhc2VQdWJsaWNLZXkoKTtcbiAgICB3aGlsZSAocmVhZGVyLnBvcyA8IGVuZCkge1xuICAgICAgY29uc3QgdGFnID0gcmVhZGVyLnVpbnQzMigpO1xuICAgICAgc3dpdGNoICh0YWcgPj4+IDMpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIG1lc3NhZ2Uuc2VjcDI1NmsxVW5jb21wcmVzc2VkID0gUHVibGljS2V5X1NlY3AyNTZrMVVuY29tcHJlc2VkLmRlY29kZShcbiAgICAgICAgICAgIHJlYWRlcixcbiAgICAgICAgICAgIHJlYWRlci51aW50MzIoKVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBtZXNzYWdlLnNpZ25hdHVyZSA9IFNpZ25hdHVyZS5kZWNvZGUocmVhZGVyLCByZWFkZXIudWludDMyKCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJlYWRlci5za2lwVHlwZSh0YWcgJiA3KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH0sXG5cbiAgZnJvbUpTT04ob2JqZWN0OiBhbnkpOiBQdWJsaWNLZXkge1xuICAgIHJldHVybiB7XG4gICAgICBzZWNwMjU2azFVbmNvbXByZXNzZWQ6IGlzU2V0KG9iamVjdC5zZWNwMjU2azFVbmNvbXByZXNzZWQpXG4gICAgICAgID8gUHVibGljS2V5X1NlY3AyNTZrMVVuY29tcHJlc2VkLmZyb21KU09OKG9iamVjdC5zZWNwMjU2azFVbmNvbXByZXNzZWQpXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgc2lnbmF0dXJlOiBpc1NldChvYmplY3Quc2lnbmF0dXJlKVxuICAgICAgICA/IFNpZ25hdHVyZS5mcm9tSlNPTihvYmplY3Quc2lnbmF0dXJlKVxuICAgICAgICA6IHVuZGVmaW5lZFxuICAgIH07XG4gIH0sXG5cbiAgdG9KU09OKG1lc3NhZ2U6IFB1YmxpY0tleSk6IHVua25vd24ge1xuICAgIGNvbnN0IG9iajogYW55ID0ge307XG4gICAgbWVzc2FnZS5zZWNwMjU2azFVbmNvbXByZXNzZWQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgKG9iai5zZWNwMjU2azFVbmNvbXByZXNzZWQgPSBtZXNzYWdlLnNlY3AyNTZrMVVuY29tcHJlc3NlZFxuICAgICAgICA/IFB1YmxpY0tleV9TZWNwMjU2azFVbmNvbXByZXNlZC50b0pTT04obWVzc2FnZS5zZWNwMjU2azFVbmNvbXByZXNzZWQpXG4gICAgICAgIDogdW5kZWZpbmVkKTtcbiAgICBtZXNzYWdlLnNpZ25hdHVyZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAob2JqLnNpZ25hdHVyZSA9IG1lc3NhZ2Uuc2lnbmF0dXJlXG4gICAgICAgID8gU2lnbmF0dXJlLnRvSlNPTihtZXNzYWdlLnNpZ25hdHVyZSlcbiAgICAgICAgOiB1bmRlZmluZWQpO1xuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgZnJvbVBhcnRpYWw8SSBleHRlbmRzIEV4YWN0PERlZXBQYXJ0aWFsPFB1YmxpY0tleT4sIEk+PihcbiAgICBvYmplY3Q6IElcbiAgKTogUHVibGljS2V5IHtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZVB1YmxpY0tleSgpO1xuICAgIG1lc3NhZ2Uuc2VjcDI1NmsxVW5jb21wcmVzc2VkID1cbiAgICAgIG9iamVjdC5zZWNwMjU2azFVbmNvbXByZXNzZWQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgb2JqZWN0LnNlY3AyNTZrMVVuY29tcHJlc3NlZCAhPT0gbnVsbFxuICAgICAgICA/IFB1YmxpY0tleV9TZWNwMjU2azFVbmNvbXByZXNlZC5mcm9tUGFydGlhbChcbiAgICAgICAgICAgIG9iamVjdC5zZWNwMjU2azFVbmNvbXByZXNzZWRcbiAgICAgICAgICApXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIG1lc3NhZ2Uuc2lnbmF0dXJlID1cbiAgICAgIG9iamVjdC5zaWduYXR1cmUgIT09IHVuZGVmaW5lZCAmJiBvYmplY3Quc2lnbmF0dXJlICE9PSBudWxsXG4gICAgICAgID8gU2lnbmF0dXJlLmZyb21QYXJ0aWFsKG9iamVjdC5zaWduYXR1cmUpXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIHJldHVybiBtZXNzYWdlO1xuICB9XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVCYXNlUHVibGljS2V5X1NlY3AyNTZrMVVuY29tcHJlc2VkKCk6IFB1YmxpY0tleV9TZWNwMjU2azFVbmNvbXByZXNlZCB7XG4gIHJldHVybiB7IGJ5dGVzOiBuZXcgVWludDhBcnJheSgpIH07XG59XG5cbmV4cG9ydCBjb25zdCBQdWJsaWNLZXlfU2VjcDI1NmsxVW5jb21wcmVzZWQgPSB7XG4gIGVuY29kZShcbiAgICBtZXNzYWdlOiBQdWJsaWNLZXlfU2VjcDI1NmsxVW5jb21wcmVzZWQsXG4gICAgd3JpdGVyOiBfbTAuV3JpdGVyID0gX20wLldyaXRlci5jcmVhdGUoKVxuICApOiBfbTAuV3JpdGVyIHtcbiAgICBpZiAobWVzc2FnZS5ieXRlcy5sZW5ndGggIT09IDApIHtcbiAgICAgIHdyaXRlci51aW50MzIoMTApLmJ5dGVzKG1lc3NhZ2UuYnl0ZXMpO1xuICAgIH1cbiAgICByZXR1cm4gd3JpdGVyO1xuICB9LFxuXG4gIGRlY29kZShcbiAgICBpbnB1dDogX20wLlJlYWRlciB8IFVpbnQ4QXJyYXksXG4gICAgbGVuZ3RoPzogbnVtYmVyXG4gICk6IFB1YmxpY0tleV9TZWNwMjU2azFVbmNvbXByZXNlZCB7XG4gICAgY29uc3QgcmVhZGVyID0gaW5wdXQgaW5zdGFuY2VvZiBfbTAuUmVhZGVyID8gaW5wdXQgOiBuZXcgX20wLlJlYWRlcihpbnB1dCk7XG4gICAgbGV0IGVuZCA9IGxlbmd0aCA9PT0gdW5kZWZpbmVkID8gcmVhZGVyLmxlbiA6IHJlYWRlci5wb3MgKyBsZW5ndGg7XG4gICAgY29uc3QgbWVzc2FnZSA9IGNyZWF0ZUJhc2VQdWJsaWNLZXlfU2VjcDI1NmsxVW5jb21wcmVzZWQoKTtcbiAgICB3aGlsZSAocmVhZGVyLnBvcyA8IGVuZCkge1xuICAgICAgY29uc3QgdGFnID0gcmVhZGVyLnVpbnQzMigpO1xuICAgICAgc3dpdGNoICh0YWcgPj4+IDMpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIG1lc3NhZ2UuYnl0ZXMgPSByZWFkZXIuYnl0ZXMoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZWFkZXIuc2tpcFR5cGUodGFnICYgNyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlO1xuICB9LFxuXG4gIGZyb21KU09OKG9iamVjdDogYW55KTogUHVibGljS2V5X1NlY3AyNTZrMVVuY29tcHJlc2VkIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnl0ZXM6IGlzU2V0KG9iamVjdC5ieXRlcylcbiAgICAgICAgPyBieXRlc0Zyb21CYXNlNjQob2JqZWN0LmJ5dGVzKVxuICAgICAgICA6IG5ldyBVaW50OEFycmF5KClcbiAgICB9O1xuICB9LFxuXG4gIHRvSlNPTihtZXNzYWdlOiBQdWJsaWNLZXlfU2VjcDI1NmsxVW5jb21wcmVzZWQpOiB1bmtub3duIHtcbiAgICBjb25zdCBvYmo6IGFueSA9IHt9O1xuICAgIG1lc3NhZ2UuYnl0ZXMgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgKG9iai5ieXRlcyA9IGJhc2U2NEZyb21CeXRlcyhcbiAgICAgICAgbWVzc2FnZS5ieXRlcyAhPT0gdW5kZWZpbmVkID8gbWVzc2FnZS5ieXRlcyA6IG5ldyBVaW50OEFycmF5KClcbiAgICAgICkpO1xuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgZnJvbVBhcnRpYWw8SSBleHRlbmRzIEV4YWN0PERlZXBQYXJ0aWFsPFB1YmxpY0tleV9TZWNwMjU2azFVbmNvbXByZXNlZD4sIEk+PihcbiAgICBvYmplY3Q6IElcbiAgKTogUHVibGljS2V5X1NlY3AyNTZrMVVuY29tcHJlc2VkIHtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZVB1YmxpY0tleV9TZWNwMjU2azFVbmNvbXByZXNlZCgpO1xuICAgIG1lc3NhZ2UuYnl0ZXMgPSBvYmplY3QuYnl0ZXMgPz8gbmV3IFVpbnQ4QXJyYXkoKTtcbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfVxufTtcblxuZnVuY3Rpb24gY3JlYXRlQmFzZVByaXZhdGVLZXkoKTogUHJpdmF0ZUtleSB7XG4gIHJldHVybiB7IHNlY3AyNTZrMTogdW5kZWZpbmVkIH07XG59XG5cbmV4cG9ydCBjb25zdCBQcml2YXRlS2V5ID0ge1xuICBlbmNvZGUoXG4gICAgbWVzc2FnZTogUHJpdmF0ZUtleSxcbiAgICB3cml0ZXI6IF9tMC5Xcml0ZXIgPSBfbTAuV3JpdGVyLmNyZWF0ZSgpXG4gICk6IF9tMC5Xcml0ZXIge1xuICAgIGlmIChtZXNzYWdlLnNlY3AyNTZrMSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBQcml2YXRlS2V5X1NlY3AyNTZrMS5lbmNvZGUoXG4gICAgICAgIG1lc3NhZ2Uuc2VjcDI1NmsxLFxuICAgICAgICB3cml0ZXIudWludDMyKDEwKS5mb3JrKClcbiAgICAgICkubGRlbGltKCk7XG4gICAgfVxuICAgIHJldHVybiB3cml0ZXI7XG4gIH0sXG5cbiAgZGVjb2RlKGlucHV0OiBfbTAuUmVhZGVyIHwgVWludDhBcnJheSwgbGVuZ3RoPzogbnVtYmVyKTogUHJpdmF0ZUtleSB7XG4gICAgY29uc3QgcmVhZGVyID0gaW5wdXQgaW5zdGFuY2VvZiBfbTAuUmVhZGVyID8gaW5wdXQgOiBuZXcgX20wLlJlYWRlcihpbnB1dCk7XG4gICAgbGV0IGVuZCA9IGxlbmd0aCA9PT0gdW5kZWZpbmVkID8gcmVhZGVyLmxlbiA6IHJlYWRlci5wb3MgKyBsZW5ndGg7XG4gICAgY29uc3QgbWVzc2FnZSA9IGNyZWF0ZUJhc2VQcml2YXRlS2V5KCk7XG4gICAgd2hpbGUgKHJlYWRlci5wb3MgPCBlbmQpIHtcbiAgICAgIGNvbnN0IHRhZyA9IHJlYWRlci51aW50MzIoKTtcbiAgICAgIHN3aXRjaCAodGFnID4+PiAzKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBtZXNzYWdlLnNlY3AyNTZrMSA9IFByaXZhdGVLZXlfU2VjcDI1NmsxLmRlY29kZShcbiAgICAgICAgICAgIHJlYWRlcixcbiAgICAgICAgICAgIHJlYWRlci51aW50MzIoKVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmVhZGVyLnNraXBUeXBlKHRhZyAmIDcpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfSxcblxuICBmcm9tSlNPTihvYmplY3Q6IGFueSk6IFByaXZhdGVLZXkge1xuICAgIHJldHVybiB7XG4gICAgICBzZWNwMjU2azE6IGlzU2V0KG9iamVjdC5zZWNwMjU2azEpXG4gICAgICAgID8gUHJpdmF0ZUtleV9TZWNwMjU2azEuZnJvbUpTT04ob2JqZWN0LnNlY3AyNTZrMSlcbiAgICAgICAgOiB1bmRlZmluZWRcbiAgICB9O1xuICB9LFxuXG4gIHRvSlNPTihtZXNzYWdlOiBQcml2YXRlS2V5KTogdW5rbm93biB7XG4gICAgY29uc3Qgb2JqOiBhbnkgPSB7fTtcbiAgICBtZXNzYWdlLnNlY3AyNTZrMSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAob2JqLnNlY3AyNTZrMSA9IG1lc3NhZ2Uuc2VjcDI1NmsxXG4gICAgICAgID8gUHJpdmF0ZUtleV9TZWNwMjU2azEudG9KU09OKG1lc3NhZ2Uuc2VjcDI1NmsxKVxuICAgICAgICA6IHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIG9iajtcbiAgfSxcblxuICBmcm9tUGFydGlhbDxJIGV4dGVuZHMgRXhhY3Q8RGVlcFBhcnRpYWw8UHJpdmF0ZUtleT4sIEk+PihcbiAgICBvYmplY3Q6IElcbiAgKTogUHJpdmF0ZUtleSB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGNyZWF0ZUJhc2VQcml2YXRlS2V5KCk7XG4gICAgbWVzc2FnZS5zZWNwMjU2azEgPVxuICAgICAgb2JqZWN0LnNlY3AyNTZrMSAhPT0gdW5kZWZpbmVkICYmIG9iamVjdC5zZWNwMjU2azEgIT09IG51bGxcbiAgICAgICAgPyBQcml2YXRlS2V5X1NlY3AyNTZrMS5mcm9tUGFydGlhbChvYmplY3Quc2VjcDI1NmsxKVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfVxufTtcblxuZnVuY3Rpb24gY3JlYXRlQmFzZVByaXZhdGVLZXlfU2VjcDI1NmsxKCk6IFByaXZhdGVLZXlfU2VjcDI1NmsxIHtcbiAgcmV0dXJuIHsgYnl0ZXM6IG5ldyBVaW50OEFycmF5KCkgfTtcbn1cblxuZXhwb3J0IGNvbnN0IFByaXZhdGVLZXlfU2VjcDI1NmsxID0ge1xuICBlbmNvZGUoXG4gICAgbWVzc2FnZTogUHJpdmF0ZUtleV9TZWNwMjU2azEsXG4gICAgd3JpdGVyOiBfbTAuV3JpdGVyID0gX20wLldyaXRlci5jcmVhdGUoKVxuICApOiBfbTAuV3JpdGVyIHtcbiAgICBpZiAobWVzc2FnZS5ieXRlcy5sZW5ndGggIT09IDApIHtcbiAgICAgIHdyaXRlci51aW50MzIoMTApLmJ5dGVzKG1lc3NhZ2UuYnl0ZXMpO1xuICAgIH1cbiAgICByZXR1cm4gd3JpdGVyO1xuICB9LFxuXG4gIGRlY29kZShcbiAgICBpbnB1dDogX20wLlJlYWRlciB8IFVpbnQ4QXJyYXksXG4gICAgbGVuZ3RoPzogbnVtYmVyXG4gICk6IFByaXZhdGVLZXlfU2VjcDI1NmsxIHtcbiAgICBjb25zdCByZWFkZXIgPSBpbnB1dCBpbnN0YW5jZW9mIF9tMC5SZWFkZXIgPyBpbnB1dCA6IG5ldyBfbTAuUmVhZGVyKGlucHV0KTtcbiAgICBsZXQgZW5kID0gbGVuZ3RoID09PSB1bmRlZmluZWQgPyByZWFkZXIubGVuIDogcmVhZGVyLnBvcyArIGxlbmd0aDtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZVByaXZhdGVLZXlfU2VjcDI1NmsxKCk7XG4gICAgd2hpbGUgKHJlYWRlci5wb3MgPCBlbmQpIHtcbiAgICAgIGNvbnN0IHRhZyA9IHJlYWRlci51aW50MzIoKTtcbiAgICAgIHN3aXRjaCAodGFnID4+PiAzKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBtZXNzYWdlLmJ5dGVzID0gcmVhZGVyLmJ5dGVzKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmVhZGVyLnNraXBUeXBlKHRhZyAmIDcpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfSxcblxuICBmcm9tSlNPTihvYmplY3Q6IGFueSk6IFByaXZhdGVLZXlfU2VjcDI1NmsxIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnl0ZXM6IGlzU2V0KG9iamVjdC5ieXRlcylcbiAgICAgICAgPyBieXRlc0Zyb21CYXNlNjQob2JqZWN0LmJ5dGVzKVxuICAgICAgICA6IG5ldyBVaW50OEFycmF5KClcbiAgICB9O1xuICB9LFxuXG4gIHRvSlNPTihtZXNzYWdlOiBQcml2YXRlS2V5X1NlY3AyNTZrMSk6IHVua25vd24ge1xuICAgIGNvbnN0IG9iajogYW55ID0ge307XG4gICAgbWVzc2FnZS5ieXRlcyAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAob2JqLmJ5dGVzID0gYmFzZTY0RnJvbUJ5dGVzKFxuICAgICAgICBtZXNzYWdlLmJ5dGVzICE9PSB1bmRlZmluZWQgPyBtZXNzYWdlLmJ5dGVzIDogbmV3IFVpbnQ4QXJyYXkoKVxuICAgICAgKSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfSxcblxuICBmcm9tUGFydGlhbDxJIGV4dGVuZHMgRXhhY3Q8RGVlcFBhcnRpYWw8UHJpdmF0ZUtleV9TZWNwMjU2azE+LCBJPj4oXG4gICAgb2JqZWN0OiBJXG4gICk6IFByaXZhdGVLZXlfU2VjcDI1NmsxIHtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZVByaXZhdGVLZXlfU2VjcDI1NmsxKCk7XG4gICAgbWVzc2FnZS5ieXRlcyA9IG9iamVjdC5ieXRlcyA/PyBuZXcgVWludDhBcnJheSgpO1xuICAgIHJldHVybiBtZXNzYWdlO1xuICB9XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVCYXNlQ2lwaGVydGV4dCgpOiBDaXBoZXJ0ZXh0IHtcbiAgcmV0dXJuIHsgYWVzMjU2R2NtSGtkZlNoYTI1NjogdW5kZWZpbmVkIH07XG59XG5cbmV4cG9ydCBjb25zdCBDaXBoZXJ0ZXh0ID0ge1xuICBlbmNvZGUoXG4gICAgbWVzc2FnZTogQ2lwaGVydGV4dCxcbiAgICB3cml0ZXI6IF9tMC5Xcml0ZXIgPSBfbTAuV3JpdGVyLmNyZWF0ZSgpXG4gICk6IF9tMC5Xcml0ZXIge1xuICAgIGlmIChtZXNzYWdlLmFlczI1NkdjbUhrZGZTaGEyNTYgIT09IHVuZGVmaW5lZCkge1xuICAgICAgQ2lwaGVydGV4dF9BZXMyNTZnY21Ia2Rmc2hhMjU2LmVuY29kZShcbiAgICAgICAgbWVzc2FnZS5hZXMyNTZHY21Ia2RmU2hhMjU2LFxuICAgICAgICB3cml0ZXIudWludDMyKDEwKS5mb3JrKClcbiAgICAgICkubGRlbGltKCk7XG4gICAgfVxuICAgIHJldHVybiB3cml0ZXI7XG4gIH0sXG5cbiAgZGVjb2RlKGlucHV0OiBfbTAuUmVhZGVyIHwgVWludDhBcnJheSwgbGVuZ3RoPzogbnVtYmVyKTogQ2lwaGVydGV4dCB7XG4gICAgY29uc3QgcmVhZGVyID0gaW5wdXQgaW5zdGFuY2VvZiBfbTAuUmVhZGVyID8gaW5wdXQgOiBuZXcgX20wLlJlYWRlcihpbnB1dCk7XG4gICAgbGV0IGVuZCA9IGxlbmd0aCA9PT0gdW5kZWZpbmVkID8gcmVhZGVyLmxlbiA6IHJlYWRlci5wb3MgKyBsZW5ndGg7XG4gICAgY29uc3QgbWVzc2FnZSA9IGNyZWF0ZUJhc2VDaXBoZXJ0ZXh0KCk7XG4gICAgd2hpbGUgKHJlYWRlci5wb3MgPCBlbmQpIHtcbiAgICAgIGNvbnN0IHRhZyA9IHJlYWRlci51aW50MzIoKTtcbiAgICAgIHN3aXRjaCAodGFnID4+PiAzKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBtZXNzYWdlLmFlczI1NkdjbUhrZGZTaGEyNTYgPSBDaXBoZXJ0ZXh0X0FlczI1NmdjbUhrZGZzaGEyNTYuZGVjb2RlKFxuICAgICAgICAgICAgcmVhZGVyLFxuICAgICAgICAgICAgcmVhZGVyLnVpbnQzMigpXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZWFkZXIuc2tpcFR5cGUodGFnICYgNyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlO1xuICB9LFxuXG4gIGZyb21KU09OKG9iamVjdDogYW55KTogQ2lwaGVydGV4dCB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFlczI1NkdjbUhrZGZTaGEyNTY6IGlzU2V0KG9iamVjdC5hZXMyNTZHY21Ia2RmU2hhMjU2KVxuICAgICAgICA/IENpcGhlcnRleHRfQWVzMjU2Z2NtSGtkZnNoYTI1Ni5mcm9tSlNPTihvYmplY3QuYWVzMjU2R2NtSGtkZlNoYTI1NilcbiAgICAgICAgOiB1bmRlZmluZWRcbiAgICB9O1xuICB9LFxuXG4gIHRvSlNPTihtZXNzYWdlOiBDaXBoZXJ0ZXh0KTogdW5rbm93biB7XG4gICAgY29uc3Qgb2JqOiBhbnkgPSB7fTtcbiAgICBtZXNzYWdlLmFlczI1NkdjbUhrZGZTaGEyNTYgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgKG9iai5hZXMyNTZHY21Ia2RmU2hhMjU2ID0gbWVzc2FnZS5hZXMyNTZHY21Ia2RmU2hhMjU2XG4gICAgICAgID8gQ2lwaGVydGV4dF9BZXMyNTZnY21Ia2Rmc2hhMjU2LnRvSlNPTihtZXNzYWdlLmFlczI1NkdjbUhrZGZTaGEyNTYpXG4gICAgICAgIDogdW5kZWZpbmVkKTtcbiAgICByZXR1cm4gb2JqO1xuICB9LFxuXG4gIGZyb21QYXJ0aWFsPEkgZXh0ZW5kcyBFeGFjdDxEZWVwUGFydGlhbDxDaXBoZXJ0ZXh0PiwgST4+KFxuICAgIG9iamVjdDogSVxuICApOiBDaXBoZXJ0ZXh0IHtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZUNpcGhlcnRleHQoKTtcbiAgICBtZXNzYWdlLmFlczI1NkdjbUhrZGZTaGEyNTYgPVxuICAgICAgb2JqZWN0LmFlczI1NkdjbUhrZGZTaGEyNTYgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgb2JqZWN0LmFlczI1NkdjbUhrZGZTaGEyNTYgIT09IG51bGxcbiAgICAgICAgPyBDaXBoZXJ0ZXh0X0FlczI1NmdjbUhrZGZzaGEyNTYuZnJvbVBhcnRpYWwob2JqZWN0LmFlczI1NkdjbUhrZGZTaGEyNTYpXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIHJldHVybiBtZXNzYWdlO1xuICB9XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVCYXNlQ2lwaGVydGV4dF9BZXMyNTZnY21Ia2Rmc2hhMjU2KCk6IENpcGhlcnRleHRfQWVzMjU2Z2NtSGtkZnNoYTI1NiB7XG4gIHJldHVybiB7XG4gICAgaGtkZlNhbHQ6IG5ldyBVaW50OEFycmF5KCksXG4gICAgZ2NtTm9uY2U6IG5ldyBVaW50OEFycmF5KCksXG4gICAgcGF5bG9hZDogbmV3IFVpbnQ4QXJyYXkoKVxuICB9O1xufVxuXG5leHBvcnQgY29uc3QgQ2lwaGVydGV4dF9BZXMyNTZnY21Ia2Rmc2hhMjU2ID0ge1xuICBlbmNvZGUoXG4gICAgbWVzc2FnZTogQ2lwaGVydGV4dF9BZXMyNTZnY21Ia2Rmc2hhMjU2LFxuICAgIHdyaXRlcjogX20wLldyaXRlciA9IF9tMC5Xcml0ZXIuY3JlYXRlKClcbiAgKTogX20wLldyaXRlciB7XG4gICAgaWYgKG1lc3NhZ2UuaGtkZlNhbHQubGVuZ3RoICE9PSAwKSB7XG4gICAgICB3cml0ZXIudWludDMyKDEwKS5ieXRlcyhtZXNzYWdlLmhrZGZTYWx0KTtcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2UuZ2NtTm9uY2UubGVuZ3RoICE9PSAwKSB7XG4gICAgICB3cml0ZXIudWludDMyKDE4KS5ieXRlcyhtZXNzYWdlLmdjbU5vbmNlKTtcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2UucGF5bG9hZC5sZW5ndGggIT09IDApIHtcbiAgICAgIHdyaXRlci51aW50MzIoMjYpLmJ5dGVzKG1lc3NhZ2UucGF5bG9hZCk7XG4gICAgfVxuICAgIHJldHVybiB3cml0ZXI7XG4gIH0sXG5cbiAgZGVjb2RlKFxuICAgIGlucHV0OiBfbTAuUmVhZGVyIHwgVWludDhBcnJheSxcbiAgICBsZW5ndGg/OiBudW1iZXJcbiAgKTogQ2lwaGVydGV4dF9BZXMyNTZnY21Ia2Rmc2hhMjU2IHtcbiAgICBjb25zdCByZWFkZXIgPSBpbnB1dCBpbnN0YW5jZW9mIF9tMC5SZWFkZXIgPyBpbnB1dCA6IG5ldyBfbTAuUmVhZGVyKGlucHV0KTtcbiAgICBsZXQgZW5kID0gbGVuZ3RoID09PSB1bmRlZmluZWQgPyByZWFkZXIubGVuIDogcmVhZGVyLnBvcyArIGxlbmd0aDtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZUNpcGhlcnRleHRfQWVzMjU2Z2NtSGtkZnNoYTI1NigpO1xuICAgIHdoaWxlIChyZWFkZXIucG9zIDwgZW5kKSB7XG4gICAgICBjb25zdCB0YWcgPSByZWFkZXIudWludDMyKCk7XG4gICAgICBzd2l0Y2ggKHRhZyA+Pj4gMykge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgbWVzc2FnZS5oa2RmU2FsdCA9IHJlYWRlci5ieXRlcygpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgbWVzc2FnZS5nY21Ob25jZSA9IHJlYWRlci5ieXRlcygpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgbWVzc2FnZS5wYXlsb2FkID0gcmVhZGVyLmJ5dGVzKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmVhZGVyLnNraXBUeXBlKHRhZyAmIDcpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfSxcblxuICBmcm9tSlNPTihvYmplY3Q6IGFueSk6IENpcGhlcnRleHRfQWVzMjU2Z2NtSGtkZnNoYTI1NiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhrZGZTYWx0OiBpc1NldChvYmplY3QuaGtkZlNhbHQpXG4gICAgICAgID8gYnl0ZXNGcm9tQmFzZTY0KG9iamVjdC5oa2RmU2FsdClcbiAgICAgICAgOiBuZXcgVWludDhBcnJheSgpLFxuICAgICAgZ2NtTm9uY2U6IGlzU2V0KG9iamVjdC5nY21Ob25jZSlcbiAgICAgICAgPyBieXRlc0Zyb21CYXNlNjQob2JqZWN0LmdjbU5vbmNlKVxuICAgICAgICA6IG5ldyBVaW50OEFycmF5KCksXG4gICAgICBwYXlsb2FkOiBpc1NldChvYmplY3QucGF5bG9hZClcbiAgICAgICAgPyBieXRlc0Zyb21CYXNlNjQob2JqZWN0LnBheWxvYWQpXG4gICAgICAgIDogbmV3IFVpbnQ4QXJyYXkoKVxuICAgIH07XG4gIH0sXG5cbiAgdG9KU09OKG1lc3NhZ2U6IENpcGhlcnRleHRfQWVzMjU2Z2NtSGtkZnNoYTI1Nik6IHVua25vd24ge1xuICAgIGNvbnN0IG9iajogYW55ID0ge307XG4gICAgbWVzc2FnZS5oa2RmU2FsdCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAob2JqLmhrZGZTYWx0ID0gYmFzZTY0RnJvbUJ5dGVzKFxuICAgICAgICBtZXNzYWdlLmhrZGZTYWx0ICE9PSB1bmRlZmluZWQgPyBtZXNzYWdlLmhrZGZTYWx0IDogbmV3IFVpbnQ4QXJyYXkoKVxuICAgICAgKSk7XG4gICAgbWVzc2FnZS5nY21Ob25jZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAob2JqLmdjbU5vbmNlID0gYmFzZTY0RnJvbUJ5dGVzKFxuICAgICAgICBtZXNzYWdlLmdjbU5vbmNlICE9PSB1bmRlZmluZWQgPyBtZXNzYWdlLmdjbU5vbmNlIDogbmV3IFVpbnQ4QXJyYXkoKVxuICAgICAgKSk7XG4gICAgbWVzc2FnZS5wYXlsb2FkICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIChvYmoucGF5bG9hZCA9IGJhc2U2NEZyb21CeXRlcyhcbiAgICAgICAgbWVzc2FnZS5wYXlsb2FkICE9PSB1bmRlZmluZWQgPyBtZXNzYWdlLnBheWxvYWQgOiBuZXcgVWludDhBcnJheSgpXG4gICAgICApKTtcbiAgICByZXR1cm4gb2JqO1xuICB9LFxuXG4gIGZyb21QYXJ0aWFsPEkgZXh0ZW5kcyBFeGFjdDxEZWVwUGFydGlhbDxDaXBoZXJ0ZXh0X0FlczI1NmdjbUhrZGZzaGEyNTY+LCBJPj4oXG4gICAgb2JqZWN0OiBJXG4gICk6IENpcGhlcnRleHRfQWVzMjU2Z2NtSGtkZnNoYTI1NiB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGNyZWF0ZUJhc2VDaXBoZXJ0ZXh0X0FlczI1NmdjbUhrZGZzaGEyNTYoKTtcbiAgICBtZXNzYWdlLmhrZGZTYWx0ID0gb2JqZWN0LmhrZGZTYWx0ID8/IG5ldyBVaW50OEFycmF5KCk7XG4gICAgbWVzc2FnZS5nY21Ob25jZSA9IG9iamVjdC5nY21Ob25jZSA/PyBuZXcgVWludDhBcnJheSgpO1xuICAgIG1lc3NhZ2UucGF5bG9hZCA9IG9iamVjdC5wYXlsb2FkID8/IG5ldyBVaW50OEFycmF5KCk7XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUJhc2VQdWJsaWNLZXlCdW5kbGUoKTogUHVibGljS2V5QnVuZGxlIHtcbiAgcmV0dXJuIHsgaWRlbnRpdHlLZXk6IHVuZGVmaW5lZCwgcHJlS2V5OiB1bmRlZmluZWQgfTtcbn1cblxuZXhwb3J0IGNvbnN0IFB1YmxpY0tleUJ1bmRsZSA9IHtcbiAgZW5jb2RlKFxuICAgIG1lc3NhZ2U6IFB1YmxpY0tleUJ1bmRsZSxcbiAgICB3cml0ZXI6IF9tMC5Xcml0ZXIgPSBfbTAuV3JpdGVyLmNyZWF0ZSgpXG4gICk6IF9tMC5Xcml0ZXIge1xuICAgIGlmIChtZXNzYWdlLmlkZW50aXR5S2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIFB1YmxpY0tleS5lbmNvZGUobWVzc2FnZS5pZGVudGl0eUtleSwgd3JpdGVyLnVpbnQzMigxMCkuZm9yaygpKS5sZGVsaW0oKTtcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2UucHJlS2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIFB1YmxpY0tleS5lbmNvZGUobWVzc2FnZS5wcmVLZXksIHdyaXRlci51aW50MzIoMTgpLmZvcmsoKSkubGRlbGltKCk7XG4gICAgfVxuICAgIHJldHVybiB3cml0ZXI7XG4gIH0sXG5cbiAgZGVjb2RlKGlucHV0OiBfbTAuUmVhZGVyIHwgVWludDhBcnJheSwgbGVuZ3RoPzogbnVtYmVyKTogUHVibGljS2V5QnVuZGxlIHtcbiAgICBjb25zdCByZWFkZXIgPSBpbnB1dCBpbnN0YW5jZW9mIF9tMC5SZWFkZXIgPyBpbnB1dCA6IG5ldyBfbTAuUmVhZGVyKGlucHV0KTtcbiAgICBsZXQgZW5kID0gbGVuZ3RoID09PSB1bmRlZmluZWQgPyByZWFkZXIubGVuIDogcmVhZGVyLnBvcyArIGxlbmd0aDtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZVB1YmxpY0tleUJ1bmRsZSgpO1xuICAgIHdoaWxlIChyZWFkZXIucG9zIDwgZW5kKSB7XG4gICAgICBjb25zdCB0YWcgPSByZWFkZXIudWludDMyKCk7XG4gICAgICBzd2l0Y2ggKHRhZyA+Pj4gMykge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgbWVzc2FnZS5pZGVudGl0eUtleSA9IFB1YmxpY0tleS5kZWNvZGUocmVhZGVyLCByZWFkZXIudWludDMyKCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgbWVzc2FnZS5wcmVLZXkgPSBQdWJsaWNLZXkuZGVjb2RlKHJlYWRlciwgcmVhZGVyLnVpbnQzMigpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZWFkZXIuc2tpcFR5cGUodGFnICYgNyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlO1xuICB9LFxuXG4gIGZyb21KU09OKG9iamVjdDogYW55KTogUHVibGljS2V5QnVuZGxlIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWRlbnRpdHlLZXk6IGlzU2V0KG9iamVjdC5pZGVudGl0eUtleSlcbiAgICAgICAgPyBQdWJsaWNLZXkuZnJvbUpTT04ob2JqZWN0LmlkZW50aXR5S2V5KVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgIHByZUtleTogaXNTZXQob2JqZWN0LnByZUtleSlcbiAgICAgICAgPyBQdWJsaWNLZXkuZnJvbUpTT04ob2JqZWN0LnByZUtleSlcbiAgICAgICAgOiB1bmRlZmluZWRcbiAgICB9O1xuICB9LFxuXG4gIHRvSlNPTihtZXNzYWdlOiBQdWJsaWNLZXlCdW5kbGUpOiB1bmtub3duIHtcbiAgICBjb25zdCBvYmo6IGFueSA9IHt9O1xuICAgIG1lc3NhZ2UuaWRlbnRpdHlLZXkgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgKG9iai5pZGVudGl0eUtleSA9IG1lc3NhZ2UuaWRlbnRpdHlLZXlcbiAgICAgICAgPyBQdWJsaWNLZXkudG9KU09OKG1lc3NhZ2UuaWRlbnRpdHlLZXkpXG4gICAgICAgIDogdW5kZWZpbmVkKTtcbiAgICBtZXNzYWdlLnByZUtleSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAob2JqLnByZUtleSA9IG1lc3NhZ2UucHJlS2V5XG4gICAgICAgID8gUHVibGljS2V5LnRvSlNPTihtZXNzYWdlLnByZUtleSlcbiAgICAgICAgOiB1bmRlZmluZWQpO1xuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgZnJvbVBhcnRpYWw8SSBleHRlbmRzIEV4YWN0PERlZXBQYXJ0aWFsPFB1YmxpY0tleUJ1bmRsZT4sIEk+PihcbiAgICBvYmplY3Q6IElcbiAgKTogUHVibGljS2V5QnVuZGxlIHtcbiAgICBjb25zdCBtZXNzYWdlID0gY3JlYXRlQmFzZVB1YmxpY0tleUJ1bmRsZSgpO1xuICAgIG1lc3NhZ2UuaWRlbnRpdHlLZXkgPVxuICAgICAgb2JqZWN0LmlkZW50aXR5S2V5ICE9PSB1bmRlZmluZWQgJiYgb2JqZWN0LmlkZW50aXR5S2V5ICE9PSBudWxsXG4gICAgICAgID8gUHVibGljS2V5LmZyb21QYXJ0aWFsKG9iamVjdC5pZGVudGl0eUtleSlcbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgbWVzc2FnZS5wcmVLZXkgPVxuICAgICAgb2JqZWN0LnByZUtleSAhPT0gdW5kZWZpbmVkICYmIG9iamVjdC5wcmVLZXkgIT09IG51bGxcbiAgICAgICAgPyBQdWJsaWNLZXkuZnJvbVBhcnRpYWwob2JqZWN0LnByZUtleSlcbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUJhc2VNZXNzYWdlKCk6IE1lc3NhZ2Uge1xuICByZXR1cm4geyBoZWFkZXI6IHVuZGVmaW5lZCwgY2lwaGVydGV4dDogdW5kZWZpbmVkIH07XG59XG5cbmV4cG9ydCBjb25zdCBNZXNzYWdlID0ge1xuICBlbmNvZGUoXG4gICAgbWVzc2FnZTogTWVzc2FnZSxcbiAgICB3cml0ZXI6IF9tMC5Xcml0ZXIgPSBfbTAuV3JpdGVyLmNyZWF0ZSgpXG4gICk6IF9tMC5Xcml0ZXIge1xuICAgIGlmIChtZXNzYWdlLmhlYWRlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBNZXNzYWdlX0hlYWRlci5lbmNvZGUobWVzc2FnZS5oZWFkZXIsIHdyaXRlci51aW50MzIoMTApLmZvcmsoKSkubGRlbGltKCk7XG4gICAgfVxuICAgIGlmIChtZXNzYWdlLmNpcGhlcnRleHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgQ2lwaGVydGV4dC5lbmNvZGUobWVzc2FnZS5jaXBoZXJ0ZXh0LCB3cml0ZXIudWludDMyKDE4KS5mb3JrKCkpLmxkZWxpbSgpO1xuICAgIH1cbiAgICByZXR1cm4gd3JpdGVyO1xuICB9LFxuXG4gIGRlY29kZShpbnB1dDogX20wLlJlYWRlciB8IFVpbnQ4QXJyYXksIGxlbmd0aD86IG51bWJlcik6IE1lc3NhZ2Uge1xuICAgIGNvbnN0IHJlYWRlciA9IGlucHV0IGluc3RhbmNlb2YgX20wLlJlYWRlciA/IGlucHV0IDogbmV3IF9tMC5SZWFkZXIoaW5wdXQpO1xuICAgIGxldCBlbmQgPSBsZW5ndGggPT09IHVuZGVmaW5lZCA/IHJlYWRlci5sZW4gOiByZWFkZXIucG9zICsgbGVuZ3RoO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBjcmVhdGVCYXNlTWVzc2FnZSgpO1xuICAgIHdoaWxlIChyZWFkZXIucG9zIDwgZW5kKSB7XG4gICAgICBjb25zdCB0YWcgPSByZWFkZXIudWludDMyKCk7XG4gICAgICBzd2l0Y2ggKHRhZyA+Pj4gMykge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgbWVzc2FnZS5oZWFkZXIgPSBNZXNzYWdlX0hlYWRlci5kZWNvZGUocmVhZGVyLCByZWFkZXIudWludDMyKCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgbWVzc2FnZS5jaXBoZXJ0ZXh0ID0gQ2lwaGVydGV4dC5kZWNvZGUocmVhZGVyLCByZWFkZXIudWludDMyKCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJlYWRlci5za2lwVHlwZSh0YWcgJiA3KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH0sXG5cbiAgZnJvbUpTT04ob2JqZWN0OiBhbnkpOiBNZXNzYWdlIHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVhZGVyOiBpc1NldChvYmplY3QuaGVhZGVyKVxuICAgICAgICA/IE1lc3NhZ2VfSGVhZGVyLmZyb21KU09OKG9iamVjdC5oZWFkZXIpXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgY2lwaGVydGV4dDogaXNTZXQob2JqZWN0LmNpcGhlcnRleHQpXG4gICAgICAgID8gQ2lwaGVydGV4dC5mcm9tSlNPTihvYmplY3QuY2lwaGVydGV4dClcbiAgICAgICAgOiB1bmRlZmluZWRcbiAgICB9O1xuICB9LFxuXG4gIHRvSlNPTihtZXNzYWdlOiBNZXNzYWdlKTogdW5rbm93biB7XG4gICAgY29uc3Qgb2JqOiBhbnkgPSB7fTtcbiAgICBtZXNzYWdlLmhlYWRlciAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAob2JqLmhlYWRlciA9IG1lc3NhZ2UuaGVhZGVyXG4gICAgICAgID8gTWVzc2FnZV9IZWFkZXIudG9KU09OKG1lc3NhZ2UuaGVhZGVyKVxuICAgICAgICA6IHVuZGVmaW5lZCk7XG4gICAgbWVzc2FnZS5jaXBoZXJ0ZXh0ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIChvYmouY2lwaGVydGV4dCA9IG1lc3NhZ2UuY2lwaGVydGV4dFxuICAgICAgICA/IENpcGhlcnRleHQudG9KU09OKG1lc3NhZ2UuY2lwaGVydGV4dClcbiAgICAgICAgOiB1bmRlZmluZWQpO1xuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgZnJvbVBhcnRpYWw8SSBleHRlbmRzIEV4YWN0PERlZXBQYXJ0aWFsPE1lc3NhZ2U+LCBJPj4ob2JqZWN0OiBJKTogTWVzc2FnZSB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGNyZWF0ZUJhc2VNZXNzYWdlKCk7XG4gICAgbWVzc2FnZS5oZWFkZXIgPVxuICAgICAgb2JqZWN0LmhlYWRlciAhPT0gdW5kZWZpbmVkICYmIG9iamVjdC5oZWFkZXIgIT09IG51bGxcbiAgICAgICAgPyBNZXNzYWdlX0hlYWRlci5mcm9tUGFydGlhbChvYmplY3QuaGVhZGVyKVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBtZXNzYWdlLmNpcGhlcnRleHQgPVxuICAgICAgb2JqZWN0LmNpcGhlcnRleHQgIT09IHVuZGVmaW5lZCAmJiBvYmplY3QuY2lwaGVydGV4dCAhPT0gbnVsbFxuICAgICAgICA/IENpcGhlcnRleHQuZnJvbVBhcnRpYWwob2JqZWN0LmNpcGhlcnRleHQpXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIHJldHVybiBtZXNzYWdlO1xuICB9XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVCYXNlTWVzc2FnZV9IZWFkZXIoKTogTWVzc2FnZV9IZWFkZXIge1xuICByZXR1cm4geyBzZW5kZXI6IHVuZGVmaW5lZCwgcmVjaXBpZW50OiB1bmRlZmluZWQgfTtcbn1cblxuZXhwb3J0IGNvbnN0IE1lc3NhZ2VfSGVhZGVyID0ge1xuICBlbmNvZGUoXG4gICAgbWVzc2FnZTogTWVzc2FnZV9IZWFkZXIsXG4gICAgd3JpdGVyOiBfbTAuV3JpdGVyID0gX20wLldyaXRlci5jcmVhdGUoKVxuICApOiBfbTAuV3JpdGVyIHtcbiAgICBpZiAobWVzc2FnZS5zZW5kZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgUHVibGljS2V5QnVuZGxlLmVuY29kZShtZXNzYWdlLnNlbmRlciwgd3JpdGVyLnVpbnQzMigxMCkuZm9yaygpKS5sZGVsaW0oKTtcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2UucmVjaXBpZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIFB1YmxpY0tleUJ1bmRsZS5lbmNvZGUoXG4gICAgICAgIG1lc3NhZ2UucmVjaXBpZW50LFxuICAgICAgICB3cml0ZXIudWludDMyKDE4KS5mb3JrKClcbiAgICAgICkubGRlbGltKCk7XG4gICAgfVxuICAgIHJldHVybiB3cml0ZXI7XG4gIH0sXG5cbiAgZGVjb2RlKGlucHV0OiBfbTAuUmVhZGVyIHwgVWludDhBcnJheSwgbGVuZ3RoPzogbnVtYmVyKTogTWVzc2FnZV9IZWFkZXIge1xuICAgIGNvbnN0IHJlYWRlciA9IGlucHV0IGluc3RhbmNlb2YgX20wLlJlYWRlciA/IGlucHV0IDogbmV3IF9tMC5SZWFkZXIoaW5wdXQpO1xuICAgIGxldCBlbmQgPSBsZW5ndGggPT09IHVuZGVmaW5lZCA/IHJlYWRlci5sZW4gOiByZWFkZXIucG9zICsgbGVuZ3RoO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBjcmVhdGVCYXNlTWVzc2FnZV9IZWFkZXIoKTtcbiAgICB3aGlsZSAocmVhZGVyLnBvcyA8IGVuZCkge1xuICAgICAgY29uc3QgdGFnID0gcmVhZGVyLnVpbnQzMigpO1xuICAgICAgc3dpdGNoICh0YWcgPj4+IDMpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIG1lc3NhZ2Uuc2VuZGVyID0gUHVibGljS2V5QnVuZGxlLmRlY29kZShyZWFkZXIsIHJlYWRlci51aW50MzIoKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBtZXNzYWdlLnJlY2lwaWVudCA9IFB1YmxpY0tleUJ1bmRsZS5kZWNvZGUocmVhZGVyLCByZWFkZXIudWludDMyKCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJlYWRlci5za2lwVHlwZSh0YWcgJiA3KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH0sXG5cbiAgZnJvbUpTT04ob2JqZWN0OiBhbnkpOiBNZXNzYWdlX0hlYWRlciB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNlbmRlcjogaXNTZXQob2JqZWN0LnNlbmRlcilcbiAgICAgICAgPyBQdWJsaWNLZXlCdW5kbGUuZnJvbUpTT04ob2JqZWN0LnNlbmRlcilcbiAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICByZWNpcGllbnQ6IGlzU2V0KG9iamVjdC5yZWNpcGllbnQpXG4gICAgICAgID8gUHVibGljS2V5QnVuZGxlLmZyb21KU09OKG9iamVjdC5yZWNpcGllbnQpXG4gICAgICAgIDogdW5kZWZpbmVkXG4gICAgfTtcbiAgfSxcblxuICB0b0pTT04obWVzc2FnZTogTWVzc2FnZV9IZWFkZXIpOiB1bmtub3duIHtcbiAgICBjb25zdCBvYmo6IGFueSA9IHt9O1xuICAgIG1lc3NhZ2Uuc2VuZGVyICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIChvYmouc2VuZGVyID0gbWVzc2FnZS5zZW5kZXJcbiAgICAgICAgPyBQdWJsaWNLZXlCdW5kbGUudG9KU09OKG1lc3NhZ2Uuc2VuZGVyKVxuICAgICAgICA6IHVuZGVmaW5lZCk7XG4gICAgbWVzc2FnZS5yZWNpcGllbnQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgKG9iai5yZWNpcGllbnQgPSBtZXNzYWdlLnJlY2lwaWVudFxuICAgICAgICA/IFB1YmxpY0tleUJ1bmRsZS50b0pTT04obWVzc2FnZS5yZWNpcGllbnQpXG4gICAgICAgIDogdW5kZWZpbmVkKTtcbiAgICByZXR1cm4gb2JqO1xuICB9LFxuXG4gIGZyb21QYXJ0aWFsPEkgZXh0ZW5kcyBFeGFjdDxEZWVwUGFydGlhbDxNZXNzYWdlX0hlYWRlcj4sIEk+PihcbiAgICBvYmplY3Q6IElcbiAgKTogTWVzc2FnZV9IZWFkZXIge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBjcmVhdGVCYXNlTWVzc2FnZV9IZWFkZXIoKTtcbiAgICBtZXNzYWdlLnNlbmRlciA9XG4gICAgICBvYmplY3Quc2VuZGVyICE9PSB1bmRlZmluZWQgJiYgb2JqZWN0LnNlbmRlciAhPT0gbnVsbFxuICAgICAgICA/IFB1YmxpY0tleUJ1bmRsZS5mcm9tUGFydGlhbChvYmplY3Quc2VuZGVyKVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBtZXNzYWdlLnJlY2lwaWVudCA9XG4gICAgICBvYmplY3QucmVjaXBpZW50ICE9PSB1bmRlZmluZWQgJiYgb2JqZWN0LnJlY2lwaWVudCAhPT0gbnVsbFxuICAgICAgICA/IFB1YmxpY0tleUJ1bmRsZS5mcm9tUGFydGlhbChvYmplY3QucmVjaXBpZW50KVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfVxufTtcblxuZnVuY3Rpb24gY3JlYXRlQmFzZVByaXZhdGVLZXlCdW5kbGUoKTogUHJpdmF0ZUtleUJ1bmRsZSB7XG4gIHJldHVybiB7IGlkZW50aXR5S2V5OiB1bmRlZmluZWQsIHByZUtleXM6IFtdIH07XG59XG5cbmV4cG9ydCBjb25zdCBQcml2YXRlS2V5QnVuZGxlID0ge1xuICBlbmNvZGUoXG4gICAgbWVzc2FnZTogUHJpdmF0ZUtleUJ1bmRsZSxcbiAgICB3cml0ZXI6IF9tMC5Xcml0ZXIgPSBfbTAuV3JpdGVyLmNyZWF0ZSgpXG4gICk6IF9tMC5Xcml0ZXIge1xuICAgIGlmIChtZXNzYWdlLmlkZW50aXR5S2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIFByaXZhdGVLZXkuZW5jb2RlKG1lc3NhZ2UuaWRlbnRpdHlLZXksIHdyaXRlci51aW50MzIoMTApLmZvcmsoKSkubGRlbGltKCk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgdiBvZiBtZXNzYWdlLnByZUtleXMpIHtcbiAgICAgIFByaXZhdGVLZXkuZW5jb2RlKHYhLCB3cml0ZXIudWludDMyKDE4KS5mb3JrKCkpLmxkZWxpbSgpO1xuICAgIH1cbiAgICByZXR1cm4gd3JpdGVyO1xuICB9LFxuXG4gIGRlY29kZShpbnB1dDogX20wLlJlYWRlciB8IFVpbnQ4QXJyYXksIGxlbmd0aD86IG51bWJlcik6IFByaXZhdGVLZXlCdW5kbGUge1xuICAgIGNvbnN0IHJlYWRlciA9IGlucHV0IGluc3RhbmNlb2YgX20wLlJlYWRlciA/IGlucHV0IDogbmV3IF9tMC5SZWFkZXIoaW5wdXQpO1xuICAgIGxldCBlbmQgPSBsZW5ndGggPT09IHVuZGVmaW5lZCA/IHJlYWRlci5sZW4gOiByZWFkZXIucG9zICsgbGVuZ3RoO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBjcmVhdGVCYXNlUHJpdmF0ZUtleUJ1bmRsZSgpO1xuICAgIHdoaWxlIChyZWFkZXIucG9zIDwgZW5kKSB7XG4gICAgICBjb25zdCB0YWcgPSByZWFkZXIudWludDMyKCk7XG4gICAgICBzd2l0Y2ggKHRhZyA+Pj4gMykge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgbWVzc2FnZS5pZGVudGl0eUtleSA9IFByaXZhdGVLZXkuZGVjb2RlKHJlYWRlciwgcmVhZGVyLnVpbnQzMigpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIG1lc3NhZ2UucHJlS2V5cy5wdXNoKFByaXZhdGVLZXkuZGVjb2RlKHJlYWRlciwgcmVhZGVyLnVpbnQzMigpKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmVhZGVyLnNraXBUeXBlKHRhZyAmIDcpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfSxcblxuICBmcm9tSlNPTihvYmplY3Q6IGFueSk6IFByaXZhdGVLZXlCdW5kbGUge1xuICAgIHJldHVybiB7XG4gICAgICBpZGVudGl0eUtleTogaXNTZXQob2JqZWN0LmlkZW50aXR5S2V5KVxuICAgICAgICA/IFByaXZhdGVLZXkuZnJvbUpTT04ob2JqZWN0LmlkZW50aXR5S2V5KVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgIHByZUtleXM6IEFycmF5LmlzQXJyYXkob2JqZWN0Py5wcmVLZXlzKVxuICAgICAgICA/IG9iamVjdC5wcmVLZXlzLm1hcCgoZTogYW55KSA9PiBQcml2YXRlS2V5LmZyb21KU09OKGUpKVxuICAgICAgICA6IFtdXG4gICAgfTtcbiAgfSxcblxuICB0b0pTT04obWVzc2FnZTogUHJpdmF0ZUtleUJ1bmRsZSk6IHVua25vd24ge1xuICAgIGNvbnN0IG9iajogYW55ID0ge307XG4gICAgbWVzc2FnZS5pZGVudGl0eUtleSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAob2JqLmlkZW50aXR5S2V5ID0gbWVzc2FnZS5pZGVudGl0eUtleVxuICAgICAgICA/IFByaXZhdGVLZXkudG9KU09OKG1lc3NhZ2UuaWRlbnRpdHlLZXkpXG4gICAgICAgIDogdW5kZWZpbmVkKTtcbiAgICBpZiAobWVzc2FnZS5wcmVLZXlzKSB7XG4gICAgICBvYmoucHJlS2V5cyA9IG1lc3NhZ2UucHJlS2V5cy5tYXAoZSA9PlxuICAgICAgICBlID8gUHJpdmF0ZUtleS50b0pTT04oZSkgOiB1bmRlZmluZWRcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9iai5wcmVLZXlzID0gW107XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgZnJvbVBhcnRpYWw8SSBleHRlbmRzIEV4YWN0PERlZXBQYXJ0aWFsPFByaXZhdGVLZXlCdW5kbGU+LCBJPj4oXG4gICAgb2JqZWN0OiBJXG4gICk6IFByaXZhdGVLZXlCdW5kbGUge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBjcmVhdGVCYXNlUHJpdmF0ZUtleUJ1bmRsZSgpO1xuICAgIG1lc3NhZ2UuaWRlbnRpdHlLZXkgPVxuICAgICAgb2JqZWN0LmlkZW50aXR5S2V5ICE9PSB1bmRlZmluZWQgJiYgb2JqZWN0LmlkZW50aXR5S2V5ICE9PSBudWxsXG4gICAgICAgID8gUHJpdmF0ZUtleS5mcm9tUGFydGlhbChvYmplY3QuaWRlbnRpdHlLZXkpXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIG1lc3NhZ2UucHJlS2V5cyA9IG9iamVjdC5wcmVLZXlzPy5tYXAoZSA9PiBQcml2YXRlS2V5LmZyb21QYXJ0aWFsKGUpKSB8fCBbXTtcbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfVxufTtcblxuZnVuY3Rpb24gY3JlYXRlQmFzZUVuY3J5cHRlZFByaXZhdGVLZXlCdW5kbGUoKTogRW5jcnlwdGVkUHJpdmF0ZUtleUJ1bmRsZSB7XG4gIHJldHVybiB7IHdhbGxldFByZUtleTogbmV3IFVpbnQ4QXJyYXkoKSwgY2lwaGVydGV4dDogdW5kZWZpbmVkIH07XG59XG5cbmV4cG9ydCBjb25zdCBFbmNyeXB0ZWRQcml2YXRlS2V5QnVuZGxlID0ge1xuICBlbmNvZGUoXG4gICAgbWVzc2FnZTogRW5jcnlwdGVkUHJpdmF0ZUtleUJ1bmRsZSxcbiAgICB3cml0ZXI6IF9tMC5Xcml0ZXIgPSBfbTAuV3JpdGVyLmNyZWF0ZSgpXG4gICk6IF9tMC5Xcml0ZXIge1xuICAgIGlmIChtZXNzYWdlLndhbGxldFByZUtleS5sZW5ndGggIT09IDApIHtcbiAgICAgIHdyaXRlci51aW50MzIoMTApLmJ5dGVzKG1lc3NhZ2Uud2FsbGV0UHJlS2V5KTtcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2UuY2lwaGVydGV4dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBDaXBoZXJ0ZXh0LmVuY29kZShtZXNzYWdlLmNpcGhlcnRleHQsIHdyaXRlci51aW50MzIoMTgpLmZvcmsoKSkubGRlbGltKCk7XG4gICAgfVxuICAgIHJldHVybiB3cml0ZXI7XG4gIH0sXG5cbiAgZGVjb2RlKFxuICAgIGlucHV0OiBfbTAuUmVhZGVyIHwgVWludDhBcnJheSxcbiAgICBsZW5ndGg/OiBudW1iZXJcbiAgKTogRW5jcnlwdGVkUHJpdmF0ZUtleUJ1bmRsZSB7XG4gICAgY29uc3QgcmVhZGVyID0gaW5wdXQgaW5zdGFuY2VvZiBfbTAuUmVhZGVyID8gaW5wdXQgOiBuZXcgX20wLlJlYWRlcihpbnB1dCk7XG4gICAgbGV0IGVuZCA9IGxlbmd0aCA9PT0gdW5kZWZpbmVkID8gcmVhZGVyLmxlbiA6IHJlYWRlci5wb3MgKyBsZW5ndGg7XG4gICAgY29uc3QgbWVzc2FnZSA9IGNyZWF0ZUJhc2VFbmNyeXB0ZWRQcml2YXRlS2V5QnVuZGxlKCk7XG4gICAgd2hpbGUgKHJlYWRlci5wb3MgPCBlbmQpIHtcbiAgICAgIGNvbnN0IHRhZyA9IHJlYWRlci51aW50MzIoKTtcbiAgICAgIHN3aXRjaCAodGFnID4+PiAzKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBtZXNzYWdlLndhbGxldFByZUtleSA9IHJlYWRlci5ieXRlcygpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgbWVzc2FnZS5jaXBoZXJ0ZXh0ID0gQ2lwaGVydGV4dC5kZWNvZGUocmVhZGVyLCByZWFkZXIudWludDMyKCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJlYWRlci5za2lwVHlwZSh0YWcgJiA3KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH0sXG5cbiAgZnJvbUpTT04ob2JqZWN0OiBhbnkpOiBFbmNyeXB0ZWRQcml2YXRlS2V5QnVuZGxlIHtcbiAgICByZXR1cm4ge1xuICAgICAgd2FsbGV0UHJlS2V5OiBpc1NldChvYmplY3Qud2FsbGV0UHJlS2V5KVxuICAgICAgICA/IGJ5dGVzRnJvbUJhc2U2NChvYmplY3Qud2FsbGV0UHJlS2V5KVxuICAgICAgICA6IG5ldyBVaW50OEFycmF5KCksXG4gICAgICBjaXBoZXJ0ZXh0OiBpc1NldChvYmplY3QuY2lwaGVydGV4dClcbiAgICAgICAgPyBDaXBoZXJ0ZXh0LmZyb21KU09OKG9iamVjdC5jaXBoZXJ0ZXh0KVxuICAgICAgICA6IHVuZGVmaW5lZFxuICAgIH07XG4gIH0sXG5cbiAgdG9KU09OKG1lc3NhZ2U6IEVuY3J5cHRlZFByaXZhdGVLZXlCdW5kbGUpOiB1bmtub3duIHtcbiAgICBjb25zdCBvYmo6IGFueSA9IHt9O1xuICAgIG1lc3NhZ2Uud2FsbGV0UHJlS2V5ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIChvYmoud2FsbGV0UHJlS2V5ID0gYmFzZTY0RnJvbUJ5dGVzKFxuICAgICAgICBtZXNzYWdlLndhbGxldFByZUtleSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgPyBtZXNzYWdlLndhbGxldFByZUtleVxuICAgICAgICAgIDogbmV3IFVpbnQ4QXJyYXkoKVxuICAgICAgKSk7XG4gICAgbWVzc2FnZS5jaXBoZXJ0ZXh0ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIChvYmouY2lwaGVydGV4dCA9IG1lc3NhZ2UuY2lwaGVydGV4dFxuICAgICAgICA/IENpcGhlcnRleHQudG9KU09OKG1lc3NhZ2UuY2lwaGVydGV4dClcbiAgICAgICAgOiB1bmRlZmluZWQpO1xuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgZnJvbVBhcnRpYWw8SSBleHRlbmRzIEV4YWN0PERlZXBQYXJ0aWFsPEVuY3J5cHRlZFByaXZhdGVLZXlCdW5kbGU+LCBJPj4oXG4gICAgb2JqZWN0OiBJXG4gICk6IEVuY3J5cHRlZFByaXZhdGVLZXlCdW5kbGUge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBjcmVhdGVCYXNlRW5jcnlwdGVkUHJpdmF0ZUtleUJ1bmRsZSgpO1xuICAgIG1lc3NhZ2Uud2FsbGV0UHJlS2V5ID0gb2JqZWN0LndhbGxldFByZUtleSA/PyBuZXcgVWludDhBcnJheSgpO1xuICAgIG1lc3NhZ2UuY2lwaGVydGV4dCA9XG4gICAgICBvYmplY3QuY2lwaGVydGV4dCAhPT0gdW5kZWZpbmVkICYmIG9iamVjdC5jaXBoZXJ0ZXh0ICE9PSBudWxsXG4gICAgICAgID8gQ2lwaGVydGV4dC5mcm9tUGFydGlhbChvYmplY3QuY2lwaGVydGV4dClcbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH1cbn07XG5cbmRlY2xhcmUgdmFyIHNlbGY6IGFueSB8IHVuZGVmaW5lZDtcbmRlY2xhcmUgdmFyIHdpbmRvdzogYW55IHwgdW5kZWZpbmVkO1xuZGVjbGFyZSB2YXIgZ2xvYmFsOiBhbnkgfCB1bmRlZmluZWQ7XG52YXIgZ2xvYmFsVGhpczogYW55ID0gKCgpID0+IHtcbiAgaWYgKHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJykgcmV0dXJuIGdsb2JhbFRoaXM7XG4gIGlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiBzZWxmO1xuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiB3aW5kb3c7XG4gIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykgcmV0dXJuIGdsb2JhbDtcbiAgdGhyb3cgJ1VuYWJsZSB0byBsb2NhdGUgZ2xvYmFsIG9iamVjdCc7XG59KSgpO1xuXG5jb25zdCBhdG9iOiAoYjY0OiBzdHJpbmcpID0+IHN0cmluZyA9XG4gIGdsb2JhbFRoaXMuYXRvYiB8fFxuICAoYjY0ID0+IGdsb2JhbFRoaXMuQnVmZmVyLmZyb20oYjY0LCAnYmFzZTY0JykudG9TdHJpbmcoJ2JpbmFyeScpKTtcbmZ1bmN0aW9uIGJ5dGVzRnJvbUJhc2U2NChiNjQ6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBiaW4gPSBhdG9iKGI2NCk7XG4gIGNvbnN0IGFyciA9IG5ldyBVaW50OEFycmF5KGJpbi5sZW5ndGgpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbi5sZW5ndGg7ICsraSkge1xuICAgIGFycltpXSA9IGJpbi5jaGFyQ29kZUF0KGkpO1xuICB9XG4gIHJldHVybiBhcnI7XG59XG5cbmNvbnN0IGJ0b2E6IChiaW46IHN0cmluZykgPT4gc3RyaW5nID1cbiAgZ2xvYmFsVGhpcy5idG9hIHx8XG4gIChiaW4gPT4gZ2xvYmFsVGhpcy5CdWZmZXIuZnJvbShiaW4sICdiaW5hcnknKS50b1N0cmluZygnYmFzZTY0JykpO1xuZnVuY3Rpb24gYmFzZTY0RnJvbUJ5dGVzKGFycjogVWludDhBcnJheSk6IHN0cmluZyB7XG4gIGNvbnN0IGJpbjogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBieXRlIG9mIGFycikge1xuICAgIGJpbi5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZSkpO1xuICB9XG4gIHJldHVybiBidG9hKGJpbi5qb2luKCcnKSk7XG59XG5cbnR5cGUgQnVpbHRpbiA9XG4gIHwgRGF0ZVxuICB8IEZ1bmN0aW9uXG4gIHwgVWludDhBcnJheVxuICB8IHN0cmluZ1xuICB8IG51bWJlclxuICB8IGJvb2xlYW5cbiAgfCB1bmRlZmluZWQ7XG5cbmV4cG9ydCB0eXBlIERlZXBQYXJ0aWFsPFQ+ID0gVCBleHRlbmRzIEJ1aWx0aW5cbiAgPyBUXG4gIDogVCBleHRlbmRzIEFycmF5PGluZmVyIFU+XG4gID8gQXJyYXk8RGVlcFBhcnRpYWw8VT4+XG4gIDogVCBleHRlbmRzIFJlYWRvbmx5QXJyYXk8aW5mZXIgVT5cbiAgPyBSZWFkb25seUFycmF5PERlZXBQYXJ0aWFsPFU+PlxuICA6IFQgZXh0ZW5kcyB7fVxuICA/IHsgW0sgaW4ga2V5b2YgVF0/OiBEZWVwUGFydGlhbDxUW0tdPiB9XG4gIDogUGFydGlhbDxUPjtcblxudHlwZSBLZXlzT2ZVbmlvbjxUPiA9IFQgZXh0ZW5kcyBUID8ga2V5b2YgVCA6IG5ldmVyO1xuZXhwb3J0IHR5cGUgRXhhY3Q8UCwgSSBleHRlbmRzIFA+ID0gUCBleHRlbmRzIEJ1aWx0aW5cbiAgPyBQXG4gIDogUCAmIHsgW0sgaW4ga2V5b2YgUF06IEV4YWN0PFBbS10sIElbS10+IH0gJiBSZWNvcmQ8XG4gICAgICAgIEV4Y2x1ZGU8a2V5b2YgSSwgS2V5c09mVW5pb248UD4+LFxuICAgICAgICBuZXZlclxuICAgICAgPjtcblxuaWYgKF9tMC51dGlsLkxvbmcgIT09IExvbmcpIHtcbiAgX20wLnV0aWwuTG9uZyA9IExvbmcgYXMgYW55O1xuICBfbTAuY29uZmlndXJlKCk7XG59XG5cbmZ1bmN0aW9uIGlzU2V0KHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQ7XG59XG4iXX0=