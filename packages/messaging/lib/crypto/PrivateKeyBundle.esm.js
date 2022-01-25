function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import * as proto from '../../src/proto/message';
import PrivateKey from './PrivateKey';
import PublicKeyBundle from './PublicKeyBundle';
import Ciphertext from './Ciphertext';
import { getRandomValues, hexToBytes } from './utils';
import { decrypt, encrypt } from './encryption'; // PrivateKeyBundle bundles the private keys corresponding to a PublicKeyBundle for convenience.
// This bundle must not be shared with anyone, although will have to be persisted
// somehow so that older messages can be decrypted again.

var PrivateKeyBundle = /*#__PURE__*/function () {
  function PrivateKeyBundle(identityKey, preKey) {
    _classCallCheck(this, PrivateKeyBundle);

    _defineProperty(this, "identityKey", void 0);

    _defineProperty(this, "preKeys", void 0);

    _defineProperty(this, "preKey", void 0);

    _defineProperty(this, "publicKeyBundle", void 0);

    this.identityKey = new PrivateKey(identityKey);
    this.preKey = preKey;
    this.preKeys = [preKey];
    this.publicKeyBundle = new PublicKeyBundle(this.identityKey.publicKey, this.preKey.publicKey);
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
                wPreKey = getRandomValues(new Uint8Array(32));
                _context2.t0 = hexToBytes;
                _context2.next = 9;
                return wallet.signMessage(wPreKey);

              case 9:
                _context2.t1 = _context2.sent;
                secret = (0, _context2.t0)(_context2.t1);
                _context2.next = 13;
                return encrypt(bytes, secret);

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
                identityKey = PrivateKey.generate();
                preKey = PrivateKey.generate();
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
                _context4.t0 = hexToBytes;
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
                ciphertext = new Ciphertext(encrypted.ciphertext);
                _context4.next = 13;
                return decrypt(ciphertext, secret);

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
                return _context4.abrupt("return", new PrivateKeyBundle(new PrivateKey(bundle.identityKey), new PrivateKey(bundle.preKeys[0])));

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

export { PrivateKeyBundle as default };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jcnlwdG8vUHJpdmF0ZUtleUJ1bmRsZS50cyJdLCJuYW1lcyI6WyJwcm90byIsIlByaXZhdGVLZXkiLCJQdWJsaWNLZXlCdW5kbGUiLCJDaXBoZXJ0ZXh0IiwiZ2V0UmFuZG9tVmFsdWVzIiwiaGV4VG9CeXRlcyIsImRlY3J5cHQiLCJlbmNyeXB0IiwiUHJpdmF0ZUtleUJ1bmRsZSIsImlkZW50aXR5S2V5IiwicHJlS2V5IiwicHJlS2V5cyIsInB1YmxpY0tleUJ1bmRsZSIsInB1YmxpY0tleSIsInBlZXIiLCJyZWNpcGllbnQiLCJFcnJvciIsInZlcmlmeUtleSIsImRoMSIsInNoYXJlZFNlY3JldCIsImRoMiIsImRoMyIsInNlY3JldCIsIlVpbnQ4QXJyYXkiLCJsZW5ndGgiLCJzZXQiLCJ3YWxsZXQiLCJieXRlcyIsImVuY29kZSIsImZpbmlzaCIsIndQcmVLZXkiLCJzaWduTWVzc2FnZSIsImNpcGhlcnRleHQiLCJFbmNyeXB0ZWRQcml2YXRlS2V5QnVuZGxlIiwid2FsbGV0UHJlS2V5IiwiZ2VuZXJhdGUiLCJzaWduS2V5IiwiZW5jcnlwdGVkIiwiZGVjb2RlIiwiYWVzMjU2R2NtSGtkZlNoYTI1NiIsImRlY3J5cHRlZCIsImJ1bmRsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsT0FBTyxLQUFLQSxLQUFaLE1BQXVCLHlCQUF2QjtBQUNBLE9BQU9DLFVBQVAsTUFBdUIsY0FBdkI7QUFDQSxPQUFPQyxlQUFQLE1BQTRCLG1CQUE1QjtBQUNBLE9BQU9DLFVBQVAsTUFBdUIsY0FBdkI7QUFFQSxTQUFTQyxlQUFULEVBQTBCQyxVQUExQixRQUE0QyxTQUE1QztBQUNBLFNBQVNDLE9BQVQsRUFBa0JDLE9BQWxCLFFBQWlDLGNBQWpDLEMsQ0FFQTtBQUNBO0FBQ0E7O0lBQ3FCQyxnQjtBQU1uQiw0QkFBWUMsV0FBWixFQUFxQ0MsTUFBckMsRUFBeUQ7QUFBQTs7QUFBQTs7QUFBQTs7QUFBQTs7QUFBQTs7QUFDdkQsU0FBS0Qs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QUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTzs7Ozs7Ozs7Ozs7OztTQTdFbUJILGdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHJvdG8gZnJvbSAnLi4vLi4vc3JjL3Byb3RvL21lc3NhZ2UnO1xuaW1wb3J0IFByaXZhdGVLZXkgZnJvbSAnLi9Qcml2YXRlS2V5JztcbmltcG9ydCBQdWJsaWNLZXlCdW5kbGUgZnJvbSAnLi9QdWJsaWNLZXlCdW5kbGUnO1xuaW1wb3J0IENpcGhlcnRleHQgZnJvbSAnLi9DaXBoZXJ0ZXh0JztcbmltcG9ydCAqIGFzIGV0aGVycyBmcm9tICdldGhlcnMnO1xuaW1wb3J0IHsgZ2V0UmFuZG9tVmFsdWVzLCBoZXhUb0J5dGVzIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBkZWNyeXB0LCBlbmNyeXB0IH0gZnJvbSAnLi9lbmNyeXB0aW9uJztcblxuLy8gUHJpdmF0ZUtleUJ1bmRsZSBidW5kbGVzIHRoZSBwcml2YXRlIGtleXMgY29ycmVzcG9uZGluZyB0byBhIFB1YmxpY0tleUJ1bmRsZSBmb3IgY29udmVuaWVuY2UuXG4vLyBUaGlzIGJ1bmRsZSBtdXN0IG5vdCBiZSBzaGFyZWQgd2l0aCBhbnlvbmUsIGFsdGhvdWdoIHdpbGwgaGF2ZSB0byBiZSBwZXJzaXN0ZWRcbi8vIHNvbWVob3cgc28gdGhhdCBvbGRlciBtZXNzYWdlcyBjYW4gYmUgZGVjcnlwdGVkIGFnYWluLlxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJpdmF0ZUtleUJ1bmRsZSBpbXBsZW1lbnRzIHByb3RvLlByaXZhdGVLZXlCdW5kbGUge1xuICBpZGVudGl0eUtleTogUHJpdmF0ZUtleSB8IHVuZGVmaW5lZDtcbiAgcHJlS2V5czogUHJpdmF0ZUtleVtdO1xuICBwcmVLZXk6IFByaXZhdGVLZXk7XG4gIHB1YmxpY0tleUJ1bmRsZTogUHVibGljS2V5QnVuZGxlO1xuXG4gIGNvbnN0cnVjdG9yKGlkZW50aXR5S2V5OiBQcml2YXRlS2V5LCBwcmVLZXk6IFByaXZhdGVLZXkpIHtcbiAgICB0aGlzLmlkZW50aXR5S2V5ID0gbmV3IFByaXZhdGVLZXkoaWRlbnRpdHlLZXkpO1xuICAgIHRoaXMucHJlS2V5ID0gcHJlS2V5O1xuICAgIHRoaXMucHJlS2V5cyA9IFtwcmVLZXldO1xuICAgIHRoaXMucHVibGljS2V5QnVuZGxlID0gbmV3IFB1YmxpY0tleUJ1bmRsZShcbiAgICAgIHRoaXMuaWRlbnRpdHlLZXkucHVibGljS2V5LFxuICAgICAgdGhpcy5wcmVLZXkucHVibGljS2V5XG4gICAgKTtcbiAgfVxuXG4gIC8vIEdlbmVyYXRlIGEgbmV3IGtleSBidW5kbGUgcGFpciB3aXRoIHRoZSBwcmVLZXkgc2lnbmVkIGJ5dCB0aGUgaWRlbnRpdHlLZXkuXG4gIHN0YXRpYyBhc3luYyBnZW5lcmF0ZSgpOiBQcm9taXNlPFByaXZhdGVLZXlCdW5kbGU+IHtcbiAgICBjb25zdCBpZGVudGl0eUtleSA9IFByaXZhdGVLZXkuZ2VuZXJhdGUoKTtcbiAgICBjb25zdCBwcmVLZXkgPSBQcml2YXRlS2V5LmdlbmVyYXRlKCk7XG4gICAgYXdhaXQgaWRlbnRpdHlLZXkuc2lnbktleShwcmVLZXkucHVibGljS2V5KTtcbiAgICByZXR1cm4gbmV3IFByaXZhdGVLZXlCdW5kbGUoaWRlbnRpdHlLZXksIHByZUtleSk7XG4gIH1cblxuICAvLyBzaGFyZWRTZWNyZXQgZGVyaXZlcyBhIHNlY3JldCBmcm9tIHBlZXIncyBrZXkgYnVuZGxlcyB1c2luZyBhIHZhcmlhdGlvbiBvZiBYM0RIIHByb3RvY29sXG4gIC8vIHdoZXJlIHRoZSBzZW5kZXIncyBlcGhlbWVyYWwga2V5IHBhaXIgaXMgcmVwbGFjZWQgYnkgdGhlIHNlbmRlcidzIHByZWtleS5cbiAgLy8gQHJlY2lwaWVudCBpbmRpY2F0ZXMgd2hldGhlciB0aGlzIGlzIHRoZSBzZW5kaW5nIChlbmNyeXB0aW5nKSBvciByZWNlaXZpbmcgKGRlY3J5cHRpbmcpIHNpZGUuXG4gIGFzeW5jIHNoYXJlZFNlY3JldChcbiAgICBwZWVyOiBQdWJsaWNLZXlCdW5kbGUsXG4gICAgcmVjaXBpZW50OiBib29sZWFuXG4gICk6IFByb21pc2U8VWludDhBcnJheT4ge1xuICAgIGlmICghcGVlci5pZGVudGl0eUtleSB8fCAhcGVlci5wcmVLZXkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBwZWVyIGtleSBidW5kbGUnKTtcbiAgICB9XG4gICAgaWYgKCEoYXdhaXQgcGVlci5pZGVudGl0eUtleS52ZXJpZnlLZXkocGVlci5wcmVLZXkpKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdwZWVyIHByZUtleSBzaWduYXR1cmUgaW52YWxpZCcpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuaWRlbnRpdHlLZXkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyBpZGVudGl0eSBrZXknKTtcbiAgICB9XG4gICAgbGV0IGRoMTogVWludDhBcnJheSwgZGgyOiBVaW50OEFycmF5O1xuICAgIGlmIChyZWNpcGllbnQpIHtcbiAgICAgIGRoMSA9IHRoaXMucHJlS2V5LnNoYXJlZFNlY3JldChwZWVyLmlkZW50aXR5S2V5KTtcbiAgICAgIGRoMiA9IHRoaXMuaWRlbnRpdHlLZXkuc2hhcmVkU2VjcmV0KHBlZXIucHJlS2V5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGgxID0gdGhpcy5pZGVudGl0eUtleS5zaGFyZWRTZWNyZXQocGVlci5wcmVLZXkpO1xuICAgICAgZGgyID0gdGhpcy5wcmVLZXkuc2hhcmVkU2VjcmV0KHBlZXIuaWRlbnRpdHlLZXkpO1xuICAgIH1cbiAgICBjb25zdCBkaDMgPSB0aGlzLnByZUtleS5zaGFyZWRTZWNyZXQocGVlci5wcmVLZXkpO1xuICAgIGNvbnN0IHNlY3JldCA9IG5ldyBVaW50OEFycmF5KGRoMS5sZW5ndGggKyBkaDIubGVuZ3RoICsgZGgzLmxlbmd0aCk7XG4gICAgc2VjcmV0LnNldChkaDEsIDApO1xuICAgIHNlY3JldC5zZXQoZGgyLCBkaDEubGVuZ3RoKTtcbiAgICBzZWNyZXQuc2V0KGRoMywgZGgxLmxlbmd0aCArIGRoMi5sZW5ndGgpO1xuICAgIHJldHVybiBzZWNyZXQ7XG4gIH1cblxuICBhc3luYyBlbmNvZGUod2FsbGV0OiBldGhlcnMuU2lnbmVyKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gICAgLy8gc2VyaWFsaXplIHRoZSBjb250ZW50c1xuICAgIGlmICh0aGlzLnByZUtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgcHJlIGtleScpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuaWRlbnRpdHlLZXkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyBpZGVudGl0eSBrZXknKTtcbiAgICB9XG4gICAgY29uc3QgYnl0ZXMgPSBwcm90by5Qcml2YXRlS2V5QnVuZGxlLmVuY29kZSh7XG4gICAgICBpZGVudGl0eUtleTogdGhpcy5pZGVudGl0eUtleSxcbiAgICAgIHByZUtleXM6IFt0aGlzLnByZUtleV1cbiAgICB9KS5maW5pc2goKTtcbiAgICBjb25zdCB3UHJlS2V5ID0gZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50OEFycmF5KDMyKSk7XG4gICAgY29uc3Qgc2VjcmV0ID0gaGV4VG9CeXRlcyhhd2FpdCB3YWxsZXQuc2lnbk1lc3NhZ2Uod1ByZUtleSkpO1xuICAgIGNvbnN0IGNpcGhlcnRleHQgPSBhd2FpdCBlbmNyeXB0KGJ5dGVzLCBzZWNyZXQpO1xuICAgIHJldHVybiBwcm90by5FbmNyeXB0ZWRQcml2YXRlS2V5QnVuZGxlLmVuY29kZSh7XG4gICAgICB3YWxsZXRQcmVLZXk6IHdQcmVLZXksXG4gICAgICBjaXBoZXJ0ZXh0XG4gICAgfSkuZmluaXNoKCk7XG4gIH1cblxuICBzdGF0aWMgYXN5bmMgZGVjb2RlKFxuICAgIHdhbGxldDogZXRoZXJzLlNpZ25lcixcbiAgICBieXRlczogVWludDhBcnJheVxuICApOiBQcm9taXNlPFByaXZhdGVLZXlCdW5kbGU+IHtcbiAgICBjb25zdCBlbmNyeXB0ZWQgPSBwcm90by5FbmNyeXB0ZWRQcml2YXRlS2V5QnVuZGxlLmRlY29kZShieXRlcyk7XG4gICAgaWYgKCFlbmNyeXB0ZWQud2FsbGV0UHJlS2V5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3Npbmcgd2FsbGV0IHByZS1rZXknKTtcbiAgICB9XG4gICAgY29uc3Qgc2VjcmV0ID0gaGV4VG9CeXRlcyhhd2FpdCB3YWxsZXQuc2lnbk1lc3NhZ2UoZW5jcnlwdGVkLndhbGxldFByZUtleSkpO1xuICAgIGlmICghZW5jcnlwdGVkLmNpcGhlcnRleHQ/LmFlczI1NkdjbUhrZGZTaGEyNTYpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyBidW5kbGUgY2lwaGVydGV4dCcpO1xuICAgIH1cbiAgICBjb25zdCBjaXBoZXJ0ZXh0ID0gbmV3IENpcGhlcnRleHQoZW5jcnlwdGVkLmNpcGhlcnRleHQpO1xuICAgIGNvbnN0IGRlY3J5cHRlZCA9IGF3YWl0IGRlY3J5cHQoY2lwaGVydGV4dCwgc2VjcmV0KTtcbiAgICBjb25zdCBidW5kbGUgPSBwcm90by5Qcml2YXRlS2V5QnVuZGxlLmRlY29kZShkZWNyeXB0ZWQpO1xuICAgIGlmICghYnVuZGxlLmlkZW50aXR5S2V5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgaWRlbnRpdHkga2V5Jyk7XG4gICAgfVxuICAgIGlmIChidW5kbGUucHJlS2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyBwcmUta2V5cycpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFByaXZhdGVLZXlCdW5kbGUoXG4gICAgICBuZXcgUHJpdmF0ZUtleShidW5kbGUuaWRlbnRpdHlLZXkpLFxuICAgICAgbmV3IFByaXZhdGVLZXkoYnVuZGxlLnByZUtleXNbMF0pXG4gICAgKTtcbiAgfVxufVxuIl19