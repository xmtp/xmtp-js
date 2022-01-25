"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.KDFSaltSize = exports.AESKeySize = exports.AESGCMTagLength = exports.AESGCMNonceSize = void 0;

var proto = _interopRequireWildcard(require("../proto/message"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var AESKeySize = 32; // bytes

exports.AESKeySize = AESKeySize;
var KDFSaltSize = 32; // bytes
// AES-GCM defaults from https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams

exports.KDFSaltSize = KDFSaltSize;
var AESGCMNonceSize = 12; // property iv

exports.AESGCMNonceSize = AESGCMNonceSize;
var AESGCMTagLength = 16; // property tagLength
// Ciphertext packages the encrypted ciphertext with the salt and nonce used to produce it.
// salt and nonce are not secret, and should be transmitted/stored along with the encrypted ciphertext.

exports.AESGCMTagLength = AESGCMTagLength;

var Ciphertext = /*#__PURE__*/function () {
  function Ciphertext(obj) {
    _classCallCheck(this, Ciphertext);

    _defineProperty(this, "aes256GcmHkdfSha256", void 0);

    if (!obj.aes256GcmHkdfSha256) {
      throw new Error('invalid ciphertext');
    }

    if (obj.aes256GcmHkdfSha256.payload.length < AESGCMTagLength) {
      throw new Error("invalid ciphertext ciphertext length: ".concat(obj.aes256GcmHkdfSha256.payload.length));
    }

    if (obj.aes256GcmHkdfSha256.hkdfSalt.length !== KDFSaltSize) {
      throw new Error("invalid ciphertext salt length: ".concat(obj.aes256GcmHkdfSha256.hkdfSalt.length));
    }

    if (obj.aes256GcmHkdfSha256.gcmNonce.length !== AESGCMNonceSize) {
      throw new Error("invalid ciphertext nonce length: ".concat(obj.aes256GcmHkdfSha256.gcmNonce.length));
    }

    this.aes256GcmHkdfSha256 = obj.aes256GcmHkdfSha256;
  }

  _createClass(Ciphertext, [{
    key: "toBytes",
    value: function toBytes() {
      return proto.Ciphertext.encode(this).finish();
    }
  }], [{
    key: "fromBytes",
    value: function fromBytes(bytes) {
      return new Ciphertext(proto.Ciphertext.decode(bytes));
    }
  }]);

  return Ciphertext;
}();

exports["default"] = Ciphertext;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jcnlwdG8vQ2lwaGVydGV4dC50cyJdLCJuYW1lcyI6WyJBRVNLZXlTaXplIiwiS0RGU2FsdFNpemUiLCJBRVNHQ01Ob25jZVNpemUiLCJBRVNHQ01UYWdMZW5ndGgiLCJDaXBoZXJ0ZXh0Iiwib2JqIiwiYWVzMjU2R2NtSGtkZlNoYTI1NiIsIkVycm9yIiwicGF5bG9hZCIsImxlbmd0aCIsImhrZGZTYWx0IiwiZ2NtTm9uY2UiLCJwcm90byIsImVuY29kZSIsImZpbmlzaCIsImJ5dGVzIiwiZGVjb2RlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7QUFFTyxJQUFNQSxVQUFVLEdBQUcsRUFBbkIsQyxDQUF1Qjs7O0FBQ3ZCLElBQU1DLFdBQVcsR0FBRyxFQUFwQixDLENBQXdCO0FBQy9COzs7QUFDTyxJQUFNQyxlQUFlLEdBQUcsRUFBeEIsQyxDQUE0Qjs7O0FBQzVCLElBQU1DLGVBQWUsR0FBRyxFQUF4QixDLENBQTRCO0FBRW5DO0FBQ0E7Ozs7SUFDcUJDLFU7QUFHbkIsc0JBQVlDLEdBQVosRUFBbUM7QUFBQTs7QUFBQTs7QUFDakMsUUFBSSxDQUFDQSxHQUFHLENBQUNDLG1CQUFULEVBQThCO0FBQzVCLFlBQU0sSUFBSUMsS0FBSixDQUFVLG9CQUFWLENBQU47QUFDRDs7QUFDRCxRQUFJRixHQUFHLENBQUNDLG1CQUFKLENBQXdCRSxPQUF4QixDQUFnQ0MsTUFBaEMsR0FBeUNOLGVBQTdDLEVBQThEO0FBQzVELFlBQU0sSUFBSUksS0FBSixpREFDcUNGLEdBQUcsQ0FBQ0MsbUJBQUosQ0FBd0JFLE9BQXhCLENBQWdDQyxNQURyRSxFQUFOO0FBR0Q7O0FBQ0QsUUFBSUosR0FBRyxDQUFDQyxtQkFBSixDQUF3QkksUUFBeEIsQ0FBaUNELE1BQWpDLEtBQTRDUixXQUFoRCxFQUE2RDtBQUMzRCxZQUFNLElBQUlNLEtBQUosMkNBQytCRixHQUFHLENBQUNDLG1CQUFKLENBQXdCSSxRQUF4QixDQUFpQ0QsTUFEaEUsRUFBTjtBQUdEOztBQUNELFFBQUlKLEdBQUcsQ0FBQ0MsbUJBQUosQ0FBd0JLLFFBQXhCLENBQWlDRixNQUFqQyxLQUE0Q1AsZUFBaEQsRUFBaUU7QUFDL0QsWUFBTSxJQUFJSyxLQUFKLDRDQUNnQ0YsR0FBRyxDQUFDQyxtQkFBSixDQUF3QkssUUFBeEIsQ0FBaUNGLE1BRGpFLEVBQU47QUFHRDs7QUFDRCxTQUFLSCxtQkFBTCxHQUEyQkQsR0FBRyxDQUFDQyxtQkFBL0I7QUFDRDs7OztXQUVELG1CQUFzQjtBQUNwQixhQUFPTSxLQUFLLENBQUNSLFVBQU4sQ0FBaUJTLE1BQWpCLENBQXdCLElBQXhCLEVBQThCQyxNQUE5QixFQUFQO0FBQ0Q7OztXQUVELG1CQUFpQkMsS0FBakIsRUFBZ0Q7QUFDOUMsYUFBTyxJQUFJWCxVQUFKLENBQWVRLEtBQUssQ0FBQ1IsVUFBTixDQUFpQlksTUFBakIsQ0FBd0JELEtBQXhCLENBQWYsQ0FBUDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHJvdG8gZnJvbSAnLi4vcHJvdG8vbWVzc2FnZSc7XG5cbmV4cG9ydCBjb25zdCBBRVNLZXlTaXplID0gMzI7IC8vIGJ5dGVzXG5leHBvcnQgY29uc3QgS0RGU2FsdFNpemUgPSAzMjsgLy8gYnl0ZXNcbi8vIEFFUy1HQ00gZGVmYXVsdHMgZnJvbSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQWVzR2NtUGFyYW1zXG5leHBvcnQgY29uc3QgQUVTR0NNTm9uY2VTaXplID0gMTI7IC8vIHByb3BlcnR5IGl2XG5leHBvcnQgY29uc3QgQUVTR0NNVGFnTGVuZ3RoID0gMTY7IC8vIHByb3BlcnR5IHRhZ0xlbmd0aFxuXG4vLyBDaXBoZXJ0ZXh0IHBhY2thZ2VzIHRoZSBlbmNyeXB0ZWQgY2lwaGVydGV4dCB3aXRoIHRoZSBzYWx0IGFuZCBub25jZSB1c2VkIHRvIHByb2R1Y2UgaXQuXG4vLyBzYWx0IGFuZCBub25jZSBhcmUgbm90IHNlY3JldCwgYW5kIHNob3VsZCBiZSB0cmFuc21pdHRlZC9zdG9yZWQgYWxvbmcgd2l0aCB0aGUgZW5jcnlwdGVkIGNpcGhlcnRleHQuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDaXBoZXJ0ZXh0IGltcGxlbWVudHMgcHJvdG8uQ2lwaGVydGV4dCB7XG4gIGFlczI1NkdjbUhrZGZTaGEyNTY6IHByb3RvLkNpcGhlcnRleHRfQWVzMjU2Z2NtSGtkZnNoYTI1NiB8IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3RvcihvYmo6IHByb3RvLkNpcGhlcnRleHQpIHtcbiAgICBpZiAoIW9iai5hZXMyNTZHY21Ia2RmU2hhMjU2KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgY2lwaGVydGV4dCcpO1xuICAgIH1cbiAgICBpZiAob2JqLmFlczI1NkdjbUhrZGZTaGEyNTYucGF5bG9hZC5sZW5ndGggPCBBRVNHQ01UYWdMZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYGludmFsaWQgY2lwaGVydGV4dCBjaXBoZXJ0ZXh0IGxlbmd0aDogJHtvYmouYWVzMjU2R2NtSGtkZlNoYTI1Ni5wYXlsb2FkLmxlbmd0aH1gXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAob2JqLmFlczI1NkdjbUhrZGZTaGEyNTYuaGtkZlNhbHQubGVuZ3RoICE9PSBLREZTYWx0U2l6ZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgaW52YWxpZCBjaXBoZXJ0ZXh0IHNhbHQgbGVuZ3RoOiAke29iai5hZXMyNTZHY21Ia2RmU2hhMjU2LmhrZGZTYWx0Lmxlbmd0aH1gXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAob2JqLmFlczI1NkdjbUhrZGZTaGEyNTYuZ2NtTm9uY2UubGVuZ3RoICE9PSBBRVNHQ01Ob25jZVNpemUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYGludmFsaWQgY2lwaGVydGV4dCBub25jZSBsZW5ndGg6ICR7b2JqLmFlczI1NkdjbUhrZGZTaGEyNTYuZ2NtTm9uY2UubGVuZ3RofWBcbiAgICAgICk7XG4gICAgfVxuICAgIHRoaXMuYWVzMjU2R2NtSGtkZlNoYTI1NiA9IG9iai5hZXMyNTZHY21Ia2RmU2hhMjU2O1xuICB9XG5cbiAgdG9CeXRlcygpOiBVaW50OEFycmF5IHtcbiAgICByZXR1cm4gcHJvdG8uQ2lwaGVydGV4dC5lbmNvZGUodGhpcykuZmluaXNoKCk7XG4gIH1cblxuICBzdGF0aWMgZnJvbUJ5dGVzKGJ5dGVzOiBVaW50OEFycmF5KTogQ2lwaGVydGV4dCB7XG4gICAgcmV0dXJuIG5ldyBDaXBoZXJ0ZXh0KHByb3RvLkNpcGhlcnRleHQuZGVjb2RlKGJ5dGVzKSk7XG4gIH1cbn1cbiJdfQ==