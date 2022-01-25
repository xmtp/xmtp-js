"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var proto = _interopRequireWildcard(require("../../src/proto/message"));

var secp = _interopRequireWildcard(require("@noble/secp256k1"));

var _Signature = _interopRequireDefault(require("./Signature"));

var _PublicKey = _interopRequireDefault(require("./PublicKey"));

var _encryption = require("./encryption");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// PrivateKey represents a secp256k1 private key.
var PrivateKey = /*#__PURE__*/function () {
  // caches corresponding PublicKey
  function PrivateKey(obj) {
    _classCallCheck(this, PrivateKey);

    _defineProperty(this, "secp256k1", void 0);

    _defineProperty(this, "publicKey", void 0);

    if (!obj.secp256k1) {
      throw new Error('invalid private key');
    }

    if (obj.secp256k1.bytes.length !== 32) {
      throw new Error("invalid private key length: ".concat(obj.secp256k1.bytes.length));
    }

    this.secp256k1 = obj.secp256k1;
    this.publicKey = _PublicKey["default"].fromPrivateKey(this);
  } // create a random PrivateKey.


  _createClass(PrivateKey, [{
    key: "sign",
    value: // sign provided digest
    function () {
      var _sign = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(digest) {
        var _yield$secp$sign, _yield$secp$sign2, signature, recovery;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (this.secp256k1) {
                  _context.next = 2;
                  break;
                }

                throw new Error('invalid private key');

              case 2:
                _context.next = 4;
                return secp.sign(digest, this.secp256k1.bytes, {
                  recovered: true,
                  der: false
                });

              case 4:
                _yield$secp$sign = _context.sent;
                _yield$secp$sign2 = _slicedToArray(_yield$secp$sign, 2);
                signature = _yield$secp$sign2[0];
                recovery = _yield$secp$sign2[1];
                return _context.abrupt("return", new _Signature["default"]({
                  ecdsaCompact: {
                    bytes: signature,
                    recovery: recovery
                  }
                }));

              case 9:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function sign(_x) {
        return _sign.apply(this, arguments);
      }

      return sign;
    }() // sign provided public key

  }, {
    key: "signKey",
    value: function () {
      var _signKey = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(pub) {
        var digest;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (pub.secp256k1Uncompressed) {
                  _context2.next = 2;
                  break;
                }

                throw new Error('invalid public key');

              case 2:
                _context2.next = 4;
                return secp.utils.sha256(pub.secp256k1Uncompressed.bytes);

              case 4:
                digest = _context2.sent;
                _context2.next = 7;
                return this.sign(digest);

              case 7:
                pub.signature = _context2.sent;
                return _context2.abrupt("return", pub);

              case 9:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function signKey(_x2) {
        return _signKey.apply(this, arguments);
      }

      return signKey;
    }() // derive shared secret from peer's PublicKey;
    // the peer can derive the same secret using their PrivateKey and our PublicKey

  }, {
    key: "sharedSecret",
    value: function sharedSecret(peer) {
      if (!peer.secp256k1Uncompressed) {
        throw new Error('invalid public key');
      }

      if (!this.secp256k1) {
        throw new Error('invalid private key');
      }

      return secp.getSharedSecret(this.secp256k1.bytes, peer.secp256k1Uncompressed.bytes, false);
    } // encrypt plain bytes using a shared secret derived from peer's PublicKey;
    // additionalData allows including unencrypted parts of a Message in the authentication
    // protection provided by the encrypted part (to make the whole Message tamper evident)

  }, {
    key: "encrypt",
    value: function encrypt(plain, peer, additionalData) {
      var secret = this.sharedSecret(peer);
      return (0, _encryption.encrypt)(plain, secret, additionalData);
    } // decrypt Ciphertext using a shared secret derived from peer's PublicKey;
    // throws if any part of Ciphertext or additionalData was tampered with

  }, {
    key: "decrypt",
    value: function decrypt(encrypted, peer, additionalData) {
      var secret = this.sharedSecret(peer);
      return (0, _encryption.decrypt)(encrypted, secret, additionalData);
    } // Does the provided PublicKey correspnd to this PrivateKey?

  }, {
    key: "matches",
    value: function matches(key) {
      return this.publicKey.equals(key);
    }
  }, {
    key: "toBytes",
    value: function toBytes() {
      return proto.PrivateKey.encode(this).finish();
    }
  }], [{
    key: "generate",
    value: function generate() {
      return new PrivateKey({
        secp256k1: {
          bytes: secp.utils.randomPrivateKey()
        }
      });
    }
  }, {
    key: "fromBytes",
    value: function fromBytes(bytes) {
      return new PrivateKey(proto.PrivateKey.decode(bytes));
    }
  }]);

  return PrivateKey;
}();

exports["default"] = PrivateKey;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jcnlwdG8vUHJpdmF0ZUtleS50cyJdLCJuYW1lcyI6WyJQcml2YXRlS2V5Iiwib2JqIiwic2VjcDI1NmsxIiwiRXJyb3IiLCJieXRlcyIsImxlbmd0aCIsInB1YmxpY0tleSIsIlB1YmxpY0tleSIsImZyb21Qcml2YXRlS2V5IiwiZGlnZXN0Iiwic2VjcCIsInNpZ24iLCJyZWNvdmVyZWQiLCJkZXIiLCJzaWduYXR1cmUiLCJyZWNvdmVyeSIsIlNpZ25hdHVyZSIsImVjZHNhQ29tcGFjdCIsInB1YiIsInNlY3AyNTZrMVVuY29tcHJlc3NlZCIsInV0aWxzIiwic2hhMjU2IiwicGVlciIsImdldFNoYXJlZFNlY3JldCIsInBsYWluIiwiYWRkaXRpb25hbERhdGEiLCJzZWNyZXQiLCJzaGFyZWRTZWNyZXQiLCJlbmNyeXB0ZWQiLCJrZXkiLCJlcXVhbHMiLCJwcm90byIsImVuY29kZSIsImZpbmlzaCIsInJhbmRvbVByaXZhdGVLZXkiLCJkZWNvZGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBO0lBQ3FCQSxVO0FBRUc7QUFFdEIsc0JBQVlDLEdBQVosRUFBbUM7QUFBQTs7QUFBQTs7QUFBQTs7QUFDakMsUUFBSSxDQUFDQSxHQUFHLENBQUNDLFNBQVQsRUFBb0I7QUFDbEIsWUFBTSxJQUFJQyxLQUFKLENBQVUscUJBQVYsQ0FBTjtBQUNEOztBQUNELFFBQUlGLEdBQUcsQ0FBQ0MsU0FBSixDQUFjRSxLQUFkLENBQW9CQyxNQUFwQixLQUErQixFQUFuQyxFQUF1QztBQUNyQyxZQUFNLElBQUlGLEtBQUosdUNBQzJCRixHQUFHLENBQUNDLFNBQUosQ0FBY0UsS0FBZCxDQUFvQkMsTUFEL0MsRUFBTjtBQUdEOztBQUNELFNBQUtILFNBQUwsR0FBaUJELEdBQUcsQ0FBQ0MsU0FBckI7QUFDQSxTQUFLSSxTQUFMLEdBQWlCQyxzQkFB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QixhQUFPLElBQUlqQyxVQUFKLENBQWU7QUFDcEJFLFFBQUFBLFNBQVMsRUFBRTtBQUNURSxVQUFBQSxLQUFLLEVBQUVNLElBQUksQ0FBQ1UsS0FBTCxDQUFXYyxnQkFBWDtBQURFO0FBRFMsT0FBZixDQUFQO0FBS0Q7OztXQThFRCxtQkFBaUI5QixLQUFqQixFQUFnRDtBQUM5QyxhQUFPLElBQUlKLFVBQUosQ0FBZStCLEtBQUssQ0FBQy9CLFVBQU4sQ0FBaUJtQyxNQUFqQixDQUF3Qi9CLEtBQXhCLENBQWYsQ0FBUDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHJvdG8gZnJvbSAnLi4vLi4vc3JjL3Byb3RvL21lc3NhZ2UnO1xuaW1wb3J0ICogYXMgc2VjcCBmcm9tICdAbm9ibGUvc2VjcDI1NmsxJztcbmltcG9ydCBTaWduYXR1cmUgZnJvbSAnLi9TaWduYXR1cmUnO1xuaW1wb3J0IFB1YmxpY0tleSBmcm9tICcuL1B1YmxpY0tleSc7XG5pbXBvcnQgQ2lwaGVydGV4dCBmcm9tICcuL0NpcGhlcnRleHQnO1xuaW1wb3J0IHsgZGVjcnlwdCwgZW5jcnlwdCB9IGZyb20gJy4vZW5jcnlwdGlvbic7XG5cbi8vIFByaXZhdGVLZXkgcmVwcmVzZW50cyBhIHNlY3AyNTZrMSBwcml2YXRlIGtleS5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByaXZhdGVLZXkgaW1wbGVtZW50cyBwcm90by5Qcml2YXRlS2V5IHtcbiAgc2VjcDI1NmsxOiBwcm90by5Qcml2YXRlS2V5X1NlY3AyNTZrMSB8IHVuZGVmaW5lZDtcbiAgcHVibGljS2V5OiBQdWJsaWNLZXk7IC8vIGNhY2hlcyBjb3JyZXNwb25kaW5nIFB1YmxpY0tleVxuXG4gIGNvbnN0cnVjdG9yKG9iajogcHJvdG8uUHJpdmF0ZUtleSkge1xuICAgIGlmICghb2JqLnNlY3AyNTZrMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHByaXZhdGUga2V5Jyk7XG4gICAgfVxuICAgIGlmIChvYmouc2VjcDI1NmsxLmJ5dGVzLmxlbmd0aCAhPT0gMzIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYGludmFsaWQgcHJpdmF0ZSBrZXkgbGVuZ3RoOiAke29iai5zZWNwMjU2azEuYnl0ZXMubGVuZ3RofWBcbiAgICAgICk7XG4gICAgfVxuICAgIHRoaXMuc2VjcDI1NmsxID0gb2JqLnNlY3AyNTZrMTtcbiAgICB0aGlzLnB1YmxpY0tleSA9IFB1YmxpY0tleS5mcm9tUHJpdmF0ZUtleSh0aGlzKTtcbiAgfVxuXG4gIC8vIGNyZWF0ZSBhIHJhbmRvbSBQcml2YXRlS2V5LlxuICBzdGF0aWMgZ2VuZXJhdGUoKTogUHJpdmF0ZUtleSB7XG4gICAgcmV0dXJuIG5ldyBQcml2YXRlS2V5KHtcbiAgICAgIHNlY3AyNTZrMToge1xuICAgICAgICBieXRlczogc2VjcC51dGlscy5yYW5kb21Qcml2YXRlS2V5KClcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIHNpZ24gcHJvdmlkZWQgZGlnZXN0XG4gIGFzeW5jIHNpZ24oZGlnZXN0OiBVaW50OEFycmF5KTogUHJvbWlzZTxTaWduYXR1cmU+IHtcbiAgICBpZiAoIXRoaXMuc2VjcDI1NmsxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgcHJpdmF0ZSBrZXknKTtcbiAgICB9XG4gICAgY29uc3QgW3NpZ25hdHVyZSwgcmVjb3ZlcnldID0gYXdhaXQgc2VjcC5zaWduKFxuICAgICAgZGlnZXN0LFxuICAgICAgdGhpcy5zZWNwMjU2azEuYnl0ZXMsXG4gICAgICB7XG4gICAgICAgIHJlY292ZXJlZDogdHJ1ZSxcbiAgICAgICAgZGVyOiBmYWxzZVxuICAgICAgfVxuICAgICk7XG4gICAgcmV0dXJuIG5ldyBTaWduYXR1cmUoe1xuICAgICAgZWNkc2FDb21wYWN0OiB7IGJ5dGVzOiBzaWduYXR1cmUsIHJlY292ZXJ5IH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIHNpZ24gcHJvdmlkZWQgcHVibGljIGtleVxuICBhc3luYyBzaWduS2V5KHB1YjogUHVibGljS2V5KTogUHJvbWlzZTxQdWJsaWNLZXk+IHtcbiAgICBpZiAoIXB1Yi5zZWNwMjU2azFVbmNvbXByZXNzZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBwdWJsaWMga2V5Jyk7XG4gICAgfVxuICAgIGNvbnN0IGRpZ2VzdCA9IGF3YWl0IHNlY3AudXRpbHMuc2hhMjU2KHB1Yi5zZWNwMjU2azFVbmNvbXByZXNzZWQuYnl0ZXMpO1xuICAgIHB1Yi5zaWduYXR1cmUgPSBhd2FpdCB0aGlzLnNpZ24oZGlnZXN0KTtcbiAgICByZXR1cm4gcHViO1xuICB9XG5cbiAgLy8gZGVyaXZlIHNoYXJlZCBzZWNyZXQgZnJvbSBwZWVyJ3MgUHVibGljS2V5O1xuICAvLyB0aGUgcGVlciBjYW4gZGVyaXZlIHRoZSBzYW1lIHNlY3JldCB1c2luZyB0aGVpciBQcml2YXRlS2V5IGFuZCBvdXIgUHVibGljS2V5XG4gIHNoYXJlZFNlY3JldChwZWVyOiBQdWJsaWNLZXkpOiBVaW50OEFycmF5IHtcbiAgICBpZiAoIXBlZXIuc2VjcDI1NmsxVW5jb21wcmVzc2VkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgcHVibGljIGtleScpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuc2VjcDI1NmsxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgcHJpdmF0ZSBrZXknKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlY3AuZ2V0U2hhcmVkU2VjcmV0KFxuICAgICAgdGhpcy5zZWNwMjU2azEuYnl0ZXMsXG4gICAgICBwZWVyLnNlY3AyNTZrMVVuY29tcHJlc3NlZC5ieXRlcyxcbiAgICAgIGZhbHNlXG4gICAgKTtcbiAgfVxuXG4gIC8vIGVuY3J5cHQgcGxhaW4gYnl0ZXMgdXNpbmcgYSBzaGFyZWQgc2VjcmV0IGRlcml2ZWQgZnJvbSBwZWVyJ3MgUHVibGljS2V5O1xuICAvLyBhZGRpdGlvbmFsRGF0YSBhbGxvd3MgaW5jbHVkaW5nIHVuZW5jcnlwdGVkIHBhcnRzIG9mIGEgTWVzc2FnZSBpbiB0aGUgYXV0aGVudGljYXRpb25cbiAgLy8gcHJvdGVjdGlvbiBwcm92aWRlZCBieSB0aGUgZW5jcnlwdGVkIHBhcnQgKHRvIG1ha2UgdGhlIHdob2xlIE1lc3NhZ2UgdGFtcGVyIGV2aWRlbnQpXG4gIGVuY3J5cHQoXG4gICAgcGxhaW46IFVpbnQ4QXJyYXksXG4gICAgcGVlcjogUHVibGljS2V5LFxuICAgIGFkZGl0aW9uYWxEYXRhPzogVWludDhBcnJheVxuICApOiBQcm9taXNlPENpcGhlcnRleHQ+IHtcbiAgICBjb25zdCBzZWNyZXQgPSB0aGlzLnNoYXJlZFNlY3JldChwZWVyKTtcbiAgICByZXR1cm4gZW5jcnlwdChwbGFpbiwgc2VjcmV0LCBhZGRpdGlvbmFsRGF0YSk7XG4gIH1cblxuICAvLyBkZWNyeXB0IENpcGhlcnRleHQgdXNpbmcgYSBzaGFyZWQgc2VjcmV0IGRlcml2ZWQgZnJvbSBwZWVyJ3MgUHVibGljS2V5O1xuICAvLyB0aHJvd3MgaWYgYW55IHBhcnQgb2YgQ2lwaGVydGV4dCBvciBhZGRpdGlvbmFsRGF0YSB3YXMgdGFtcGVyZWQgd2l0aFxuICBkZWNyeXB0KFxuICAgIGVuY3J5cHRlZDogQ2lwaGVydGV4dCxcbiAgICBwZWVyOiBQdWJsaWNLZXksXG4gICAgYWRkaXRpb25hbERhdGE/OiBVaW50OEFycmF5XG4gICk6IFByb21pc2U8VWludDhBcnJheT4ge1xuICAgIGNvbnN0IHNlY3JldCA9IHRoaXMuc2hhcmVkU2VjcmV0KHBlZXIpO1xuICAgIHJldHVybiBkZWNyeXB0KGVuY3J5cHRlZCwgc2VjcmV0LCBhZGRpdGlvbmFsRGF0YSk7XG4gIH1cblxuICAvLyBEb2VzIHRoZSBwcm92aWRlZCBQdWJsaWNLZXkgY29ycmVzcG5kIHRvIHRoaXMgUHJpdmF0ZUtleT9cbiAgbWF0Y2hlcyhrZXk6IFB1YmxpY0tleSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnB1YmxpY0tleS5lcXVhbHMoa2V5KTtcbiAgfVxuXG4gIHRvQnl0ZXMoKTogVWludDhBcnJheSB7XG4gICAgcmV0dXJuIHByb3RvLlByaXZhdGVLZXkuZW5jb2RlKHRoaXMpLmZpbmlzaCgpO1xuICB9XG5cbiAgc3RhdGljIGZyb21CeXRlcyhieXRlczogVWludDhBcnJheSk6IFByaXZhdGVLZXkge1xuICAgIHJldHVybiBuZXcgUHJpdmF0ZUtleShwcm90by5Qcml2YXRlS2V5LmRlY29kZShieXRlcykpO1xuICB9XG59XG4iXX0=