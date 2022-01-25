function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

import Ciphertext, { AESGCMNonceSize, KDFSaltSize } from './Ciphertext';
import { crypto } from './utils';
var hkdfNoInfo = new ArrayBuffer(0);
export function encrypt(_x, _x2, _x3) {
  return _encrypt.apply(this, arguments);
}

function _encrypt() {
  _encrypt = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(plain, secret, additionalData) {
    var salt, nonce, key, encrypted;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            salt = crypto.getRandomValues(new Uint8Array(KDFSaltSize));
            nonce = crypto.getRandomValues(new Uint8Array(AESGCMNonceSize));
            _context.next = 4;
            return hkdf(secret, salt);

          case 4:
            key = _context.sent;
            _context.next = 7;
            return crypto.subtle.encrypt(aesGcmParams(nonce, additionalData), key, plain);

          case 7:
            encrypted = _context.sent;
            return _context.abrupt("return", new Ciphertext({
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

export function decrypt(_x4, _x5, _x6) {
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
            return crypto.subtle.decrypt(aesGcmParams(encrypted.aes256GcmHkdfSha256.gcmNonce, additionalData), key, encrypted.aes256GcmHkdfSha256.payload);

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
            return crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveKey']);

          case 2:
            key = _context3.sent;
            return _context3.abrupt("return", crypto.subtle.deriveKey({
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jcnlwdG8vZW5jcnlwdGlvbi50cyJdLCJuYW1lcyI6WyJDaXBoZXJ0ZXh0IiwiQUVTR0NNTm9uY2VTaXplIiwiS0RGU2FsdFNpemUiLCJjcnlwdG8iLCJoa2RmTm9JbmZvIiwiQXJyYXlCdWZmZXIiLCJlbmNyeXB0IiwicGxhaW4iLCJzZWNyZXQiLCJhZGRpdGlvbmFsRGF0YSIsInNhbHQiLCJnZXRSYW5kb21WYWx1ZXMiLCJVaW50OEFycmF5Iiwibm9uY2UiLCJoa2RmIiwia2V5Iiwic3VidGxlIiwiYWVzR2NtUGFyYW1zIiwiZW5jcnlwdGVkIiwiYWVzMjU2R2NtSGtkZlNoYTI1NiIsInBheWxvYWQiLCJoa2RmU2FsdCIsImdjbU5vbmNlIiwiZGVjcnlwdCIsIkVycm9yIiwiZGVjcnlwdGVkIiwic3BlYyIsIm5hbWUiLCJpdiIsImltcG9ydEtleSIsImRlcml2ZUtleSIsImhhc2giLCJpbmZvIiwibGVuZ3RoIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUEsT0FBT0EsVUFBUCxJQUFxQkMsZUFBckIsRUFBc0NDLFdBQXRDLFFBQXlELGNBQXpEO0FBQ0EsU0FBU0MsTUFBVCxRQUF1QixTQUF2QjtBQUVBLElBQU1DLFVBQVUsR0FBRyxJQUFJQyxXQUFKLENBQWdCLENBQWhCLENBQW5CO0FBRUEsZ0JBQXNCQyxPQUF0QjtBQUFBO0FBQUE7OztxRUFBTyxpQkFDTEMsS0FESyxFQUVMQyxNQUZLLEVBR0xDLGNBSEs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBS0NDLFlBQUFBLElBTEQsR0FLUVAsTUFBTSxDQUFDUSxlQUFQLENBQXVCLElBQUlDLFVBQUosQ0FBZVYsV0FBZixDQUF2QixDQUxSO0FBTUNXLFlBQUFBLEtBTkQsR0FNU1YsTUFBTSxDQUFDUSxlQUFQLENBQXVCLElBQUlDLFVBQUosQ0FBZVgsZUFBZixDQUF2QixDQU5UO0FBQUE7QUFBQSxtQkFPYWEsSUFBSSxDQUFDTixNQUFELEVBQVNFLElBQVQsQ0FQakI7O0FBQUE7QUFPQ0ssWUFBQUEsR0FQRDtBQUFBO0FBQUEsbUJBUWdDWixNQUFNLENBQUNhLE1BQVAsQ0FBY1YsT0FBZCxDQUNuQ1csWUFBWSxDQUFDSixLQUFELEVBQVFKLGNBQVIsQ0FEdUIsRUFFbkNNLEdBRm1DLEVBR25DUixLQUhtQyxDQVJoQzs7QUFBQTtBQVFDVyxZQUFBQSxTQVJEO0FBQUEsNkNBYUUsSUFBSWxCLFVBQUosQ0FBZTtBQUNwQm1CLGNBQUFBLG1CQUFtQixFQUFFO0FBQ25CQyxnQkFBQUEsT0FBTyxFQUFFLElBQUlSLFVBQUosQ0FBZU0sU0FBZixDQURVO0FBRW5CRyxnQkFBQUEsUUFBUSxFQUFFWCxJQUZTO0FBR25CWSxnQkFBQUEsUUFBUSxFQUFFVDtBQUhTO0FBREQsYUFBZixDQWJGOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEc7Ozs7QUFzQlAsZ0JBQXNCVSxPQUF0QjtBQUFBO0FBQUE7OztxRUFBTyxrQkFDTEwsU0FESyxFQUVMVixNQUZLLEVBR0xDLGNBSEs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsZ0JBS0FTLFNBQVMsQ0FBQ0MsbUJBTFY7QUFBQTtBQUFBO0FBQUE7O0FBQUEsa0JBTUcsSUFBSUssS0FBSixDQUFVLDRCQUFWLENBTkg7O0FBQUE7QUFBQTtBQUFBLG1CQVFhVixJQUFJLENBQUNOLE1BQUQsRUFBU1UsU0FBUyxDQUFDQyxtQkFBVixDQUE4QkUsUUFBdkMsQ0FSakI7O0FBQUE7QUFRQ04sWUFBQUEsR0FSRDtBQUFBO0FBQUEsbUJBU2dDWixNQUFNLENBQUNhLE1BQVAsQ0FBY08sT0FBZCxDQUNuQ04sWUFBWSxDQUFDQyxTQUFTLENBQUNDLG1CQUFWLENBQThCRyxRQUEvQixFQUF5Q2IsY0FBekMsQ0FEdUIsRUFFbkNNLEdBRm1DLEVBR25DRyxTQUFTLENBQUNDLG1CQUFWLENBQThCQyxPQUhLLENBVGhDOztBQUFBO0FBU0NLLFlBQUFBLFNBVEQ7QUFBQSw4Q0FjRSxJQUFJYixVQUFKLENBQWVhLFNBQWYsQ0FkRjs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxHOzs7O0FBaUJQLFNBQVNSLFlBQVQsQ0FDRUosS0FERixFQUVFSixjQUZGLEVBR2dCO0FBQ2QsTUFBTWlCLElBQWtCLEdBQUc7QUFDekJDLElBQUFBLElBQUksRUFBRSxTQURtQjtBQUV6QkMsSUFBQUEsRUFBRSxFQUFFZjtBQUZxQixHQUEzQjs7QUFJQSxNQUFJSixjQUFKLEVBQW9CO0FBQ2xCaUIsSUFBQUEsSUFBSSxDQUFDakIsY0FBTCxHQUFzQkEsY0FBdEI7QUFDRDs7QUFDRCxTQUFPaUIsSUFBUDtBQUNELEMsQ0FFRDtBQUNBOzs7U0FDZVosSTs7Ozs7a0VBQWYsa0JBQW9CTixNQUFwQixFQUF3Q0UsSUFBeEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFDb0JQLE1BQU0sQ0FBQ2EsTUFBUCxDQUFjYSxTQUFkLENBQXdCLEtBQXhCLEVBQStCckIsTUFBL0IsRUFBdUMsTUFBdkMsRUFBK0MsS0FBL0MsRUFBc0QsQ0FDdEUsV0FEc0UsQ0FBdEQsQ0FEcEI7O0FBQUE7QUFDUU8sWUFBQUEsR0FEUjtBQUFBLDhDQUlTWixNQUFNLENBQUNhLE1BQVAsQ0FBY2MsU0FBZCxDQUNMO0FBQUVILGNBQUFBLElBQUksRUFBRSxNQUFSO0FBQWdCSSxjQUFBQSxJQUFJLEVBQUUsU0FBdEI7QUFBaUNyQixjQUFBQSxJQUFJLEVBQUVBLElBQXZDO0FBQTZDc0IsY0FBQUEsSUFBSSxFQUFFNUI7QUFBbkQsYUFESyxFQUVMVyxHQUZLLEVBR0w7QUFBRVksY0FBQUEsSUFBSSxFQUFFLFNBQVI7QUFBbUJNLGNBQUFBLE1BQU0sRUFBRTtBQUEzQixhQUhLLEVBSUwsS0FKSyxFQUtMLENBQUMsU0FBRCxFQUFZLFNBQVosQ0FMSyxDQUpUOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEciLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQ2lwaGVydGV4dCwgeyBBRVNHQ01Ob25jZVNpemUsIEtERlNhbHRTaXplIH0gZnJvbSAnLi9DaXBoZXJ0ZXh0JztcbmltcG9ydCB7IGNyeXB0byB9IGZyb20gJy4vdXRpbHMnO1xuXG5jb25zdCBoa2RmTm9JbmZvID0gbmV3IEFycmF5QnVmZmVyKDApO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5jcnlwdChcbiAgcGxhaW46IFVpbnQ4QXJyYXksXG4gIHNlY3JldDogVWludDhBcnJheSxcbiAgYWRkaXRpb25hbERhdGE/OiBVaW50OEFycmF5XG4pOiBQcm9taXNlPENpcGhlcnRleHQ+IHtcbiAgY29uc3Qgc2FsdCA9IGNyeXB0by5nZXRSYW5kb21WYWx1ZXMobmV3IFVpbnQ4QXJyYXkoS0RGU2FsdFNpemUpKTtcbiAgY29uc3Qgbm9uY2UgPSBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50OEFycmF5KEFFU0dDTU5vbmNlU2l6ZSkpO1xuICBjb25zdCBrZXkgPSBhd2FpdCBoa2RmKHNlY3JldCwgc2FsdCk7XG4gIGNvbnN0IGVuY3J5cHRlZDogQXJyYXlCdWZmZXIgPSBhd2FpdCBjcnlwdG8uc3VidGxlLmVuY3J5cHQoXG4gICAgYWVzR2NtUGFyYW1zKG5vbmNlLCBhZGRpdGlvbmFsRGF0YSksXG4gICAga2V5LFxuICAgIHBsYWluXG4gICk7XG4gIHJldHVybiBuZXcgQ2lwaGVydGV4dCh7XG4gICAgYWVzMjU2R2NtSGtkZlNoYTI1Njoge1xuICAgICAgcGF5bG9hZDogbmV3IFVpbnQ4QXJyYXkoZW5jcnlwdGVkKSxcbiAgICAgIGhrZGZTYWx0OiBzYWx0LFxuICAgICAgZ2NtTm9uY2U6IG5vbmNlXG4gICAgfVxuICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlY3J5cHQoXG4gIGVuY3J5cHRlZDogQ2lwaGVydGV4dCxcbiAgc2VjcmV0OiBVaW50OEFycmF5LFxuICBhZGRpdGlvbmFsRGF0YT86IFVpbnQ4QXJyYXlcbik6IFByb21pc2U8VWludDhBcnJheT4ge1xuICBpZiAoIWVuY3J5cHRlZC5hZXMyNTZHY21Ia2RmU2hhMjU2KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHBheWxvYWQgY2lwaGVydGV4dCcpO1xuICB9XG4gIGNvbnN0IGtleSA9IGF3YWl0IGhrZGYoc2VjcmV0LCBlbmNyeXB0ZWQuYWVzMjU2R2NtSGtkZlNoYTI1Ni5oa2RmU2FsdCk7XG4gIGNvbnN0IGRlY3J5cHRlZDogQXJyYXlCdWZmZXIgPSBhd2FpdCBjcnlwdG8uc3VidGxlLmRlY3J5cHQoXG4gICAgYWVzR2NtUGFyYW1zKGVuY3J5cHRlZC5hZXMyNTZHY21Ia2RmU2hhMjU2LmdjbU5vbmNlLCBhZGRpdGlvbmFsRGF0YSksXG4gICAga2V5LFxuICAgIGVuY3J5cHRlZC5hZXMyNTZHY21Ia2RmU2hhMjU2LnBheWxvYWRcbiAgKTtcbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGRlY3J5cHRlZCk7XG59XG5cbmZ1bmN0aW9uIGFlc0djbVBhcmFtcyhcbiAgbm9uY2U6IFVpbnQ4QXJyYXksXG4gIGFkZGl0aW9uYWxEYXRhPzogVWludDhBcnJheVxuKTogQWVzR2NtUGFyYW1zIHtcbiAgY29uc3Qgc3BlYzogQWVzR2NtUGFyYW1zID0ge1xuICAgIG5hbWU6ICdBRVMtR0NNJyxcbiAgICBpdjogbm9uY2VcbiAgfTtcbiAgaWYgKGFkZGl0aW9uYWxEYXRhKSB7XG4gICAgc3BlYy5hZGRpdGlvbmFsRGF0YSA9IGFkZGl0aW9uYWxEYXRhO1xuICB9XG4gIHJldHVybiBzcGVjO1xufVxuXG4vLyBEZXJpdmUgQUVTLTI1Ni1HQ00ga2V5IGZyb20gYSBzaGFyZWQgc2VjcmV0IGFuZCBzYWx0LlxuLy8gUmV0dXJucyBjcnlwdG8uQ3J5cHRvS2V5IHN1aXRhYmxlIGZvciB0aGUgZW5jcnlwdC9kZWNyeXB0IEFQSVxuYXN5bmMgZnVuY3Rpb24gaGtkZihzZWNyZXQ6IFVpbnQ4QXJyYXksIHNhbHQ6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPENyeXB0b0tleT4ge1xuICBjb25zdCBrZXkgPSBhd2FpdCBjcnlwdG8uc3VidGxlLmltcG9ydEtleSgncmF3Jywgc2VjcmV0LCAnSEtERicsIGZhbHNlLCBbXG4gICAgJ2Rlcml2ZUtleSdcbiAgXSk7XG4gIHJldHVybiBjcnlwdG8uc3VidGxlLmRlcml2ZUtleShcbiAgICB7IG5hbWU6ICdIS0RGJywgaGFzaDogJ1NIQS0yNTYnLCBzYWx0OiBzYWx0LCBpbmZvOiBoa2RmTm9JbmZvIH0sXG4gICAga2V5LFxuICAgIHsgbmFtZTogJ0FFUy1HQ00nLCBsZW5ndGg6IDI1NiB9LFxuICAgIGZhbHNlLFxuICAgIFsnZW5jcnlwdCcsICdkZWNyeXB0J11cbiAgKTtcbn1cbiJdfQ==