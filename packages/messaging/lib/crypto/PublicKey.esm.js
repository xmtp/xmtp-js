function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import * as proto from '../../src/proto/message';
import * as secp from '@noble/secp256k1';
import Signature from './Signature';
import { hexToBytes } from './utils';
import { keccak_256 as keccak256 } from '@noble/hashes/sha3';
import * as ethers from 'ethers'; // PublicKey respresents uncompressed secp256k1 public key,
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
      this.signature = new Signature(obj.signature);
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
                r = hexToBytes(eSig.r);
                s = hexToBytes(eSig.s);
                sigBytes = new Uint8Array(64);
                sigBytes.set(r);
                sigBytes.set(s, r.length);
                this.signature = new Signature({
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

      var digest = hexToBytes(ethers.utils.hashMessage(this.secp256k1Uncompressed.bytes));
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
      var bytes = keccak256(key).subarray(-20);
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

export { PublicKey as default };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jcnlwdG8vUHVibGljS2V5LnRzIl0sIm5hbWVzIjpbInByb3RvIiwic2VjcCIsIlNpZ25hdHVyZSIsImhleFRvQnl0ZXMiLCJrZWNjYWtfMjU2Iiwia2VjY2FrMjU2IiwiZXRoZXJzIiwiUHVibGljS2V5Iiwib2JqIiwic2VjcDI1NmsxVW5jb21wcmVzc2VkIiwiYnl0ZXMiLCJFcnJvciIsImxlbmd0aCIsInNpZ25hdHVyZSIsImRpZ2VzdCIsImVjZHNhQ29tcGFjdCIsInZlcmlmeSIsInB1YiIsInVuZGVmaW5lZCIsInV0aWxzIiwic2hhMjU2Iiwid2FsbGV0Iiwic2lnbk1lc3NhZ2UiLCJzaWdTdHJpbmciLCJlU2lnIiwic3BsaXRTaWduYXR1cmUiLCJyIiwicyIsInNpZ0J5dGVzIiwiVWludDhBcnJheSIsInNldCIsInJlY292ZXJ5IiwicmVjb3ZlcnlQYXJhbSIsImhhc2hNZXNzYWdlIiwicGsiLCJnZXRQdWJsaWNLZXkiLCJjb21wdXRlQWRkcmVzcyIsImtleSIsInNsaWNlIiwic3ViYXJyYXkiLCJieXRlc1RvSGV4Iiwib3RoZXIiLCJpIiwiZW5jb2RlIiwiZmluaXNoIiwicHJpIiwic2VjcDI1NmsxIiwiZGVjb2RlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLE9BQU8sS0FBS0EsS0FBWixNQUF1Qix5QkFBdkI7QUFDQSxPQUFPLEtBQUtDLElBQVosTUFBc0Isa0JBQXRCO0FBQ0EsT0FBT0MsU0FBUCxNQUFzQixhQUF0QjtBQUVBLFNBQVNDLFVBQVQsUUFBMkIsU0FBM0I7QUFDQSxTQUFTQyxVQUFVLElBQUlDLFNBQXZCLFFBQXdDLG9CQUF4QztBQUNBLE9BQU8sS0FBS0MsTUFBWixNQUF3QixRQUF4QixDLENBRUE7QUFDQTs7SUFDcUJDLFM7QUFJbkIscUJBQVlDLEdBQVosRUFBa0M7QUFBQTs7QUFBQTs7QUFBQTs7QUFBQTs7QUFDaEMsUUFBSSxFQUFDQSxHQUFELGFBQUNBLEdBQUQsd0NBQUNBLEdBQUcsQ0FB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Y0FBTSxJQUFJbkMsS0FBSixDQUFVLHFCQUFWLENBQU47QUFDRDs7QUFDRCxhQUFPLElBQUlKLFNBQUosQ0FBYztBQUNuQkUsUUFBQUEscUJBQXFCLEVBQUU7QUFDckJDLFVBQUFBLEtBQUssRUFBRVQsSUFBSSxDQUFDa0MsWUFBTCxDQUFrQlUsR0FBRyxDQUFDQyxTQUFKLENBQWNwQyxLQUFoQztBQURjO0FBREosT0FBZCxDQUFQO0FBS0Q7OztXQXdHRCxtQkFBaUJBLEtBQWpCLEVBQStDO0FBQzdDLGFBQU8sSUFBSUgsU0FBSixDQUFjUCxLQUFLLENBQUNPLFNBQU4sQ0FBZ0J3QyxNQUFoQixDQUF1QnJDLEtBQXZCLENBQWQsQ0FBUDtBQUNEOzs7Ozs7U0E1SWtCSCxTIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHJvdG8gZnJvbSAnLi4vLi4vc3JjL3Byb3RvL21lc3NhZ2UnO1xuaW1wb3J0ICogYXMgc2VjcCBmcm9tICdAbm9ibGUvc2VjcDI1NmsxJztcbmltcG9ydCBTaWduYXR1cmUgZnJvbSAnLi9TaWduYXR1cmUnO1xuaW1wb3J0IFByaXZhdGVLZXkgZnJvbSAnLi9Qcml2YXRlS2V5JztcbmltcG9ydCB7IGhleFRvQnl0ZXMgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7IGtlY2Nha18yNTYgYXMga2VjY2FrMjU2IH0gZnJvbSAnQG5vYmxlL2hhc2hlcy9zaGEzJztcbmltcG9ydCAqIGFzIGV0aGVycyBmcm9tICdldGhlcnMnO1xuXG4vLyBQdWJsaWNLZXkgcmVzcHJlc2VudHMgdW5jb21wcmVzc2VkIHNlY3AyNTZrMSBwdWJsaWMga2V5LFxuLy8gdGhhdCBjYW4gb3B0aW9uYWxseSBiZSBzaWduZWQgd2l0aCBhbm90aGVyIHRydXN0ZWQga2V5IHBhaXIuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQdWJsaWNLZXkgaW1wbGVtZW50cyBwcm90by5QdWJsaWNLZXkge1xuICBzZWNwMjU2azFVbmNvbXByZXNzZWQ6IHByb3RvLlB1YmxpY0tleV9TZWNwMjU2azFVbmNvbXByZXNlZCB8IHVuZGVmaW5lZDtcbiAgc2lnbmF0dXJlPzogU2lnbmF0dXJlIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKG9iajogcHJvdG8uUHVibGljS2V5KSB7XG4gICAgaWYgKCFvYmo/LnNlY3AyNTZrMVVuY29tcHJlc3NlZD8uYnl0ZXMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBwdWJsaWMga2V5Jyk7XG4gICAgfVxuICAgIGlmIChvYmouc2VjcDI1NmsxVW5jb21wcmVzc2VkLmJ5dGVzLmxlbmd0aCAhPT0gNjUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYGludmFsaWQgcHVibGljIGtleSBsZW5ndGg6ICR7b2JqLnNlY3AyNTZrMVVuY29tcHJlc3NlZC5ieXRlcy5sZW5ndGh9YFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKG9iai5zZWNwMjU2azFVbmNvbXByZXNzZWQuYnl0ZXNbMF0gIT09IDQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYHVucmVjb2duaXplZCBwdWJsaWMga2V5IHByZWZpeDogJHtvYmouc2VjcDI1NmsxVW5jb21wcmVzc2VkLmJ5dGVzWzBdfWBcbiAgICAgICk7XG4gICAgfVxuICAgIHRoaXMuc2VjcDI1NmsxVW5jb21wcmVzc2VkID0gb2JqLnNlY3AyNTZrMVVuY29tcHJlc3NlZDtcbiAgICBpZiAob2JqLnNpZ25hdHVyZSkge1xuICAgICAgdGhpcy5zaWduYXR1cmUgPSBuZXcgU2lnbmF0dXJlKG9iai5zaWduYXR1cmUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGNyZWF0ZSBQdWJsaWNLZXkgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgcHJvdmlkZWQgUHVibGljS2V5XG4gIHN0YXRpYyBmcm9tUHJpdmF0ZUtleShwcmk6IFByaXZhdGVLZXkpOiBQdWJsaWNLZXkge1xuICAgIGlmICghcHJpLnNlY3AyNTZrMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHByaXZhdGUga2V5Jyk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgUHVibGljS2V5KHtcbiAgICAgIHNlY3AyNTZrMVVuY29tcHJlc3NlZDoge1xuICAgICAgICBieXRlczogc2VjcC5nZXRQdWJsaWNLZXkocHJpLnNlY3AyNTZrMS5ieXRlcylcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIHZlcmlmeSB0aGF0IFNpZ25hdHVyZSB3YXMgY3JlYXRlZCBmcm9tIHByb3ZpZGVkIGRpZ2VzdCB1c2luZyB0aGUgY29ycmVzcG9uZGluZyBQcml2YXRlS2V5XG4gIHZlcmlmeShzaWduYXR1cmU6IFNpZ25hdHVyZSwgZGlnZXN0OiBVaW50OEFycmF5KTogYm9vbGVhbiB7XG4gICAgaWYgKCF0aGlzLnNlY3AyNTZrMVVuY29tcHJlc3NlZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIXNpZ25hdHVyZS5lY2RzYUNvbXBhY3QpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHNlY3AudmVyaWZ5KFxuICAgICAgc2lnbmF0dXJlLmVjZHNhQ29tcGFjdC5ieXRlcyxcbiAgICAgIGRpZ2VzdCxcbiAgICAgIHRoaXMuc2VjcDI1NmsxVW5jb21wcmVzc2VkLmJ5dGVzXG4gICAgKTtcbiAgfVxuXG4gIC8vIHZlcmlmeSB0aGF0IHRoZSBwcm92aWRlZCBQdWJsaWNLZXkgd2FzIHNpZ25lZCBieSB0aGUgY29ycmVzcG9uZGluZyBQcml2YXRlS2V5XG4gIGFzeW5jIHZlcmlmeUtleShwdWI6IFB1YmxpY0tleSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0eXBlb2YgcHViLnNpZ25hdHVyZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghcHViLnNlY3AyNTZrMVVuY29tcHJlc3NlZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBkaWdlc3QgPSBhd2FpdCBzZWNwLnV0aWxzLnNoYTI1NihwdWIuc2VjcDI1NmsxVW5jb21wcmVzc2VkLmJ5dGVzKTtcbiAgICByZXR1cm4gcHViLnNpZ25hdHVyZSA/IHRoaXMudmVyaWZ5KHB1Yi5zaWduYXR1cmUsIGRpZ2VzdCkgOiBmYWxzZTtcbiAgfVxuXG4gIC8vIHNpZ24gdGhlIGtleSB1c2luZyBhIHdhbGxldFxuICBhc3luYyBzaWduV2l0aFdhbGxldCh3YWxsZXQ6IGV0aGVycy5TaWduZXIpIHtcbiAgICBpZiAoIXRoaXMuc2VjcDI1NmsxVW5jb21wcmVzc2VkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgcHVibGljIGtleScpO1xuICAgIH1cbiAgICBjb25zdCBzaWdTdHJpbmcgPSBhd2FpdCB3YWxsZXQuc2lnbk1lc3NhZ2UoXG4gICAgICB0aGlzLnNlY3AyNTZrMVVuY29tcHJlc3NlZC5ieXRlc1xuICAgICk7XG4gICAgY29uc3QgZVNpZyA9IGV0aGVycy51dGlscy5zcGxpdFNpZ25hdHVyZShzaWdTdHJpbmcpO1xuICAgIGNvbnN0IHIgPSBoZXhUb0J5dGVzKGVTaWcucik7XG4gICAgY29uc3QgcyA9IGhleFRvQnl0ZXMoZVNpZy5zKTtcbiAgICBjb25zdCBzaWdCeXRlcyA9IG5ldyBVaW50OEFycmF5KDY0KTtcbiAgICBzaWdCeXRlcy5zZXQocik7XG4gICAgc2lnQnl0ZXMuc2V0KHMsIHIubGVuZ3RoKTtcbiAgICB0aGlzLnNpZ25hdHVyZSA9IG5ldyBTaWduYXR1cmUoe1xuICAgICAgZWNkc2FDb21wYWN0OiB7XG4gICAgICAgIGJ5dGVzOiBzaWdCeXRlcyxcbiAgICAgICAgcmVjb3Zlcnk6IGVTaWcucmVjb3ZlcnlQYXJhbVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gaWYgdGhlIGtleSB3YXMgc2lnbmVkIGJ5IGEgd2FsbGV0LCBhbmQgdGhlIHNpZ25hdHVyZSBpcyB2YWxpZCxcbiAgLy8gdGhlbiByZXR1cm4gdGhlIHdhbGxldCBhZGRyZXNzLCBvdGhlcndpc2UgdGhyb3dcbiAgd2FsbGV0U2lnbmF0dXJlQWRkcmVzcygpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5zaWduYXR1cmUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigna2V5IGlzIG5vdCBzaWduZWQnKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLnNlY3AyNTZrMVVuY29tcHJlc3NlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIHB1YmxpYyBrZXknKTtcbiAgICB9XG4gICAgY29uc3QgZGlnZXN0ID0gaGV4VG9CeXRlcyhcbiAgICAgIGV0aGVycy51dGlscy5oYXNoTWVzc2FnZSh0aGlzLnNlY3AyNTZrMVVuY29tcHJlc3NlZC5ieXRlcylcbiAgICApO1xuICAgIGNvbnN0IHBrID0gdGhpcy5zaWduYXR1cmUuZ2V0UHVibGljS2V5KGRpZ2VzdCk7XG4gICAgaWYgKCFwaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdrZXkgd2FzIG5vdCBzaWduZWQgYnkgYSB3YWxsZXQnKTtcbiAgICB9XG4gICAgaWYgKCFway5zZWNwMjU2azFVbmNvbXByZXNzZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyBwdWJsaWMga2V5Jyk7XG4gICAgfVxuICAgIHJldHVybiBldGhlcnMudXRpbHMuY29tcHV0ZUFkZHJlc3MocGsuc2VjcDI1NmsxVW5jb21wcmVzc2VkLmJ5dGVzKTtcbiAgfVxuXG4gIC8vIGRlcml2ZSBFdGhlcmV1bSBhZGRyZXNzIGZyb20gdGhpcyBQdWJsaWNLZXlcbiAgZ2V0RXRoZXJldW1BZGRyZXNzKCk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLnNlY3AyNTZrMVVuY29tcHJlc3NlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIHB1YmxpYyBrZXknKTtcbiAgICB9XG4gICAgLy8gZHJvcCB0aGUgdW5jb21wcmVzc2VkIGZvcm1hdCBwcmVmaXggYnl0ZVxuICAgIGNvbnN0IGtleSA9IHRoaXMuc2VjcDI1NmsxVW5jb21wcmVzc2VkLmJ5dGVzLnNsaWNlKDEpO1xuICAgIGNvbnN0IGJ5dGVzID0ga2VjY2FrMjU2KGtleSkuc3ViYXJyYXkoLTIwKTtcbiAgICByZXR1cm4gJzB4JyArIHNlY3AudXRpbHMuYnl0ZXNUb0hleChieXRlcyk7XG4gIH1cblxuICAvLyBpcyBvdGhlciB0aGUgc2FtZS9lcXVpdmFsZW50IFB1YmxpY0tleT9cbiAgZXF1YWxzKG90aGVyOiBQdWJsaWNLZXkpOiBib29sZWFuIHtcbiAgICBpZiAoIXRoaXMuc2VjcDI1NmsxVW5jb21wcmVzc2VkIHx8ICFvdGhlci5zZWNwMjU2azFVbmNvbXByZXNzZWQpIHtcbiAgICAgIHJldHVybiAhdGhpcy5zZWNwMjU2azFVbmNvbXByZXNzZWQgJiYgIW90aGVyLnNlY3AyNTZrMVVuY29tcHJlc3NlZDtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnNlY3AyNTZrMVVuY29tcHJlc3NlZC5ieXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLnNlY3AyNTZrMVVuY29tcHJlc3NlZC5ieXRlc1tpXSAhPT1cbiAgICAgICAgb3RoZXIuc2VjcDI1NmsxVW5jb21wcmVzc2VkLmJ5dGVzW2ldXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHRvQnl0ZXMoKTogVWludDhBcnJheSB7XG4gICAgcmV0dXJuIHByb3RvLlB1YmxpY0tleS5lbmNvZGUodGhpcykuZmluaXNoKCk7XG4gIH1cblxuICBzdGF0aWMgZnJvbUJ5dGVzKGJ5dGVzOiBVaW50OEFycmF5KTogUHVibGljS2V5IHtcbiAgICByZXR1cm4gbmV3IFB1YmxpY0tleShwcm90by5QdWJsaWNLZXkuZGVjb2RlKGJ5dGVzKSk7XG4gIH1cbn1cbiJdfQ==