"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var proto = _interopRequireWildcard(require("../../src/proto/message"));

var _PrivateKey = _interopRequireDefault(require("./PrivateKey"));

var _PublicKeyBundle = _interopRequireDefault(require("./PublicKeyBundle"));

var _Ciphertext = _interopRequireDefault(require("./Ciphertext"));

var _utils = require("./utils");

var _encryption = require("./encryption");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// PrivateKeyBundle bundles the private keys corresponding to a PublicKeyBundle for convenience.
// This bundle must not be shared with anyone, although will have to be persisted
// somehow so that older messages can be decrypted again.
var PrivateKeyBundle = /*#__PURE__*/function () {
  function PrivateKeyBundle(identityKey, preKey) {
    _classCallCheck(this, PrivateKeyBundle);

    _defineProperty(this, "identityKey", void 0);

    _defineProperty(this, "preKeys", void 0);

    _defineProperty(this, "preKey", void 0);

    _defineProperty(this, "publicKeyBundle", void 0);

    this.identityKey = new _PrivateKey["default"](identityKey);
    this.preKey = preKey;
    this.preKeys = [preKey];
    this.publicKeyBundle = new _PublicKeyBundle["default"](this.identityKey.publicKey, this.preKey.publicKey);
  } // Generate a new key bundle pair with the preKey signed byt the identityKey.


  _createClass(PrivateKeyBundle, [{
    key: "sharedSecret",
    value: // sharedSecret derives a secret from peer's key bundles using a variation of X3DH protocol
    // where the sender's ephemeral key pair is replaced by the sender's prekey.
    // @recipient indicates whether this is the sending (encrypting) or receiving (decrypting) side.
    function () {
      var _sharedSecret = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(peer, recipient) {
        var dh1, dh2, dh3, secret;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(!peer.identityKey || !peer.preKey)) {
                  _context.next = 2;
                  break;
                }

                throw new Error('invalid peer key bundle');

              case 2:
                _context.next = 4;
                return peer.identityKey.verifyKey(peer.preKey);

              case 4:
                if (_context.sent) {
                  _context.next = 6;
                  break;
                }

                throw new Error('peer preKey signature invalid');

              case 6:
                if (this.identityKey) {
                  _context.next = 8;
                  break;
                }

                throw new Error('missing identity key');

              case 8:
                if (recipient) {
                  dh1 = this.preKey.sharedSecret(peer.identityKey);
                  dh2 = this.identityKey.sharedSecret(peer.preKey);
                } else {
                  dh1 = this.identityKey.sharedSecret(peer.preKey);
                  dh2 = this.preKey.sharedSecret(peer.identityKey);
                }

                dh3 = this.preKey.sharedSecret(peer.preKey);
                secret = new Uint8Array(dh1.length + dh2.length + dh3.length);
                secret.set(dh1, 0);
                secret.set(dh2, dh1.length);
                secret.set(dh3, dh1.length + dh2.length);
                return _context.abrupt("return", secret);

              case 15:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function sharedSecret(_x, _x2) {
        return _sharedSecret.apply(this, arguments);
      }

      return sharedSecret;
    }()
  }, {
    key: "encode",
    value: function () {
      var _encode = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(wallet) {
        var bytes, wPreKey, secret, ciphertext;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!(this.preKeys.length === 0)) {
                  _context2.next = 2;
                  break;
                }

                throw new Error('missing pre key');

              case 2:
                if (this.identityKey) {
                  _context2.next = 4;
                  break;
                }

                throw new Error('missing identity key');

              case 4:
                bytes = proto.PrivateKeyBundle.encode({
                  identityKey: this.identityKey,
                  preKeys: [this.preKey]
                }).finish();
                wPreKey = (0, _utils.getRandomValues)(new Uint8Array(32));
                _context2.t0 = _utils.hexToBytes;
                _context2.next = 9;
                return wallet.signMessage(wPreKey);

              case 9:
                _context2.t1 = _context2.sent;
                secret = (0, _context2.t0)(_context2.t1);
                _context2.next = 13;
                return (0, _encryption.encrypt)(bytes, secret);

              case 13:
                ciphertext = _context2.sent;
                return _context2.abrupt("return", proto.EncryptedPrivateKeyBundle.encode({
                  walletPreKey: wPreKey,
                  ciphertext: ciphertext
                }).finish());

              case 15:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function encode(_x3) {
        return _encode.apply(this, arguments);
      }

      return encode;
    }()
  }], [{
    key: "generate",
    value: function () {
      var _generate = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
        var identityKey, preKey;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                identityKey = _PrivateKey["default"].generate();
                preKey = _PrivateKey["default"].generate();
                _context3.next = 4;
                return identityKey.signKey(preKey.publicKey);

              case 4:
                return _context3.abrupt("return", new PrivateKeyBundle(identityKey, preKey));

              case 5:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      function generate() {
        return _generate.apply(this, arguments);
      }

      return generate;
    }()
  }, {
    key: "decode",
    value: function () {
      var _decode = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(wallet, bytes) {
        var _encrypted$ciphertext;

        var encrypted, secret, ciphertext, decrypted, bundle;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                encrypted = proto.EncryptedPrivateKeyBundle.decode(bytes);

                if (encrypted.walletPreKey) {
                  _context4.next = 3;
                  break;
                }

                throw new Error('missing wallet pre-key');

              case 3:
                _context4.t0 = _utils.hexToBytes;
                _context4.next = 6;
                return wallet.signMessage(encrypted.walletPreKey);

              case 6:
                _context4.t1 = _context4.sent;
                secret = (0, _context4.t0)(_context4.t1);

                if ((_encrypted$ciphertext = encrypted.ciphertext) !== null && _encrypted$ciphertext !== void 0 && _encrypted$ciphertext.aes256GcmHkdfSha256) {
                  _context4.next = 10;
                  break;
                }

                throw new Error('missing bundle ciphertext');

              case 10:
                ciphertext = new _Ciphertext["default"](encrypted.ciphertext);
                _context4.next = 13;
                return (0, _encryption.decrypt)(ciphertext, secret);

              case 13:
                decrypted = _context4.sent;
                bundle = proto.PrivateKeyBundle.decode(decrypted);

                if (bundle.identityKey) {
                  _context4.next = 17;
                  break;
                }

                throw new Error('missing identity key');

              case 17:
                if (!(bundle.preKeys.length === 0)) {
                  _context4.next = 19;
                  break;
                }

                throw new Error('missing pre-keys');

              case 19:
                return _context4.abrupt("return", new PrivateKeyBundle(new _PrivateKey["default"](bundle.identityKey), new _PrivateKey["default"](bundle.preKeys[0])));

              case 20:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      function decode(_x4, _x5) {
        return _decode.apply(this, arguments);
      }

      return decode;
    }()
  }]);

  return PrivateKeyBundle;
}();

exports["default"] = PrivateKeyBundle;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jcnlwdG8vUHJpdmF0ZUtleUJ1bmRsZS50cyJdLCJuYW1lcyI6WyJQcml2YXRlS2V5QnVuZGxlIiwiaWRlbnRpdHlLZXkiLCJwcmVLZXkiLCJQcml2YXRlS2V5IiwicHJlS2V5cyIsInB1YmxpY0tleUJ1bmRsZSIsIlB1YmxpY0tleUJ1bmRsZSIsInB1YmxpY0tleSIsInBlZXIiLCJyZWNpcGllbnQiLCJFcnJvciIsInZlcmlmeUtleSIsImRoMSIsInNoYXJlZFNlY3JldCIsImRoMiIsImRoMyIsInNlY3JldCIsIlVpbnQ4QXJyYXkiLCJsZW5ndGgiLCJzZXQiLCJ3YWxsZXQiLCJieXRlcyIsInByb3RvIiwiZW5jb2RlIiwiZmluaXNoIiwid1ByZUtleSIsImhleFRvQnl0ZXMiLCJzaWduTWVzc2FnZSIsImNpcGhlcnRleHQiLCJFbmNyeXB0ZWRQcml2YXRlS2V5QnVuZGxlIiwid2FsbGV0UHJlS2V5IiwiZ2VuZXJhdGUiLCJzaWduS2V5IiwiZW5jcnlwdGVkIiwiZGVjb2RlIiwiYWVzMjU2R2NtSGtkZlNoYTI1NiIsIkNpcGhlcnRleHQiLCJkZWNyeXB0ZWQiLCJidW5kbGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBO0FBQ0E7QUFDQTtJQUNxQkEsZ0I7QUFNbkIsNEJBQVlDLFdBQVosRUFBcUNDLE1BQXJDLEVBQXlEO0FBQUE7O0FBQUE7O0FBQUE7O0FBQUE7O0FBQUE7O0FBQ3ZELFNBQUtELFdBQUwsR0FBbUIsSUFBSUUsc0JBQUosQ0FBZUYsV0FBZixDQUFuQjtBQUNBLFNBQUtDLE1BQUwsR0FBY0EsTUFBZDtBQUNBLFNBQUtFLE9BQUwsR0FBZSxDQUFDRixNQUFELENBQWY7QUFDQSxTQUFLRyxlQUFMLEdBQXVCLElBQUlDLDJCQUFKLENBQ3JCLEtBQUtMLFdBQUwsQ0FBaUJNLFNBREksRUFFckIsS0FBS0wsTUFBTCxDQUFZSyxT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QUEsTUFSUjs7QUFBQSw2Q0FTT2lCLFNBQVMsQ0FBQ0wsVUFUakIsa0RBU08sc0JBQXNCTyxtQkFUN0I7QUFBQTtBQUFBO0FBQUE7O0FBQUEsc0JBVVUsSUFBSXpCLEtBQUosQ0FBVSwyQkFBVixDQVZWOztBQUFBO0FBWVFrQixnQkFBQUEsVUFaUixHQVlxQixJQUFJUSxzQkFBSixDQUFlSCxTQUFTLENBQUNMLFVBQXpCLENBWnJCO0FBQUE7QUFBQSx1QkFhMEIseUJBQVFBLFVBQVIsRUFBb0JaLE1BQXBCLENBYjFCOztBQUFBO0FBYVFxQixnQkFBQUEsU0FiUjtBQWNRQyxnQkFBQUEsTUFkUixHQWNpQmhCLEtBQUssQ0FBQ3RCLGdCQUFOLENBQXVCa0MsTUFBdkIsQ0FBOEJHLFNBQTlCLENBZGpCOztBQUFBLG9CQWVPQyxNQUFNLENBQUNyQyxXQWZkO0FBQUE7QUFBQTtBQUFBOztBQUFBLHNCQWdCVSxJQUFJUyxLQUFKLENBQVUsc0JBQVYsQ0FoQlY7O0FBQUE7QUFBQSxzQkFrQk00QixNQUFNLENBQUNsQyxPQUFQLENBQWVjLE1BQWYsS0FBMEIsQ0FsQmhDO0FBQUE7QUFBQTtBQUFBOztBQUFBLHNCQW1CVSxJQUFJUixLQUFKLENBQVUsa0JBQVYsQ0FuQlY7O0FBQUE7QUFBQSxrREFxQlMsSUFBSVYsZ0JBQUosQ0FDTCxJQUFJRyxzQkFBSixDQUFlbUMsTUFBTSxDQUFDckMsV0FBdEIsQ0FESyxFQUVMLElBQUlFLHNCQUFKLENBQWVtQyxNQUFNLENBQUNsQyxPQUFQLENBQWUsQ0FBZixDQUFmLENBRkssQ0FyQlQ7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHByb3RvIGZyb20gJy4uLy4uL3NyYy9wcm90by9tZXNzYWdlJztcbmltcG9ydCBQcml2YXRlS2V5IGZyb20gJy4vUHJpdmF0ZUtleSc7XG5pbXBvcnQgUHVibGljS2V5QnVuZGxlIGZyb20gJy4vUHVibGljS2V5QnVuZGxlJztcbmltcG9ydCBDaXBoZXJ0ZXh0IGZyb20gJy4vQ2lwaGVydGV4dCc7XG5pbXBvcnQgKiBhcyBldGhlcnMgZnJvbSAnZXRoZXJzJztcbmltcG9ydCB7IGdldFJhbmRvbVZhbHVlcywgaGV4VG9CeXRlcyB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgZGVjcnlwdCwgZW5jcnlwdCB9IGZyb20gJy4vZW5jcnlwdGlvbic7XG5cbi8vIFByaXZhdGVLZXlCdW5kbGUgYnVuZGxlcyB0aGUgcHJpdmF0ZSBrZXlzIGNvcnJlc3BvbmRpbmcgdG8gYSBQdWJsaWNLZXlCdW5kbGUgZm9yIGNvbnZlbmllbmNlLlxuLy8gVGhpcyBidW5kbGUgbXVzdCBub3QgYmUgc2hhcmVkIHdpdGggYW55b25lLCBhbHRob3VnaCB3aWxsIGhhdmUgdG8gYmUgcGVyc2lzdGVkXG4vLyBzb21laG93IHNvIHRoYXQgb2xkZXIgbWVzc2FnZXMgY2FuIGJlIGRlY3J5cHRlZCBhZ2Fpbi5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByaXZhdGVLZXlCdW5kbGUgaW1wbGVtZW50cyBwcm90by5Qcml2YXRlS2V5QnVuZGxlIHtcbiAgaWRlbnRpdHlLZXk6IFByaXZhdGVLZXkgfCB1bmRlZmluZWQ7XG4gIHByZUtleXM6IFByaXZhdGVLZXlbXTtcbiAgcHJlS2V5OiBQcml2YXRlS2V5O1xuICBwdWJsaWNLZXlCdW5kbGU6IFB1YmxpY0tleUJ1bmRsZTtcblxuICBjb25zdHJ1Y3RvcihpZGVudGl0eUtleTogUHJpdmF0ZUtleSwgcHJlS2V5OiBQcml2YXRlS2V5KSB7XG4gICAgdGhpcy5pZGVudGl0eUtleSA9IG5ldyBQcml2YXRlS2V5KGlkZW50aXR5S2V5KTtcbiAgICB0aGlzLnByZUtleSA9IHByZUtleTtcbiAgICB0aGlzLnByZUtleXMgPSBbcHJlS2V5XTtcbiAgICB0aGlzLnB1YmxpY0tleUJ1bmRsZSA9IG5ldyBQdWJsaWNLZXlCdW5kbGUoXG4gICAgICB0aGlzLmlkZW50aXR5S2V5LnB1YmxpY0tleSxcbiAgICAgIHRoaXMucHJlS2V5LnB1YmxpY0tleVxuICAgICk7XG4gIH1cblxuICAvLyBHZW5lcmF0ZSBhIG5ldyBrZXkgYnVuZGxlIHBhaXIgd2l0aCB0aGUgcHJlS2V5IHNpZ25lZCBieXQgdGhlIGlkZW50aXR5S2V5LlxuICBzdGF0aWMgYXN5bmMgZ2VuZXJhdGUoKTogUHJvbWlzZTxQcml2YXRlS2V5QnVuZGxlPiB7XG4gICAgY29uc3QgaWRlbnRpdHlLZXkgPSBQcml2YXRlS2V5LmdlbmVyYXRlKCk7XG4gICAgY29uc3QgcHJlS2V5ID0gUHJpdmF0ZUtleS5nZW5lcmF0ZSgpO1xuICAgIGF3YWl0IGlkZW50aXR5S2V5LnNpZ25LZXkocHJlS2V5LnB1YmxpY0tleSk7XG4gICAgcmV0dXJuIG5ldyBQcml2YXRlS2V5QnVuZGxlKGlkZW50aXR5S2V5LCBwcmVLZXkpO1xuICB9XG5cbiAgLy8gc2hhcmVkU2VjcmV0IGRlcml2ZXMgYSBzZWNyZXQgZnJvbSBwZWVyJ3Mga2V5IGJ1bmRsZXMgdXNpbmcgYSB2YXJpYXRpb24gb2YgWDNESCBwcm90b2NvbFxuICAvLyB3aGVyZSB0aGUgc2VuZGVyJ3MgZXBoZW1lcmFsIGtleSBwYWlyIGlzIHJlcGxhY2VkIGJ5IHRoZSBzZW5kZXIncyBwcmVrZXkuXG4gIC8vIEByZWNpcGllbnQgaW5kaWNhdGVzIHdoZXRoZXIgdGhpcyBpcyB0aGUgc2VuZGluZyAoZW5jcnlwdGluZykgb3IgcmVjZWl2aW5nIChkZWNyeXB0aW5nKSBzaWRlLlxuICBhc3luYyBzaGFyZWRTZWNyZXQoXG4gICAgcGVlcjogUHVibGljS2V5QnVuZGxlLFxuICAgIHJlY2lwaWVudDogYm9vbGVhblxuICApOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgICBpZiAoIXBlZXIuaWRlbnRpdHlLZXkgfHwgIXBlZXIucHJlS2V5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgcGVlciBrZXkgYnVuZGxlJyk7XG4gICAgfVxuICAgIGlmICghKGF3YWl0IHBlZXIuaWRlbnRpdHlLZXkudmVyaWZ5S2V5KHBlZXIucHJlS2V5KSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigncGVlciBwcmVLZXkgc2lnbmF0dXJlIGludmFsaWQnKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLmlkZW50aXR5S2V5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgaWRlbnRpdHkga2V5Jyk7XG4gICAgfVxuICAgIGxldCBkaDE6IFVpbnQ4QXJyYXksIGRoMjogVWludDhBcnJheTtcbiAgICBpZiAocmVjaXBpZW50KSB7XG4gICAgICBkaDEgPSB0aGlzLnByZUtleS5zaGFyZWRTZWNyZXQocGVlci5pZGVudGl0eUtleSk7XG4gICAgICBkaDIgPSB0aGlzLmlkZW50aXR5S2V5LnNoYXJlZFNlY3JldChwZWVyLnByZUtleSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRoMSA9IHRoaXMuaWRlbnRpdHlLZXkuc2hhcmVkU2VjcmV0KHBlZXIucHJlS2V5KTtcbiAgICAgIGRoMiA9IHRoaXMucHJlS2V5LnNoYXJlZFNlY3JldChwZWVyLmlkZW50aXR5S2V5KTtcbiAgICB9XG4gICAgY29uc3QgZGgzID0gdGhpcy5wcmVLZXkuc2hhcmVkU2VjcmV0KHBlZXIucHJlS2V5KTtcbiAgICBjb25zdCBzZWNyZXQgPSBuZXcgVWludDhBcnJheShkaDEubGVuZ3RoICsgZGgyLmxlbmd0aCArIGRoMy5sZW5ndGgpO1xuICAgIHNlY3JldC5zZXQoZGgxLCAwKTtcbiAgICBzZWNyZXQuc2V0KGRoMiwgZGgxLmxlbmd0aCk7XG4gICAgc2VjcmV0LnNldChkaDMsIGRoMS5sZW5ndGggKyBkaDIubGVuZ3RoKTtcbiAgICByZXR1cm4gc2VjcmV0O1xuICB9XG5cbiAgYXN5bmMgZW5jb2RlKHdhbGxldDogZXRoZXJzLlNpZ25lcik6IFByb21pc2U8VWludDhBcnJheT4ge1xuICAgIC8vIHNlcmlhbGl6ZSB0aGUgY29udGVudHNcbiAgICBpZiAodGhpcy5wcmVLZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIHByZSBrZXknKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLmlkZW50aXR5S2V5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgaWRlbnRpdHkga2V5Jyk7XG4gICAgfVxuICAgIGNvbnN0IGJ5dGVzID0gcHJvdG8uUHJpdmF0ZUtleUJ1bmRsZS5lbmNvZGUoe1xuICAgICAgaWRlbnRpdHlLZXk6IHRoaXMuaWRlbnRpdHlLZXksXG4gICAgICBwcmVLZXlzOiBbdGhpcy5wcmVLZXldXG4gICAgfSkuZmluaXNoKCk7XG4gICAgY29uc3Qgd1ByZUtleSA9IGdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheSgzMikpO1xuICAgIGNvbnN0IHNlY3JldCA9IGhleFRvQnl0ZXMoYXdhaXQgd2FsbGV0LnNpZ25NZXNzYWdlKHdQcmVLZXkpKTtcbiAgICBjb25zdCBjaXBoZXJ0ZXh0ID0gYXdhaXQgZW5jcnlwdChieXRlcywgc2VjcmV0KTtcbiAgICByZXR1cm4gcHJvdG8uRW5jcnlwdGVkUHJpdmF0ZUtleUJ1bmRsZS5lbmNvZGUoe1xuICAgICAgd2FsbGV0UHJlS2V5OiB3UHJlS2V5LFxuICAgICAgY2lwaGVydGV4dFxuICAgIH0pLmZpbmlzaCgpO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIGRlY29kZShcbiAgICB3YWxsZXQ6IGV0aGVycy5TaWduZXIsXG4gICAgYnl0ZXM6IFVpbnQ4QXJyYXlcbiAgKTogUHJvbWlzZTxQcml2YXRlS2V5QnVuZGxlPiB7XG4gICAgY29uc3QgZW5jcnlwdGVkID0gcHJvdG8uRW5jcnlwdGVkUHJpdmF0ZUtleUJ1bmRsZS5kZWNvZGUoYnl0ZXMpO1xuICAgIGlmICghZW5jcnlwdGVkLndhbGxldFByZUtleSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIHdhbGxldCBwcmUta2V5Jyk7XG4gICAgfVxuICAgIGNvbnN0IHNlY3JldCA9IGhleFRvQnl0ZXMoYXdhaXQgd2FsbGV0LnNpZ25NZXNzYWdlKGVuY3J5cHRlZC53YWxsZXRQcmVLZXkpKTtcbiAgICBpZiAoIWVuY3J5cHRlZC5jaXBoZXJ0ZXh0Py5hZXMyNTZHY21Ia2RmU2hhMjU2KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgYnVuZGxlIGNpcGhlcnRleHQnKTtcbiAgICB9XG4gICAgY29uc3QgY2lwaGVydGV4dCA9IG5ldyBDaXBoZXJ0ZXh0KGVuY3J5cHRlZC5jaXBoZXJ0ZXh0KTtcbiAgICBjb25zdCBkZWNyeXB0ZWQgPSBhd2FpdCBkZWNyeXB0KGNpcGhlcnRleHQsIHNlY3JldCk7XG4gICAgY29uc3QgYnVuZGxlID0gcHJvdG8uUHJpdmF0ZUtleUJ1bmRsZS5kZWNvZGUoZGVjcnlwdGVkKTtcbiAgICBpZiAoIWJ1bmRsZS5pZGVudGl0eUtleSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIGlkZW50aXR5IGtleScpO1xuICAgIH1cbiAgICBpZiAoYnVuZGxlLnByZUtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgcHJlLWtleXMnKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBQcml2YXRlS2V5QnVuZGxlKFxuICAgICAgbmV3IFByaXZhdGVLZXkoYnVuZGxlLmlkZW50aXR5S2V5KSxcbiAgICAgIG5ldyBQcml2YXRlS2V5KGJ1bmRsZS5wcmVLZXlzWzBdKVxuICAgICk7XG4gIH1cbn1cbiJdfQ==