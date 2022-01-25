"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var proto = _interopRequireWildcard(require("../../src/proto/message"));

var secp = _interopRequireWildcard(require("@noble/secp256k1"));

var _Signature = _interopRequireDefault(require("./Signature"));

var _utils = require("./utils");

var _sha = require("@noble/hashes/sha3");

var ethers = _interopRequireWildcard(require("ethers"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// PublicKey respresents uncompressed secp256k1 public key,
// that can optionally be signed with another trusted key pair.
var PublicKey = /*#__PURE__*/function () {
  function PublicKey(obj) {
    var _obj$secp256k1Uncompr;

    _classCallCheck(this, PublicKey);

    _defineProperty(this, "secp256k1Uncompressed", void 0);

    _defineProperty(this, "signature", void 0);

    if (!(obj !== null && obj !== void 0 && (_obj$secp256k1Uncompr = obj.secp256k1Uncompressed) !== null && _obj$secp256k1Uncompr !== void 0 && _obj$secp256k1Uncompr.bytes)) {
      throw new Error('invalid public key');
    }

    if (obj.secp256k1Uncompressed.bytes.length !== 65) {
      throw new Error("invalid public key length: ".concat(obj.secp256k1Uncompressed.bytes.length));
    }

    if (obj.secp256k1Uncompressed.bytes[0] !== 4) {
      throw new Error("unrecognized public key prefix: ".concat(obj.secp256k1Uncompressed.bytes[0]));
    }

    this.secp256k1Uncompressed = obj.secp256k1Uncompressed;

    if (obj.signature) {
      this.signature = new _Signature["default"](obj.signature);
    }
  } // create PublicKey that corresponds to the provided PublicKey


  _createClass(PublicKey, [{
    key: "verify",
    value: // verify that Signature was created from provided digest using the corresponding PrivateKey
    function verify(signature, digest) {
      if (!this.secp256k1Uncompressed) {
        return false;
      }

      if (!signature.ecdsaCompact) {
        return false;
      }

      return secp.verify(signature.ecdsaCompact.bytes, digest, this.secp256k1Uncompressed.bytes);
    } // verify that the provided PublicKey was signed by the corresponding PrivateKey

  }, {
    key: "verifyKey",
    value: function () {
      var _verifyKey = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(pub) {
        var digest;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(_typeof(pub.signature) === undefined)) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return", false);

              case 2:
                if (pub.secp256k1Uncompressed) {
                  _context.next = 4;
                  break;
                }

                return _context.abrupt("return", false);

              case 4:
                _context.next = 6;
                return secp.utils.sha256(pub.secp256k1Uncompressed.bytes);

              case 6:
                digest = _context.sent;
                return _context.abrupt("return", pub.signature ? this.verify(pub.signature, digest) : false);

              case 8:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function verifyKey(_x) {
        return _verifyKey.apply(this, arguments);
      }

      return verifyKey;
    }() // sign the key using a wallet

  }, {
    key: "signWithWallet",
    value: function () {
      var _signWithWallet = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(wallet) {
        var sigString, eSig, r, s, sigBytes;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (this.secp256k1Uncompressed) {
                  _context2.next = 2;
                  break;
                }

                throw new Error('missing public key');

              case 2:
                _context2.next = 4;
                return wallet.signMessage(this.secp256k1Uncompressed.bytes);

              case 4:
                sigString = _context2.sent;
                eSig = ethers.utils.splitSignature(sigString);
                r = (0, _utils.hexToBytes)(eSig.r);
                s = (0, _utils.hexToBytes)(eSig.s);
                sigBytes = new Uint8Array(64);
                sigBytes.set(r);
                sigBytes.set(s, r.length);
                this.signature = new _Signature["default"]({
                  ecdsaCompact: {
                    bytes: sigBytes,
                    recovery: eSig.recoveryParam
                  }
                });

              case 12:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function signWithWallet(_x2) {
        return _signWithWallet.apply(this, arguments);
      }

      return signWithWallet;
    }() // if the key was signed by a wallet, and the signature is valid,
    // then return the wallet address, otherwise throw

  }, {
    key: "walletSignatureAddress",
    value: function walletSignatureAddress() {
      if (!this.signature) {
        throw new Error('key is not signed');
      }

      if (!this.secp256k1Uncompressed) {
        throw new Error('missing public key');
      }

      var digest = (0, _utils.hexToBytes)(ethers.utils.hashMessage(this.secp256k1Uncompressed.bytes));
      var pk = this.signature.getPublicKey(digest);

      if (!pk) {
        throw new Error('key was not signed by a wallet');
      }

      if (!pk.secp256k1Uncompressed) {
        throw new Error('missing public key');
      }

      return ethers.utils.computeAddress(pk.secp256k1Uncompressed.bytes);
    } // derive Ethereum address from this PublicKey

  }, {
    key: "getEthereumAddress",
    value: function getEthereumAddress() {
      if (!this.secp256k1Uncompressed) {
        throw new Error('missing public key');
      } // drop the uncompressed format prefix byte


      var key = this.secp256k1Uncompressed.bytes.slice(1);
      var bytes = (0, _sha.keccak_256)(key).subarray(-20);
      return '0x' + secp.utils.bytesToHex(bytes);
    } // is other the same/equivalent PublicKey?

  }, {
    key: "equals",
    value: function equals(other) {
      if (!this.secp256k1Uncompressed || !other.secp256k1Uncompressed) {
        return !this.secp256k1Uncompressed && !other.secp256k1Uncompressed;
      }

      for (var i = 0; i < this.secp256k1Uncompressed.bytes.length; i++) {
        if (this.secp256k1Uncompressed.bytes[i] !== other.secp256k1Uncompressed.bytes[i]) {
          return false;
        }
      }

      return true;
    }
  }, {
    key: "toBytes",
    value: function toBytes() {
      return proto.PublicKey.encode(this).finish();
    }
  }], [{
    key: "fromPrivateKey",
    value: function fromPrivateKey(pri) {
      if (!pri.secp256k1) {
        throw new Error('invalid private key');
      }

      return new PublicKey({
        secp256k1Uncompressed: {
          bytes: secp.getPublicKey(pri.secp256k1.bytes)
        }
      });
    }
  }, {
    key: "fromBytes",
    value: function fromBytes(bytes) {
      return new PublicKey(proto.PublicKey.decode(bytes));
    }
  }]);

  return PublicKey;
}();

exports["default"] = PublicKey;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jcnlwdG8vUHVibGljS2V5LnRzIl0sIm5hbWVzIjpbIlB1YmxpY0tleSIsIm9iaiIsInNlY3AyNTZrMVVuY29tcHJlc3NlZCIsImJ5dGVzIiwiRXJyb3IiLCJsZW5ndGgiLCJzaWduYXR1cmUiLCJTaWduYXR1cmUiLCJkaWdlc3QiLCJlY2RzYUNvbXBhY3QiLCJzZWNwIiwidmVyaWZ5IiwicHViIiwidW5kZWZpbmVkIiwidXRpbHMiLCJzaGEyNTYiLCJ3YWxsZXQiLCJzaWduTWVzc2FnZSIsInNpZ1N0cmluZyIsImVTaWciLCJldGhlcnMiLCJzcGxpdFNpZ25hdHVyZSIsInIiLCJzIiwic2lnQnl0ZXMiLCJVaW50OEFycmF5Iiwic2V0IiwicmVjb3ZlcnkiLCJyZWNvdmVyeVBhcmFtIiwiaGFzaE1lc3NhZ2UiLCJwayIsImdldFB1YmxpY0tleSIsImNvbXB1dGVBZGRyZXNzIiwia2V5Iiwic2xpY2UiLCJzdWJhcnJheSIsImJ5dGVzVG9IZXgiLCJvdGhlciIsImkiLCJwcm90byIsImVuY29kZSIsImZpbmlzaCIsInByaSIsInNlY3AyNTZrMSIsImRlY29kZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7QUFDQTtJQUNxQkEsUztBQUluQixxQkFBWUMsR0FBWixFQUFrQztBQUFBOztBQUFBOztBQUFBOztBQUFBOztBQUNoQyxRQUFJLEVBQUNBLEdBQUQsYUFBQ0EsR0FBRCx3Q0FBQ0EsR0FBRyxDQUFFQyxxQkFBTixrREFBQyxzQkFBNEJDLEtBQTdCLENBQUosRUFBd0M7QUFDdEMsWUFBTSxJQUFJQyxLQUFKLENBQVUsb0JBQVYsQ0FBTjtBQUNEOztBQUNELFFBQUlILEdBQUcsQ0FBQ0MscUJBQUosQ0FBMEJDLEtBQTFCLENBQWdDRSxNQUFoQyxLQUEyQyxFQUEvQyxFQUFtRDtBQUNqRCxZQUFNLElBQUlELEtBQUosc0NBQzBCSCxHQUFH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QUM3QyxhQUFPLElBQUlILFNBQUosQ0FBY3VDLEtBQUssQ0FBQ3ZDLFNBQU4sQ0FBZ0I0QyxNQUFoQixDQUF1QnpDLEtBQXZCLENBQWQsQ0FBUDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHJvdG8gZnJvbSAnLi4vLi4vc3JjL3Byb3RvL21lc3NhZ2UnO1xuaW1wb3J0ICogYXMgc2VjcCBmcm9tICdAbm9ibGUvc2VjcDI1NmsxJztcbmltcG9ydCBTaWduYXR1cmUgZnJvbSAnLi9TaWduYXR1cmUnO1xuaW1wb3J0IFByaXZhdGVLZXkgZnJvbSAnLi9Qcml2YXRlS2V5JztcbmltcG9ydCB7IGhleFRvQnl0ZXMgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7IGtlY2Nha18yNTYgYXMga2VjY2FrMjU2IH0gZnJvbSAnQG5vYmxlL2hhc2hlcy9zaGEzJztcbmltcG9ydCAqIGFzIGV0aGVycyBmcm9tICdldGhlcnMnO1xuXG4vLyBQdWJsaWNLZXkgcmVzcHJlc2VudHMgdW5jb21wcmVzc2VkIHNlY3AyNTZrMSBwdWJsaWMga2V5LFxuLy8gdGhhdCBjYW4gb3B0aW9uYWxseSBiZSBzaWduZWQgd2l0aCBhbm90aGVyIHRydXN0ZWQga2V5IHBhaXIuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQdWJsaWNLZXkgaW1wbGVtZW50cyBwcm90by5QdWJsaWNLZXkge1xuICBzZWNwMjU2azFVbmNvbXByZXNzZWQ6IHByb3RvLlB1YmxpY0tleV9TZWNwMjU2azFVbmNvbXByZXNlZCB8IHVuZGVmaW5lZDtcbiAgc2lnbmF0dXJlPzogU2lnbmF0dXJlIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKG9iajogcHJvdG8uUHVibGljS2V5KSB7XG4gICAgaWYgKCFvYmo/LnNlY3AyNTZrMVVuY29tcHJlc3NlZD8uYnl0ZXMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBwdWJsaWMga2V5Jyk7XG4gICAgfVxuICAgIGlmIChvYmouc2VjcDI1NmsxVW5jb21wcmVzc2VkLmJ5dGVzLmxlbmd0aCAhPT0gNjUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYGludmFsaWQgcHVibGljIGtleSBsZW5ndGg6ICR7b2JqLnNlY3AyNTZrMVVuY29tcHJlc3NlZC5ieXRlcy5sZW5ndGh9YFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKG9iai5zZWNwMjU2azFVbmNvbXByZXNzZWQuYnl0ZXNbMF0gIT09IDQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYHVucmVjb2duaXplZCBwdWJsaWMga2V5IHByZWZpeDogJHtvYmouc2VjcDI1NmsxVW5jb21wcmVzc2VkLmJ5dGVzWzBdfWBcbiAgICAgICk7XG4gICAgfVxuICAgIHRoaXMuc2VjcDI1NmsxVW5jb21wcmVzc2VkID0gb2JqLnNlY3AyNTZrMVVuY29tcHJlc3NlZDtcbiAgICBpZiAob2JqLnNpZ25hdHVyZSkge1xuICAgICAgdGhpcy5zaWduYXR1cmUgPSBuZXcgU2lnbmF0dXJlKG9iai5zaWduYXR1cmUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGNyZWF0ZSBQdWJsaWNLZXkgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgcHJvdmlkZWQgUHVibGljS2V5XG4gIHN0YXRpYyBmcm9tUHJpdmF0ZUtleShwcmk6IFByaXZhdGVLZXkpOiBQdWJsaWNLZXkge1xuICAgIGlmICghcHJpLnNlY3AyNTZrMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHByaXZhdGUga2V5Jyk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgUHVibGljS2V5KHtcbiAgICAgIHNlY3AyNTZrMVVuY29tcHJlc3NlZDoge1xuICAgICAgICBieXRlczogc2VjcC5nZXRQdWJsaWNLZXkocHJpLnNlY3AyNTZrMS5ieXRlcylcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIHZlcmlmeSB0aGF0IFNpZ25hdHVyZSB3YXMgY3JlYXRlZCBmcm9tIHByb3ZpZGVkIGRpZ2VzdCB1c2luZyB0aGUgY29ycmVzcG9uZGluZyBQcml2YXRlS2V5XG4gIHZlcmlmeShzaWduYXR1cmU6IFNpZ25hdHVyZSwgZGlnZXN0OiBVaW50OEFycmF5KTogYm9vbGVhbiB7XG4gICAgaWYgKCF0aGlzLnNlY3AyNTZrMVVuY29tcHJlc3NlZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIXNpZ25hdHVyZS5lY2RzYUNvbXBhY3QpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHNlY3AudmVyaWZ5KFxuICAgICAgc2lnbmF0dXJlLmVjZHNhQ29tcGFjdC5ieXRlcyxcbiAgICAgIGRpZ2VzdCxcbiAgICAgIHRoaXMuc2VjcDI1NmsxVW5jb21wcmVzc2VkLmJ5dGVzXG4gICAgKTtcbiAgfVxuXG4gIC8vIHZlcmlmeSB0aGF0IHRoZSBwcm92aWRlZCBQdWJsaWNLZXkgd2FzIHNpZ25lZCBieSB0aGUgY29ycmVzcG9uZGluZyBQcml2YXRlS2V5XG4gIGFzeW5jIHZlcmlmeUtleShwdWI6IFB1YmxpY0tleSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0eXBlb2YgcHViLnNpZ25hdHVyZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghcHViLnNlY3AyNTZrMVVuY29tcHJlc3NlZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBkaWdlc3QgPSBhd2FpdCBzZWNwLnV0aWxzLnNoYTI1NihwdWIuc2VjcDI1NmsxVW5jb21wcmVzc2VkLmJ5dGVzKTtcbiAgICByZXR1cm4gcHViLnNpZ25hdHVyZSA/IHRoaXMudmVyaWZ5KHB1Yi5zaWduYXR1cmUsIGRpZ2VzdCkgOiBmYWxzZTtcbiAgfVxuXG4gIC8vIHNpZ24gdGhlIGtleSB1c2luZyBhIHdhbGxldFxuICBhc3luYyBzaWduV2l0aFdhbGxldCh3YWxsZXQ6IGV0aGVycy5TaWduZXIpIHtcbiAgICBpZiAoIXRoaXMuc2VjcDI1NmsxVW5jb21wcmVzc2VkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgcHVibGljIGtleScpO1xuICAgIH1cbiAgICBjb25zdCBzaWdTdHJpbmcgPSBhd2FpdCB3YWxsZXQuc2lnbk1lc3NhZ2UoXG4gICAgICB0aGlzLnNlY3AyNTZrMVVuY29tcHJlc3NlZC5ieXRlc1xuICAgICk7XG4gICAgY29uc3QgZVNpZyA9IGV0aGVycy51dGlscy5zcGxpdFNpZ25hdHVyZShzaWdTdHJpbmcpO1xuICAgIGNvbnN0IHIgPSBoZXhUb0J5dGVzKGVTaWcucik7XG4gICAgY29uc3QgcyA9IGhleFRvQnl0ZXMoZVNpZy5zKTtcbiAgICBjb25zdCBzaWdCeXRlcyA9IG5ldyBVaW50OEFycmF5KDY0KTtcbiAgICBzaWdCeXRlcy5zZXQocik7XG4gICAgc2lnQnl0ZXMuc2V0KHMsIHIubGVuZ3RoKTtcbiAgICB0aGlzLnNpZ25hdHVyZSA9IG5ldyBTaWduYXR1cmUoe1xuICAgICAgZWNkc2FDb21wYWN0OiB7XG4gICAgICAgIGJ5dGVzOiBzaWdCeXRlcyxcbiAgICAgICAgcmVjb3Zlcnk6IGVTaWcucmVjb3ZlcnlQYXJhbVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gaWYgdGhlIGtleSB3YXMgc2lnbmVkIGJ5IGEgd2FsbGV0LCBhbmQgdGhlIHNpZ25hdHVyZSBpcyB2YWxpZCxcbiAgLy8gdGhlbiByZXR1cm4gdGhlIHdhbGxldCBhZGRyZXNzLCBvdGhlcndpc2UgdGhyb3dcbiAgd2FsbGV0U2lnbmF0dXJlQWRkcmVzcygpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5zaWduYXR1cmUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigna2V5IGlzIG5vdCBzaWduZWQnKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLnNlY3AyNTZrMVVuY29tcHJlc3NlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIHB1YmxpYyBrZXknKTtcbiAgICB9XG4gICAgY29uc3QgZGlnZXN0ID0gaGV4VG9CeXRlcyhcbiAgICAgIGV0aGVycy51dGlscy5oYXNoTWVzc2FnZSh0aGlzLnNlY3AyNTZrMVVuY29tcHJlc3NlZC5ieXRlcylcbiAgICApO1xuICAgIGNvbnN0IHBrID0gdGhpcy5zaWduYXR1cmUuZ2V0UHVibGljS2V5KGRpZ2VzdCk7XG4gICAgaWYgKCFwaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdrZXkgd2FzIG5vdCBzaWduZWQgYnkgYSB3YWxsZXQnKTtcbiAgICB9XG4gICAgaWYgKCFway5zZWNwMjU2azFVbmNvbXByZXNzZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyBwdWJsaWMga2V5Jyk7XG4gICAgfVxuICAgIHJldHVybiBldGhlcnMudXRpbHMuY29tcHV0ZUFkZHJlc3MocGsuc2VjcDI1NmsxVW5jb21wcmVzc2VkLmJ5dGVzKTtcbiAgfVxuXG4gIC8vIGRlcml2ZSBFdGhlcmV1bSBhZGRyZXNzIGZyb20gdGhpcyBQdWJsaWNLZXlcbiAgZ2V0RXRoZXJldW1BZGRyZXNzKCk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLnNlY3AyNTZrMVVuY29tcHJlc3NlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIHB1YmxpYyBrZXknKTtcbiAgICB9XG4gICAgLy8gZHJvcCB0aGUgdW5jb21wcmVzc2VkIGZvcm1hdCBwcmVmaXggYnl0ZVxuICAgIGNvbnN0IGtleSA9IHRoaXMuc2VjcDI1NmsxVW5jb21wcmVzc2VkLmJ5dGVzLnNsaWNlKDEpO1xuICAgIGNvbnN0IGJ5dGVzID0ga2VjY2FrMjU2KGtleSkuc3ViYXJyYXkoLTIwKTtcbiAgICByZXR1cm4gJzB4JyArIHNlY3AudXRpbHMuYnl0ZXNUb0hleChieXRlcyk7XG4gIH1cblxuICAvLyBpcyBvdGhlciB0aGUgc2FtZS9lcXVpdmFsZW50IFB1YmxpY0tleT9cbiAgZXF1YWxzKG90aGVyOiBQdWJsaWNLZXkpOiBib29sZWFuIHtcbiAgICBpZiAoIXRoaXMuc2VjcDI1NmsxVW5jb21wcmVzc2VkIHx8ICFvdGhlci5zZWNwMjU2azFVbmNvbXByZXNzZWQpIHtcbiAgICAgIHJldHVybiAhdGhpcy5zZWNwMjU2azFVbmNvbXByZXNzZWQgJiYgIW90aGVyLnNlY3AyNTZrMVVuY29tcHJlc3NlZDtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnNlY3AyNTZrMVVuY29tcHJlc3NlZC5ieXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLnNlY3AyNTZrMVVuY29tcHJlc3NlZC5ieXRlc1tpXSAhPT1cbiAgICAgICAgb3RoZXIuc2VjcDI1NmsxVW5jb21wcmVzc2VkLmJ5dGVzW2ldXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHRvQnl0ZXMoKTogVWludDhBcnJheSB7XG4gICAgcmV0dXJuIHByb3RvLlB1YmxpY0tleS5lbmNvZGUodGhpcykuZmluaXNoKCk7XG4gIH1cblxuICBzdGF0aWMgZnJvbUJ5dGVzKGJ5dGVzOiBVaW50OEFycmF5KTogUHVibGljS2V5IHtcbiAgICByZXR1cm4gbmV3IFB1YmxpY0tleShwcm90by5QdWJsaWNLZXkuZGVjb2RlKGJ5dGVzKSk7XG4gIH1cbn1cbiJdfQ==