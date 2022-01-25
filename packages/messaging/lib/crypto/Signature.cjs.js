"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var proto = _interopRequireWildcard(require("../../src/proto/message"));

var secp = _interopRequireWildcard(require("@noble/secp256k1"));

var _PublicKey = _interopRequireDefault(require("./PublicKey"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Signature represents an ECDSA signature with recovery bit.
var Signature = /*#__PURE__*/function () {
  function Signature(obj) {
    _classCallCheck(this, Signature);

    _defineProperty(this, "ecdsaCompact", void 0);

    if (!obj.ecdsaCompact) {
      throw new Error('invalid signature');
    }

    if (obj.ecdsaCompact.bytes.length !== 64) {
      throw new Error("invalid signature length: ".concat(obj.ecdsaCompact.bytes.length));
    }

    this.ecdsaCompact = obj.ecdsaCompact;

    if (obj.ecdsaCompact.recovery !== 0 && obj.ecdsaCompact.recovery !== 1) {
      throw new Error("invalid recovery bit: ".concat(obj.ecdsaCompact.recovery));
    }

    this.ecdsaCompact.recovery = obj.ecdsaCompact.recovery;
  } // If the signature is valid for the provided digest
  // then return the public key that validates it.
  // Otherwise return undefined.


  _createClass(Signature, [{
    key: "getPublicKey",
    value: function getPublicKey(digest) {
      if (!this.ecdsaCompact) {
        throw new Error('invalid signature');
      }

      var bytes = secp.recoverPublicKey(digest, this.ecdsaCompact.bytes, this.ecdsaCompact.recovery);
      return bytes ? new _PublicKey["default"]({
        secp256k1Uncompressed: {
          bytes: bytes
        }
      }) : undefined;
    } // If the signature is valid for the provided digest
    // return the address derived from te public key that validest it.
    // Otherwise return undefined.

  }, {
    key: "getEthereumAddress",
    value: function getEthereumAddress(digest) {
      var pub = this.getPublicKey(digest);

      if (!pub) {
        return undefined;
      }

      return pub.getEthereumAddress();
    }
  }, {
    key: "toBytes",
    value: function toBytes() {
      return proto.Signature.encode(this).finish();
    }
  }], [{
    key: "fromBytes",
    value: function fromBytes(bytes) {
      return new Signature(proto.Signature.decode(bytes));
    }
  }]);

  return Signature;
}();

exports["default"] = Signature;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jcnlwdG8vU2lnbmF0dXJlLnRzIl0sIm5hbWVzIjpbIlNpZ25hdHVyZSIsIm9iaiIsImVjZHNhQ29tcGFjdCIsIkVycm9yIiwiYnl0ZXMiLCJsZW5ndGgiLCJyZWNvdmVyeSIsImRpZ2VzdCIsInNlY3AiLCJyZWNvdmVyUHVibGljS2V5IiwiUHVibGljS2V5Iiwic2VjcDI1NmsxVW5jb21wcmVzc2VkIiwidW5kZWZpbmVkIiwicHViIiwiZ2V0UHVibGljS2V5IiwiZ2V0RXRoZXJldW1BZGRyZXNzIiwicHJvdG8iLCJlbmNvZGUiLCJmaW5pc2giLCJkZWNvZGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7SUFDcUJBLFM7QUFHbkIscUJBQVlDLEdBQVosRUFBa0M7QUFBQTs7QUFBQTs7QUFDaEMsUUFBSSxDQUFDQSxHQUFHLENBQUNDLFlBQVQsRUFBdUI7QUFDckIsWUFBTSxJQUFJQyxLQUFKLENBQVUsbUJBQVYsQ0FBTjtBQUNEOztBQUNELFFBQUlGLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQkUsS0FBakIsQ0FBdUJDLE1BQXZCLEtBQWtDLEVBQXRDLEVBQTBDO0FBQ3hDLFlBQU0sSUFBSUYsS0FBSixxQ0FDeUJGLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQkUsS0FBakIsQ0FBdUJDLE1BRGhELEVBQU47QUFHRDs7QUFDRCxTQUFLSCxZQUFMLEdBQW9CRCxHQUFHLENBQUNDLFlBQXhCOztBQUNBLFFBQUlELEdBQUcsQ0FBQ0MsWUFBSixDQUFpQkksUUFBakIsS0FBOEIsQ0FBOUIsSUFBbUNMLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQkksUUFBakIsS0FBOEIsQ0FBckUsRUFBd0U7QUFDdEUsWUFBTSxJQUFJSCxLQUFKLGlDQUFtQ0YsR0FBRyxDQUFDQyxZQUFKLENBQWlCSSxRQUFwRCxFQUFOO0FBQ0Q7O0FBQ0QsU0FBS0osWUFBTCxDQUFrQkksUUFBbEIsR0FBNkJMLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQkksUUFBOUM7QUFDRCxHLENBRUQ7QUFDQTtBQUNBOzs7OztXQUNBLHNCQUFhQyxNQUFiLEVBQXdEO0FBQ3RELFVBQUksQ0FBQyxLQUFLTCxZQUFWLEVBQXdCO0FBQ3RCLGNBQU0sSUFBSUMsS0FBSixDQUFVLG1CQUFWLENBQU47QUFDRDs7QUFDRCxVQUFNQyxLQUFLLEdBQUdJLElBQUksQ0FBQ0MsZ0JBQUwsQ0FDWkYsTUFEWSxFQUVaLEtBQUtMLFlBQUwsQ0FBa0JFLEtBRk4sRUFHWixLQUFLRixZQUFMLENBQWtCSSxRQUhOLENBQWQ7QUFLQSxhQUFPRixLQUFLLEdBQ1IsSUFBSU0scUJBQUosQ0FBYztBQUNaQyxRQUFBQSxxQkFBcUIsRUFBRTtBQUFFUCxVQUFBQSxLQUFLLEVBQUxBO0FBQUY7QUFEWCxPQUFkLENBRFEsR0FJUlEsU0FKSjtBQUtELEssQ0FFRDtBQUNBO0FBQ0E7Ozs7V0FDQSw0QkFBbUJMLE1BQW5CLEVBQTJEO0FBQ3pELFVBQU1NLEdBQUcsR0FBRyxLQUFLQyxZQUFMLENBQWtCUCxNQUFsQixDQUFaOztBQUNBLFVBQUksQ0FBQ00sR0FBTCxFQUFVO0FBQ1IsZUFBT0QsU0FBUDtBQUNEOztBQUNELGFBQU9DLEdBQUcsQ0FBQ0Usa0JBQUosRUFBUDtBQUNEOzs7V0FFRCxtQkFBc0I7QUFDcEIsYUFBT0MsS0FBSyxDQUFDaEIsU0FBTixDQUFnQmlCLE1BQWhCLENBQXVCLElBQXZCLEVBQTZCQyxNQUE3QixFQUFQO0FBQ0Q7OztXQUVELG1CQUFpQmQsS0FBakIsRUFBK0M7QUFDN0MsYUFBTyxJQUFJSixTQUFKLENBQWNnQixLQUFLLENBQUNoQixTQUFOLENBQWdCbUIsTUFBaEIsQ0FBdUJmLEtBQXZCLENBQWQsQ0FBUDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHJvdG8gZnJvbSAnLi4vLi4vc3JjL3Byb3RvL21lc3NhZ2UnO1xuaW1wb3J0ICogYXMgc2VjcCBmcm9tICdAbm9ibGUvc2VjcDI1NmsxJztcbmltcG9ydCBQdWJsaWNLZXkgZnJvbSAnLi9QdWJsaWNLZXknO1xuXG4vLyBTaWduYXR1cmUgcmVwcmVzZW50cyBhbiBFQ0RTQSBzaWduYXR1cmUgd2l0aCByZWNvdmVyeSBiaXQuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTaWduYXR1cmUgaW1wbGVtZW50cyBwcm90by5TaWduYXR1cmUge1xuICBlY2RzYUNvbXBhY3Q6IHByb3RvLlNpZ25hdHVyZV9FQ0RTQUNvbXBhY3QgfCB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3Iob2JqOiBwcm90by5TaWduYXR1cmUpIHtcbiAgICBpZiAoIW9iai5lY2RzYUNvbXBhY3QpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBzaWduYXR1cmUnKTtcbiAgICB9XG4gICAgaWYgKG9iai5lY2RzYUNvbXBhY3QuYnl0ZXMubGVuZ3RoICE9PSA2NCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgaW52YWxpZCBzaWduYXR1cmUgbGVuZ3RoOiAke29iai5lY2RzYUNvbXBhY3QuYnl0ZXMubGVuZ3RofWBcbiAgICAgICk7XG4gICAgfVxuICAgIHRoaXMuZWNkc2FDb21wYWN0ID0gb2JqLmVjZHNhQ29tcGFjdDtcbiAgICBpZiAob2JqLmVjZHNhQ29tcGFjdC5yZWNvdmVyeSAhPT0gMCAmJiBvYmouZWNkc2FDb21wYWN0LnJlY292ZXJ5ICE9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgcmVjb3ZlcnkgYml0OiAke29iai5lY2RzYUNvbXBhY3QucmVjb3Zlcnl9YCk7XG4gICAgfVxuICAgIHRoaXMuZWNkc2FDb21wYWN0LnJlY292ZXJ5ID0gb2JqLmVjZHNhQ29tcGFjdC5yZWNvdmVyeTtcbiAgfVxuXG4gIC8vIElmIHRoZSBzaWduYXR1cmUgaXMgdmFsaWQgZm9yIHRoZSBwcm92aWRlZCBkaWdlc3RcbiAgLy8gdGhlbiByZXR1cm4gdGhlIHB1YmxpYyBrZXkgdGhhdCB2YWxpZGF0ZXMgaXQuXG4gIC8vIE90aGVyd2lzZSByZXR1cm4gdW5kZWZpbmVkLlxuICBnZXRQdWJsaWNLZXkoZGlnZXN0OiBVaW50OEFycmF5KTogUHVibGljS2V5IHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuZWNkc2FDb21wYWN0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgc2lnbmF0dXJlJyk7XG4gICAgfVxuICAgIGNvbnN0IGJ5dGVzID0gc2VjcC5yZWNvdmVyUHVibGljS2V5KFxuICAgICAgZGlnZXN0LFxuICAgICAgdGhpcy5lY2RzYUNvbXBhY3QuYnl0ZXMsXG4gICAgICB0aGlzLmVjZHNhQ29tcGFjdC5yZWNvdmVyeVxuICAgICk7XG4gICAgcmV0dXJuIGJ5dGVzXG4gICAgICA/IG5ldyBQdWJsaWNLZXkoe1xuICAgICAgICAgIHNlY3AyNTZrMVVuY29tcHJlc3NlZDogeyBieXRlcyB9XG4gICAgICAgIH0pXG4gICAgICA6IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8vIElmIHRoZSBzaWduYXR1cmUgaXMgdmFsaWQgZm9yIHRoZSBwcm92aWRlZCBkaWdlc3RcbiAgLy8gcmV0dXJuIHRoZSBhZGRyZXNzIGRlcml2ZWQgZnJvbSB0ZSBwdWJsaWMga2V5IHRoYXQgdmFsaWRlc3QgaXQuXG4gIC8vIE90aGVyd2lzZSByZXR1cm4gdW5kZWZpbmVkLlxuICBnZXRFdGhlcmV1bUFkZHJlc3MoZGlnZXN0OiBVaW50OEFycmF5KTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBwdWIgPSB0aGlzLmdldFB1YmxpY0tleShkaWdlc3QpO1xuICAgIGlmICghcHViKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gcHViLmdldEV0aGVyZXVtQWRkcmVzcygpO1xuICB9XG5cbiAgdG9CeXRlcygpOiBVaW50OEFycmF5IHtcbiAgICByZXR1cm4gcHJvdG8uU2lnbmF0dXJlLmVuY29kZSh0aGlzKS5maW5pc2goKTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tQnl0ZXMoYnl0ZXM6IFVpbnQ4QXJyYXkpOiBTaWduYXR1cmUge1xuICAgIHJldHVybiBuZXcgU2lnbmF0dXJlKHByb3RvLlNpZ25hdHVyZS5kZWNvZGUoYnl0ZXMpKTtcbiAgfVxufVxuIl19