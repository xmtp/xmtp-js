"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decrypt = decrypt;
exports.encrypt = encrypt;

var _Ciphertext = _interopRequireWildcard(require("./Ciphertext"));

var _utils = require("./utils");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var hkdfNoInfo = new ArrayBuffer(0);

function encrypt(_x, _x2, _x3) {
  return _encrypt.apply(this, arguments);
}

function _encrypt() {
  _encrypt = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(plain, secret, additionalData) {
    var salt, nonce, key, encrypted;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            salt = _utils.crypto.getRandomValues(new Uint8Array(_Ciphertext.KDFSaltSize));
            nonce = _utils.crypto.getRandomValues(new Uint8Array(_Ciphertext.AESGCMNonceSize));
            _context.next = 4;
            return hkdf(secret, salt);

          case 4:
            key = _context.sent;
            _context.next = 7;
            return _utils.crypto.subtle.encrypt(aesGcmParams(nonce, additionalData), key, plain);

          case 7:
            encrypted = _context.sent;
            return _context.abrupt("return", new _Ciphertext["default"]({
              aes256GcmHkdfSha256: {
                payload: new Uint8Array(encrypted),
                hkdfSalt: salt,
                gcmNonce: nonce
              }
            }));

          case 9:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _encrypt.apply(this, arguments);
}

function decrypt(_x4, _x5, _x6) {
  return _decrypt.apply(this, arguments);
}

function _decrypt() {
  _decrypt = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(encrypted, secret, additionalData) {
    var key, decrypted;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (encrypted.aes256GcmHkdfSha256) {
              _context2.next = 2;
              break;
            }

            throw new Error('invalid payload ciphertext');

          case 2:
            _context2.next = 4;
            return hkdf(secret, encrypted.aes256GcmHkdfSha256.hkdfSalt);

          case 4:
            key = _context2.sent;
            _context2.next = 7;
            return _utils.crypto.subtle.decrypt(aesGcmParams(encrypted.aes256GcmHkdfSha256.gcmNonce, additionalData), key, encrypted.aes256GcmHkdfSha256.payload);

          case 7:
            decrypted = _context2.sent;
            return _context2.abrupt("return", new Uint8Array(decrypted));

          case 9:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _decrypt.apply(this, arguments);
}

function aesGcmParams(nonce, additionalData) {
  var spec = {
    name: 'AES-GCM',
    iv: nonce
  };

  if (additionalData) {
    spec.additionalData = additionalData;
  }

  return spec;
} // Derive AES-256-GCM key from a shared secret and salt.
// Returns crypto.CryptoKey suitable for the encrypt/decrypt API


function hkdf(_x7, _x8) {
  return _hkdf.apply(this, arguments);
}

function _hkdf() {
  _hkdf = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(secret, salt) {
    var key;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return _utils.crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveKey']);

          case 2:
            key = _context3.sent;
            return _context3.abrupt("return", _utils.crypto.subtle.deriveKey({
              name: 'HKDF',
              hash: 'SHA-256',
              salt: salt,
              info: hkdfNoInfo
            }, key, {
              name: 'AES-GCM',
              length: 256
            }, false, ['encrypt', 'decrypt']));

          case 4:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _hkdf.apply(this, arguments);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jcnlwdG8vZW5jcnlwdGlvbi50cyJdLCJuYW1lcyI6WyJoa2RmTm9JbmZvIiwiQXJyYXlCdWZmZXIiLCJlbmNyeXB0IiwicGxhaW4iLCJzZWNyZXQiLCJhZGRpdGlvbmFsRGF0YSIsInNhbHQiLCJjcnlwdG8iLCJnZXRSYW5kb21WYWx1ZXMiLCJVaW50OEFycmF5IiwiS0RGU2FsdFNpemUiLCJub25jZSIsIkFFU0dDTU5vbmNlU2l6ZSIsImhrZGYiLCJrZXkiLCJzdWJ0bGUiLCJhZXNHY21QYXJhbXMiLCJlbmNyeXB0ZWQiLCJDaXBoZXJ0ZXh0IiwiYWVzMjU2R2NtSGtkZlNoYTI1NiIsInBheWxvYWQiLCJoa2RmU2FsdCIsImdjbU5vbmNlIiwiZGVjcnlwdCIsIkVycm9yIiwiZGVjcnlwdGVkIiwic3BlYyIsIm5hbWUiLCJpdiIsImltcG9ydEtleSIsImRlcml2ZUtleSIsImhhc2giLCJpbmZvIiwibGVuZ3RoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7Ozs7Ozs7QUFFQSxJQUFNQSxVQUFVLEdBQUcsSUFBSUMsV0FBSixDQUFnQixDQUFoQixDQUFuQjs7U0FFc0JDLE87Ozs7O3FFQUFmLGlCQUNMQyxLQURLLEVBRUxDLE1BRkssRUFHTEMsY0FISztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFLQ0MsWUFBQUEsSUFMRCxHQUtRQyxjQUFPQyxlQUFQLENBQXVCLElBQUlDLFVBQUosQ0FBZUMsdUJBQWYsQ0FBdkIsQ0FMUjtBQU1DQyxZQUFBQSxLQU5ELEdBTVNKLGNBQU9DLGVBQVAsQ0FBdUIsSUFBSUMsVUFBSixDQUFlRywyQkFBZixDQUF2QixDQU5UO0FBQUE7QUFBQSxtQkFPYUMsSUFBSSxDQUFDVCxNQUFELEVBQVNFLElBQVQsQ0FQakI7O0FBQUE7QUFPQ1EsWUFBQUEsR0FQRDtBQUFBO0FBQUEsbUJBUWdDUCxjQUFPUSxNQUFQLENBQWNiLE9BQWQsQ0FDbkNjLFlBQVksQ0FBQ0wsS0FBRCxFQUFRTixjQUFSLENBRHVCLEVBRW5DUyxHQUZtQyxFQUduQ1gsS0FIbUMsQ0FSaEM7O0FBQUE7QUFRQ2MsWUFBQUEsU0FSRDtBQUFBLDZDQWFFLElBQUlDLHNCQUFKLENBQWU7QUFDcEJDLGNBQUFBLG1CQUFtQixFQUFFO0FBQ25CQyxnQkFBQUEsT0FBTyxFQUFFLElBQUlYLFVBQUosQ0FBZVEsU0FBZixDQURVO0FBRW5CSSxnQkFBQUEsUUFBUSxFQUFFZixJQUZTO0FBR25CZ0IsZ0JBQUFBLFFBQVEsRUFBRVg7QUFIUztBQURELGFBQWYsQ0FiRjs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxHOzs7O1NBc0JlWSxPOzs7OztxRUFBZixrQkFDTE4sU0FESyxFQUVMYixNQUZLLEVBR0xDLGNBSEs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsZ0JBS0FZLFNBQVMsQ0FBQ0UsbUJBTFY7QUFBQTtBQUFBO0FBQUE7O0FBQUEsa0JBTUcsSUFBSUssS0FBSixDQUFVLDRCQUFWLENBTkg7O0FBQUE7QUFBQTtBQUFBLG1CQVFhWCxJQUFJLENBQUNULE1BQUQsRUFBU2EsU0FBUyxDQUFDRSxtQkFBVixDQUE4QkUsUUFBdkMsQ0FSakI7O0FBQUE7QUFRQ1AsWUFBQUEsR0FSRDtBQUFBO0FBQUEsbUJBU2dDUCxjQUFPUSxNQUFQLENBQWNRLE9BQWQsQ0FDbkNQLFlBQVksQ0FBQ0MsU0FBUyxDQUFDRSxtQkFBVixDQUE4QkcsUUFBL0IsRUFBeUNqQixjQUF6QyxDQUR1QixFQUVuQ1MsR0FGbUMsRUFHbkNHLFNBQVMsQ0FBQ0UsbUJBQVYsQ0FBOEJDLE9BSEssQ0FUaEM7O0FBQUE7QUFTQ0ssWUFBQUEsU0FURDtBQUFBLDhDQWNFLElBQUloQixVQUFKLENBQWVnQixTQUFmLENBZEY7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRzs7OztBQWlCUCxTQUFTVCxZQUFULENBQ0VMLEtBREYsRUFFRU4sY0FGRixFQUdnQjtBQUNkLE1BQU1xQixJQUFrQixHQUFHO0FBQ3pCQyxJQUFBQSxJQUFJLEVBQUUsU0FEbUI7QUFFekJDLElBQUFBLEVBQUUsRUFBRWpCO0FBRnFCLEdBQTNCOztBQUlBLE1BQUlOLGNBQUosRUFBb0I7QUFDbEJxQixJQUFBQSxJQUFJLENBQUNyQixjQUFMLEdBQXNCQSxjQUF0QjtBQUNEOztBQUNELFNBQU9xQixJQUFQO0FBQ0QsQyxDQUVEO0FBQ0E7OztTQUNlYixJOzs7OztrRUFBZixrQkFBb0JULE1BQXBCLEVBQXdDRSxJQUF4QztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUNvQkMsY0FBT1EsTUFBUCxDQUFjYyxTQUFkLENBQXdCLEtBQXhCLEVBQStCekIsTUFBL0IsRUFBdUMsTUFBdkMsRUFBK0MsS0FBL0MsRUFBc0QsQ0FDdEUsV0FEc0UsQ0FBdEQsQ0FEcEI7O0FBQUE7QUFDUVUsWUFBQUEsR0FEUjtBQUFBLDhDQUlTUCxjQUFPUSxNQUFQLENBQWNlLFNBQWQsQ0FDTDtBQUFFSCxjQUFBQSxJQUFJLEVBQUUsTUFBUjtBQUFnQkksY0FBQUEsSUFBSSxFQUFFLFNBQXRCO0FBQWlDekIsY0FBQUEsSUFBSSxFQUFFQSxJQUF2QztBQUE2QzBCLGNBQUFBLElBQUksRUFBRWhDO0FBQW5ELGFBREssRUFFTGMsR0FGSyxFQUdMO0FBQUVhLGNBQUFBLElBQUksRUFBRSxTQUFSO0FBQW1CTSxjQUFBQSxNQUFNLEVBQUU7QUFBM0IsYUFISyxFQUlMLEtBSkssRUFLTCxDQUFDLFNBQUQsRUFBWSxTQUFaLENBTEssQ0FKVDs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxHIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IENpcGhlcnRleHQsIHsgQUVTR0NNTm9uY2VTaXplLCBLREZTYWx0U2l6ZSB9IGZyb20gJy4vQ2lwaGVydGV4dCc7XG5pbXBvcnQgeyBjcnlwdG8gfSBmcm9tICcuL3V0aWxzJztcblxuY29uc3QgaGtkZk5vSW5mbyA9IG5ldyBBcnJheUJ1ZmZlcigwKTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuY3J5cHQoXG4gIHBsYWluOiBVaW50OEFycmF5LFxuICBzZWNyZXQ6IFVpbnQ4QXJyYXksXG4gIGFkZGl0aW9uYWxEYXRhPzogVWludDhBcnJheVxuKTogUHJvbWlzZTxDaXBoZXJ0ZXh0PiB7XG4gIGNvbnN0IHNhbHQgPSBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50OEFycmF5KEtERlNhbHRTaXplKSk7XG4gIGNvbnN0IG5vbmNlID0gY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheShBRVNHQ01Ob25jZVNpemUpKTtcbiAgY29uc3Qga2V5ID0gYXdhaXQgaGtkZihzZWNyZXQsIHNhbHQpO1xuICBjb25zdCBlbmNyeXB0ZWQ6IEFycmF5QnVmZmVyID0gYXdhaXQgY3J5cHRvLnN1YnRsZS5lbmNyeXB0KFxuICAgIGFlc0djbVBhcmFtcyhub25jZSwgYWRkaXRpb25hbERhdGEpLFxuICAgIGtleSxcbiAgICBwbGFpblxuICApO1xuICByZXR1cm4gbmV3IENpcGhlcnRleHQoe1xuICAgIGFlczI1NkdjbUhrZGZTaGEyNTY6IHtcbiAgICAgIHBheWxvYWQ6IG5ldyBVaW50OEFycmF5KGVuY3J5cHRlZCksXG4gICAgICBoa2RmU2FsdDogc2FsdCxcbiAgICAgIGdjbU5vbmNlOiBub25jZVxuICAgIH1cbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWNyeXB0KFxuICBlbmNyeXB0ZWQ6IENpcGhlcnRleHQsXG4gIHNlY3JldDogVWludDhBcnJheSxcbiAgYWRkaXRpb25hbERhdGE/OiBVaW50OEFycmF5XG4pOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgaWYgKCFlbmNyeXB0ZWQuYWVzMjU2R2NtSGtkZlNoYTI1Nikge1xuICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBwYXlsb2FkIGNpcGhlcnRleHQnKTtcbiAgfVxuICBjb25zdCBrZXkgPSBhd2FpdCBoa2RmKHNlY3JldCwgZW5jcnlwdGVkLmFlczI1NkdjbUhrZGZTaGEyNTYuaGtkZlNhbHQpO1xuICBjb25zdCBkZWNyeXB0ZWQ6IEFycmF5QnVmZmVyID0gYXdhaXQgY3J5cHRvLnN1YnRsZS5kZWNyeXB0KFxuICAgIGFlc0djbVBhcmFtcyhlbmNyeXB0ZWQuYWVzMjU2R2NtSGtkZlNoYTI1Ni5nY21Ob25jZSwgYWRkaXRpb25hbERhdGEpLFxuICAgIGtleSxcbiAgICBlbmNyeXB0ZWQuYWVzMjU2R2NtSGtkZlNoYTI1Ni5wYXlsb2FkXG4gICk7XG4gIHJldHVybiBuZXcgVWludDhBcnJheShkZWNyeXB0ZWQpO1xufVxuXG5mdW5jdGlvbiBhZXNHY21QYXJhbXMoXG4gIG5vbmNlOiBVaW50OEFycmF5LFxuICBhZGRpdGlvbmFsRGF0YT86IFVpbnQ4QXJyYXlcbik6IEFlc0djbVBhcmFtcyB7XG4gIGNvbnN0IHNwZWM6IEFlc0djbVBhcmFtcyA9IHtcbiAgICBuYW1lOiAnQUVTLUdDTScsXG4gICAgaXY6IG5vbmNlXG4gIH07XG4gIGlmIChhZGRpdGlvbmFsRGF0YSkge1xuICAgIHNwZWMuYWRkaXRpb25hbERhdGEgPSBhZGRpdGlvbmFsRGF0YTtcbiAgfVxuICByZXR1cm4gc3BlYztcbn1cblxuLy8gRGVyaXZlIEFFUy0yNTYtR0NNIGtleSBmcm9tIGEgc2hhcmVkIHNlY3JldCBhbmQgc2FsdC5cbi8vIFJldHVybnMgY3J5cHRvLkNyeXB0b0tleSBzdWl0YWJsZSBmb3IgdGhlIGVuY3J5cHQvZGVjcnlwdCBBUElcbmFzeW5jIGZ1bmN0aW9uIGhrZGYoc2VjcmV0OiBVaW50OEFycmF5LCBzYWx0OiBVaW50OEFycmF5KTogUHJvbWlzZTxDcnlwdG9LZXk+IHtcbiAgY29uc3Qga2V5ID0gYXdhaXQgY3J5cHRvLnN1YnRsZS5pbXBvcnRLZXkoJ3JhdycsIHNlY3JldCwgJ0hLREYnLCBmYWxzZSwgW1xuICAgICdkZXJpdmVLZXknXG4gIF0pO1xuICByZXR1cm4gY3J5cHRvLnN1YnRsZS5kZXJpdmVLZXkoXG4gICAgeyBuYW1lOiAnSEtERicsIGhhc2g6ICdTSEEtMjU2Jywgc2FsdDogc2FsdCwgaW5mbzogaGtkZk5vSW5mbyB9LFxuICAgIGtleSxcbiAgICB7IG5hbWU6ICdBRVMtR0NNJywgbGVuZ3RoOiAyNTYgfSxcbiAgICBmYWxzZSxcbiAgICBbJ2VuY3J5cHQnLCAnZGVjcnlwdCddXG4gICk7XG59XG4iXX0=