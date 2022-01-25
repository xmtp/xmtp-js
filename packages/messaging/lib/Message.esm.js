function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import * as proto from './proto/message';
import Ciphertext from './crypto/Ciphertext';
import { PublicKeyBundle, PublicKey } from './crypto';
import { decrypt as _decrypt, encrypt as _encrypt } from './crypto/encryption';

var Message = /*#__PURE__*/function () {
  function Message(obj) {
    _classCallCheck(this, Message);

    _defineProperty(this, "header", void 0);

    _defineProperty(this, "ciphertext", void 0);

    _defineProperty(this, "decrypted", void 0);

    this.header = obj.header;

    if (obj.ciphertext) {
      this.ciphertext = new Ciphertext(obj.ciphertext);
    }
  }

  _createClass(Message, [{
    key: "toBytes",
    value: function toBytes() {
      return proto.Message.encode(this).finish();
    }
  }], [{
    key: "fromBytes",
    value: function fromBytes(bytes) {
      return new Message(proto.Message.decode(bytes));
    } // encrypt and serialize the message

  }, {
    key: "encode",
    value: function () {
      var _encode = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(sender, recipient, message) {
        var bytes, ciphertext, msg;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                bytes = new TextEncoder().encode(message);
                _context.next = 3;
                return this.encrypt(bytes, sender, recipient);

              case 3:
                ciphertext = _context.sent;
                msg = new Message({
                  header: {
                    sender: sender.publicKeyBundle,
                    recipient: recipient
                  },
                  ciphertext: ciphertext
                });
                msg.decrypted = message;
                return _context.abrupt("return", msg);

              case 7:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function encode(_x, _x2, _x3) {
        return _encode.apply(this, arguments);
      }

      return encode;
    }() // deserialize and decrypt the message;
    // throws if any part of the messages (including the header) was tampered with

  }, {
    key: "decode",
    value: function () {
      var _decode = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(recipient, bytes) {
        var _message$header$recip, _message$ciphertext;

        var message, sender, ciphertext, msg;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                message = proto.Message.decode(bytes);

                if (message.header) {
                  _context2.next = 3;
                  break;
                }

                throw new Error('missing message header');

              case 3:
                if (message.header.sender) {
                  _context2.next = 5;
                  break;
                }

                throw new Error('missing message sender');

              case 5:
                if (message.header.sender.identityKey) {
                  _context2.next = 7;
                  break;
                }

                throw new Error('missing message sender identity key');

              case 7:
                if (message.header.sender.preKey) {
                  _context2.next = 9;
                  break;
                }

                throw new Error('missing message sender pre key');

              case 9:
                if (message.header.recipient) {
                  _context2.next = 11;
                  break;
                }

                throw new Error('missing message recipient');

              case 11:
                if ((_message$header$recip = message.header.recipient) !== null && _message$header$recip !== void 0 && _message$header$recip.preKey) {
                  _context2.next = 13;
                  break;
                }

                throw new Error('missing message recipient pre key');

              case 13:
                sender = new PublicKeyBundle(new PublicKey(message.header.sender.identityKey), new PublicKey(message.header.sender.preKey));

                if (recipient.preKey) {
                  _context2.next = 16;
                  break;
                }

                throw new Error('missing message recipient pre key');

              case 16:
                if (!(recipient.preKeys.length === 0)) {
                  _context2.next = 18;
                  break;
                }

                throw new Error('missing pre key');

              case 18:
                if (recipient.preKey.matches(new PublicKey(message.header.recipient.preKey))) {
                  _context2.next = 20;
                  break;
                }

                throw new Error('recipient pre-key mismatch');

              case 20:
                if ((_message$ciphertext = message.ciphertext) !== null && _message$ciphertext !== void 0 && _message$ciphertext.aes256GcmHkdfSha256) {
                  _context2.next = 22;
                  break;
                }

                throw new Error('missing message ciphertext');

              case 22:
                ciphertext = new Ciphertext(message.ciphertext);
                _context2.next = 25;
                return this.decrypt(ciphertext, sender, recipient);

              case 25:
                bytes = _context2.sent;
                msg = new Message(message);
                msg.decrypted = new TextDecoder().decode(bytes);
                return _context2.abrupt("return", msg);

              case 29:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function decode(_x4, _x5) {
        return _decode.apply(this, arguments);
      }

      return decode;
    }() // encrypt the plaintext with a symmetric key derived from the peers' key bundles.

  }, {
    key: "encrypt",
    value: function () {
      var _encrypt2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(plain, sender, recipient) {
        var secret, ad;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return sender.sharedSecret(recipient, false);

              case 2:
                secret = _context3.sent;
                ad = proto.Message_Header.encode({
                  sender: sender.publicKeyBundle,
                  recipient: recipient
                }).finish();
                return _context3.abrupt("return", _encrypt(plain, secret, ad));

              case 5:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      function encrypt(_x6, _x7, _x8) {
        return _encrypt2.apply(this, arguments);
      }

      return encrypt;
    }() // decrypt the encrypted content using a symmetric key derived from the peers' key bundles.

  }, {
    key: "decrypt",
    value: function () {
      var _decrypt2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(encrypted, sender, recipient) {
        var secret, ad;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return recipient.sharedSecret(sender, true);

              case 2:
                secret = _context4.sent;
                ad = proto.Message_Header.encode({
                  sender: sender,
                  recipient: recipient.publicKeyBundle
                }).finish();
                return _context4.abrupt("return", _decrypt(encrypted, secret, ad));

              case 5:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      function decrypt(_x9, _x10, _x11) {
        return _decrypt2.apply(this, arguments);
      }

      return decrypt;
    }()
  }]);

  return Message;
}();

export { Message as default };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9NZXNzYWdlLnRzIl0sIm5hbWVzIjpbInByb3RvIiwiQ2lwaGVydGV4dCIsIlB1YmxpY0tleUJ1bmRsZSIsIlB1YmxpY0tleSIsImRlY3J5cHQiLCJlbmNyeXB0IiwiTWVzc2FnZSIsIm9iaiIsImhlYWRlciIsImNpcGhlcnRleHQiLCJlbmNvZGUiLCJmaW5pc2giLCJieXRlcyIsImRlY29kZSIsInNlbmRlciIsInJlY2lwaWVudCIsIm1lc3NhZ2UiLCJUZXh0RW5jb2RlciIsIm1zZyIsInB1YmxpY0tleUJ1bmRsZSIsImRlY3J5cHRlZCIsIkVycm9yIiwiaWRlbnRpdHlLZXkiLCJwcmVLZXkiLCJwcmVLZXlzIiwibGVuZ3RoIiwibWF0Y2hlcyIsImFlczI1NkdjbUhrZGZTaGEyNTYiLCJUZXh0RGVjb2RlciIsInBsYWluIiwic2hhcmVkU2VjcmV0Iiwic2VjcmV0IiwiYWQiLCJNZXNzYWdlX0hlYWRlciIsImVuY3J5cHRlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsT0FBTyxLQUFLQSxLQUFaLE1BQXVCLGlCQUF2QjtBQUNBLE9BQU9DLFVBQVAsTUFBdUIscUJBQXZCO0FBQ0EsU0FBU0MsZUFBVCxFQUE0Q0MsU0FBNUMsUUFBNkQsVUFBN0Q7QUFDQSxTQUFTQyxPQUFPLElBQVBBLFFBQVQsRUFBa0JDLE9BQU8sSUFBUEEsUUFBbEIsUUFBaUMscUJBQWpDOztJQUVxQkMsTztBQUtuQixtQkFBWUMsR0FBWixFQUFnQztBQUFBOztBQUFBOztBQUFBOztBQUFBOztBQUM5QixTQUFLQyxNQUFMLEdBQWNELEdBQUcsQ0FBQ0MsTUFBbEI7O0FBQ0EsUUFBSUQsR0FBRyxDQUFDRSxVQUFSLEVBQW9CO0FBQ2xCLFdBQUtBLFVBQUwsR0FBa0IsSUFBSVIsVUFBSixDQUFlTSxHQUFHLENBQUNFLFVBQW5CLENBQWxCO0FBQ0Q7QUFDRjs7OztXQUVELG1CQUFzQjtBQUNwQixhQUFPVCxLQUFLLENBQUNNLE9BQU4sQ0FBY0ksTUFBZCxDQUFxQixJ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aUMsY0FBTixDQUFxQnZCLE1BQXJCLENBQTRCO0FBQ3JDSSxrQkFBQUEsTUFBTSxFQUFFQSxNQUFNLENBQUNLLGVBRHNCO0FBRXJDSixrQkFBQUEsU0FBUyxFQUFFQTtBQUYwQixpQkFBNUIsRUFHUkosTUFIUSxFQU5iO0FBQUEsa0RBVVNOLFFBQU8sQ0FBQ3dCLEtBQUQsRUFBUUUsTUFBUixFQUFnQkMsRUFBaEIsQ0FWaEI7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTzs7Ozs7OztRQWFBOzs7Ozs4RUFDQSxrQkFDRUUsU0FERixFQUVFcEIsTUFGRixFQUdFQyxTQUhGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsdUJBS3VCQSxTQUFTLENBQUNlLFlBQVYsQ0FBdUJoQixNQUF2QixFQUErQixJQUEvQixDQUx2Qjs7QUFBQTtBQUtRaUIsZ0JBQUFBLE1BTFI7QUFNUUMsZ0JBQUFBLEVBTlIsR0FNYWhDLEtBQUssQ0FBQ2lDLGNBQU4sQ0FBcUJ2QixNQUFyQixDQUE0QjtBQUNyQ0ksa0JBQUFBLE1BQU0sRUFBRUEsTUFENkI7QUFFckNDLGtCQUFBQSxTQUFTLEVBQUVBLFNBQVMsQ0FBQ0k7QUFGZ0IsaUJBQTVCLEVBR1JSLE1BSFEsRUFOYjtBQUFBLGtEQVVTUCxRQUFPLENBQUM4QixTQUFELEVBQVlILE1BQVosRUFBb0JDLEVBQXBCLENBVmhCOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLE87Ozs7Ozs7Ozs7Ozs7U0F4R21CMUIsTyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHByb3RvIGZyb20gJy4vcHJvdG8vbWVzc2FnZSc7XG5pbXBvcnQgQ2lwaGVydGV4dCBmcm9tICcuL2NyeXB0by9DaXBoZXJ0ZXh0JztcbmltcG9ydCB7IFB1YmxpY0tleUJ1bmRsZSwgUHJpdmF0ZUtleUJ1bmRsZSwgUHVibGljS2V5IH0gZnJvbSAnLi9jcnlwdG8nO1xuaW1wb3J0IHsgZGVjcnlwdCwgZW5jcnlwdCB9IGZyb20gJy4vY3J5cHRvL2VuY3J5cHRpb24nO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNZXNzYWdlIGltcGxlbWVudHMgcHJvdG8uTWVzc2FnZSB7XG4gIGhlYWRlcjogcHJvdG8uTWVzc2FnZV9IZWFkZXIgfCB1bmRlZmluZWQ7XG4gIGNpcGhlcnRleHQ6IENpcGhlcnRleHQgfCB1bmRlZmluZWQ7XG4gIGRlY3J5cHRlZDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKG9iajogcHJvdG8uTWVzc2FnZSkge1xuICAgIHRoaXMuaGVhZGVyID0gb2JqLmhlYWRlcjtcbiAgICBpZiAob2JqLmNpcGhlcnRleHQpIHtcbiAgICAgIHRoaXMuY2lwaGVydGV4dCA9IG5ldyBDaXBoZXJ0ZXh0KG9iai5jaXBoZXJ0ZXh0KTtcbiAgICB9XG4gIH1cblxuICB0b0J5dGVzKCk6IFVpbnQ4QXJyYXkge1xuICAgIHJldHVybiBwcm90by5NZXNzYWdlLmVuY29kZSh0aGlzKS5maW5pc2goKTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tQnl0ZXMoYnl0ZXM6IFVpbnQ4QXJyYXkpOiBNZXNzYWdlIHtcbiAgICByZXR1cm4gbmV3IE1lc3NhZ2UocHJvdG8uTWVzc2FnZS5kZWNvZGUoYnl0ZXMpKTtcbiAgfVxuXG4gIC8vIGVuY3J5cHQgYW5kIHNlcmlhbGl6ZSB0aGUgbWVzc2FnZVxuICBzdGF0aWMgYXN5bmMgZW5jb2RlKFxuICAgIHNlbmRlcjogUHJpdmF0ZUtleUJ1bmRsZSxcbiAgICByZWNpcGllbnQ6IFB1YmxpY0tleUJ1bmRsZSxcbiAgICBtZXNzYWdlOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxNZXNzYWdlPiB7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUobWVzc2FnZSk7XG4gICAgY29uc3QgY2lwaGVydGV4dCA9IGF3YWl0IHRoaXMuZW5jcnlwdChieXRlcywgc2VuZGVyLCByZWNpcGllbnQpO1xuICAgIGNvbnN0IG1zZyA9IG5ldyBNZXNzYWdlKHtcbiAgICAgIGhlYWRlcjoge1xuICAgICAgICBzZW5kZXI6IHNlbmRlci5wdWJsaWNLZXlCdW5kbGUsXG4gICAgICAgIHJlY2lwaWVudFxuICAgICAgfSxcbiAgICAgIGNpcGhlcnRleHRcbiAgICB9KTtcbiAgICBtc2cuZGVjcnlwdGVkID0gbWVzc2FnZTtcbiAgICByZXR1cm4gbXNnO1xuICB9XG5cbiAgLy8gZGVzZXJpYWxpemUgYW5kIGRlY3J5cHQgdGhlIG1lc3NhZ2U7XG4gIC8vIHRocm93cyBpZiBhbnkgcGFydCBvZiB0aGUgbWVzc2FnZXMgKGluY2x1ZGluZyB0aGUgaGVhZGVyKSB3YXMgdGFtcGVyZWQgd2l0aFxuICBzdGF0aWMgYXN5bmMgZGVjb2RlKFxuICAgIHJlY2lwaWVudDogUHJpdmF0ZUtleUJ1bmRsZSxcbiAgICBieXRlczogVWludDhBcnJheVxuICApOiBQcm9taXNlPE1lc3NhZ2U+IHtcbiAgICBjb25zdCBtZXNzYWdlID0gcHJvdG8uTWVzc2FnZS5kZWNvZGUoYnl0ZXMpO1xuICAgIGlmICghbWVzc2FnZS5oZWFkZXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyBtZXNzYWdlIGhlYWRlcicpO1xuICAgIH1cbiAgICBpZiAoIW1lc3NhZ2UuaGVhZGVyLnNlbmRlcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIG1lc3NhZ2Ugc2VuZGVyJyk7XG4gICAgfVxuICAgIGlmICghbWVzc2FnZS5oZWFkZXIuc2VuZGVyLmlkZW50aXR5S2V5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgbWVzc2FnZSBzZW5kZXIgaWRlbnRpdHkga2V5Jyk7XG4gICAgfVxuICAgIGlmICghbWVzc2FnZS5oZWFkZXIuc2VuZGVyLnByZUtleSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIG1lc3NhZ2Ugc2VuZGVyIHByZSBrZXknKTtcbiAgICB9XG4gICAgaWYgKCFtZXNzYWdlLmhlYWRlci5yZWNpcGllbnQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyBtZXNzYWdlIHJlY2lwaWVudCcpO1xuICAgIH1cbiAgICBpZiAoIW1lc3NhZ2UuaGVhZGVyLnJlY2lwaWVudD8ucHJlS2V5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgbWVzc2FnZSByZWNpcGllbnQgcHJlIGtleScpO1xuICAgIH1cbiAgICBjb25zdCBzZW5kZXIgPSBuZXcgUHVibGljS2V5QnVuZGxlKFxuICAgICAgbmV3IFB1YmxpY0tleShtZXNzYWdlLmhlYWRlci5zZW5kZXIuaWRlbnRpdHlLZXkpLFxuICAgICAgbmV3IFB1YmxpY0tleShtZXNzYWdlLmhlYWRlci5zZW5kZXIucHJlS2V5KVxuICAgICk7XG4gICAgaWYgKCFyZWNpcGllbnQucHJlS2V5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgbWVzc2FnZSByZWNpcGllbnQgcHJlIGtleScpO1xuICAgIH1cbiAgICBpZiAocmVjaXBpZW50LnByZUtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgcHJlIGtleScpO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICAhcmVjaXBpZW50LnByZUtleS5tYXRjaGVzKG5ldyBQdWJsaWNLZXkobWVzc2FnZS5oZWFkZXIucmVjaXBpZW50LnByZUtleSkpXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3JlY2lwaWVudCBwcmUta2V5IG1pc21hdGNoJyk7XG4gICAgfVxuICAgIGlmICghbWVzc2FnZS5jaXBoZXJ0ZXh0Py5hZXMyNTZHY21Ia2RmU2hhMjU2KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgbWVzc2FnZSBjaXBoZXJ0ZXh0Jyk7XG4gICAgfVxuICAgIGNvbnN0IGNpcGhlcnRleHQgPSBuZXcgQ2lwaGVydGV4dChtZXNzYWdlLmNpcGhlcnRleHQpO1xuICAgIGJ5dGVzID0gYXdhaXQgdGhpcy5kZWNyeXB0KGNpcGhlcnRleHQsIHNlbmRlciwgcmVjaXBpZW50KTtcbiAgICBjb25zdCBtc2cgPSBuZXcgTWVzc2FnZShtZXNzYWdlKTtcbiAgICBtc2cuZGVjcnlwdGVkID0gbmV3IFRleHREZWNvZGVyKCkuZGVjb2RlKGJ5dGVzKTtcbiAgICByZXR1cm4gbXNnO1xuICB9XG5cbiAgLy8gZW5jcnlwdCB0aGUgcGxhaW50ZXh0IHdpdGggYSBzeW1tZXRyaWMga2V5IGRlcml2ZWQgZnJvbSB0aGUgcGVlcnMnIGtleSBidW5kbGVzLlxuICBzdGF0aWMgYXN5bmMgZW5jcnlwdChcbiAgICBwbGFpbjogVWludDhBcnJheSxcbiAgICBzZW5kZXI6IFByaXZhdGVLZXlCdW5kbGUsXG4gICAgcmVjaXBpZW50OiBQdWJsaWNLZXlCdW5kbGVcbiAgKTogUHJvbWlzZTxDaXBoZXJ0ZXh0PiB7XG4gICAgY29uc3Qgc2VjcmV0ID0gYXdhaXQgc2VuZGVyLnNoYXJlZFNlY3JldChyZWNpcGllbnQsIGZhbHNlKTtcbiAgICBjb25zdCBhZCA9IHByb3RvLk1lc3NhZ2VfSGVhZGVyLmVuY29kZSh7XG4gICAgICBzZW5kZXI6IHNlbmRlci5wdWJsaWNLZXlCdW5kbGUsXG4gICAgICByZWNpcGllbnQ6IHJlY2lwaWVudFxuICAgIH0pLmZpbmlzaCgpO1xuICAgIHJldHVybiBlbmNyeXB0KHBsYWluLCBzZWNyZXQsIGFkKTtcbiAgfVxuXG4gIC8vIGRlY3J5cHQgdGhlIGVuY3J5cHRlZCBjb250ZW50IHVzaW5nIGEgc3ltbWV0cmljIGtleSBkZXJpdmVkIGZyb20gdGhlIHBlZXJzJyBrZXkgYnVuZGxlcy5cbiAgc3RhdGljIGFzeW5jIGRlY3J5cHQoXG4gICAgZW5jcnlwdGVkOiBDaXBoZXJ0ZXh0LFxuICAgIHNlbmRlcjogUHVibGljS2V5QnVuZGxlLFxuICAgIHJlY2lwaWVudDogUHJpdmF0ZUtleUJ1bmRsZVxuICApOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgICBjb25zdCBzZWNyZXQgPSBhd2FpdCByZWNpcGllbnQuc2hhcmVkU2VjcmV0KHNlbmRlciwgdHJ1ZSk7XG4gICAgY29uc3QgYWQgPSBwcm90by5NZXNzYWdlX0hlYWRlci5lbmNvZGUoe1xuICAgICAgc2VuZGVyOiBzZW5kZXIsXG4gICAgICByZWNpcGllbnQ6IHJlY2lwaWVudC5wdWJsaWNLZXlCdW5kbGVcbiAgICB9KS5maW5pc2goKTtcbiAgICByZXR1cm4gZGVjcnlwdChlbmNyeXB0ZWQsIHNlY3JldCwgYWQpO1xuICB9XG59XG4iXX0=