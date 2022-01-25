"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var proto = _interopRequireWildcard(require("../../src/proto/message"));

var _PublicKey = _interopRequireDefault(require("./PublicKey"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// PublicKeyBundle packages all the keys that a participant should advertise.
// The PreKey must be signed by the IdentityKey.
// The IdentityKey can be signed by the wallet to authenticate it.
var PublicKeyBundle = /*#__PURE__*/function () {
  function PublicKeyBundle(identityKey, preKey) {
    _classCallCheck(this, PublicKeyBundle);

    _defineProperty(this, "identityKey", void 0);

    _defineProperty(this, "preKey", void 0);

    if (!identityKey) {
      throw new Error('missing identity key');
    }

    if (!preKey) {
      throw new Error('missing pre key');
    }

    this.identityKey = identityKey;
    this.preKey = preKey;
  }

  _createClass(PublicKeyBundle, [{
    key: "toBytes",
    value: function toBytes() {
      return proto.PublicKeyBundle.encode(this).finish();
    }
  }], [{
    key: "fromBytes",
    value: function fromBytes(bytes) {
      var decoded = proto.PublicKeyBundle.decode(bytes);

      if (!decoded.identityKey) {
        throw new Error('missing identity key');
      }

      if (!decoded.preKey) {
        throw new Error('missing pre key');
      }

      return new PublicKeyBundle(new _PublicKey["default"](decoded.identityKey), new _PublicKey["default"](decoded.preKey));
    }
  }]);

  return PublicKeyBundle;
}();

exports["default"] = PublicKeyBundle;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jcnlwdG8vUHVibGljS2V5QnVuZGxlLnRzIl0sIm5hbWVzIjpbIlB1YmxpY0tleUJ1bmRsZSIsImlkZW50aXR5S2V5IiwicHJlS2V5IiwiRXJyb3IiLCJwcm90byIsImVuY29kZSIsImZpbmlzaCIsImJ5dGVzIiwiZGVjb2RlZCIsImRlY29kZSIsIlB1YmxpY0tleSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQTtBQUNBO0FBQ0E7SUFDcUJBLGU7QUFJbkIsMkJBQ0VDLFdBREYsRUFFRUMsTUFGRixFQUdFO0FBQUE7O0FBQUE7O0FBQUE7O0FBQ0EsUUFBSSxDQUFDRCxXQUFMLEVBQWtCO0FBQ2hCLFlBQU0sSUFBSUUsS0FBSixDQUFVLHNCQUFWLENBQU47QUFDRDs7QUFDRCxRQUFJLENBQUNELE1BQUwsRUFBYTtBQUNYLFlBQU0sSUFBSUMsS0FBSixDQUFVLGlCQUFWLENBQU47QUFDRDs7QUFDRCxTQUFLRixXQUFMLEdBQW1CQSxXQUFuQjtBQUNBLFNBQUtDLE1BQUwsR0FBY0EsTUFBZDtBQUNEOzs7O1dBRUQsbUJBQXNCO0FBQ3BCLGFBQU9FLEtBQUssQ0FBQ0osZUFBTixDQUFzQkssTUFBdEIsQ0FBNkIsSUFBN0IsRUFBbUNDLE1BQW5DLEVBQVA7QUFDRDs7O1dBRUQsbUJBQWlCQyxLQUFqQixFQUFxRDtBQUNuRCxVQUFNQyxPQUFPLEdBQUdKLEtBQUssQ0FBQ0osZUFBTixDQUFzQlMsTUFBdEIsQ0FBNkJGLEtBQTdCLENBQWhCOztBQUNBLFVBQUksQ0FBQ0MsT0FBTyxDQUFDUCxXQUFiLEVBQTBCO0FBQ3hCLGNBQU0sSUFBSUUsS0FBSixDQUFVLHNCQUFWLENBQU47QUFDRDs7QUFDRCxVQUFJLENBQUNLLE9BQU8sQ0FBQ04sTUFBYixFQUFxQjtBQUNuQixjQUFNLElBQUlDLEtBQUosQ0FBVSxpQkFBVixDQUFOO0FBQ0Q7O0FBQ0QsYUFBTyxJQUFJSCxlQUFKLENBQ0wsSUFBSVUscUJBQUosQ0FBY0YsT0FBTyxDQUFDUCxXQUF0QixDQURLLEVBRUwsSUFBSVMscUJBQUosQ0FBY0YsT0FBTyxDQUFDTixNQUF0QixDQUZLLENBQVA7QUFJRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHByb3RvIGZyb20gJy4uLy4uL3NyYy9wcm90by9tZXNzYWdlJztcbmltcG9ydCBQdWJsaWNLZXkgZnJvbSAnLi9QdWJsaWNLZXknO1xuXG4vLyBQdWJsaWNLZXlCdW5kbGUgcGFja2FnZXMgYWxsIHRoZSBrZXlzIHRoYXQgYSBwYXJ0aWNpcGFudCBzaG91bGQgYWR2ZXJ0aXNlLlxuLy8gVGhlIFByZUtleSBtdXN0IGJlIHNpZ25lZCBieSB0aGUgSWRlbnRpdHlLZXkuXG4vLyBUaGUgSWRlbnRpdHlLZXkgY2FuIGJlIHNpZ25lZCBieSB0aGUgd2FsbGV0IHRvIGF1dGhlbnRpY2F0ZSBpdC5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFB1YmxpY0tleUJ1bmRsZSBpbXBsZW1lbnRzIHByb3RvLlB1YmxpY0tleUJ1bmRsZSB7XG4gIGlkZW50aXR5S2V5OiBQdWJsaWNLZXkgfCB1bmRlZmluZWQ7XG4gIHByZUtleTogUHVibGljS2V5IHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGlkZW50aXR5S2V5OiBQdWJsaWNLZXkgfCB1bmRlZmluZWQsXG4gICAgcHJlS2V5OiBQdWJsaWNLZXkgfCB1bmRlZmluZWRcbiAgKSB7XG4gICAgaWYgKCFpZGVudGl0eUtleSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIGlkZW50aXR5IGtleScpO1xuICAgIH1cbiAgICBpZiAoIXByZUtleSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIHByZSBrZXknKTtcbiAgICB9XG4gICAgdGhpcy5pZGVudGl0eUtleSA9IGlkZW50aXR5S2V5O1xuICAgIHRoaXMucHJlS2V5ID0gcHJlS2V5O1xuICB9XG5cbiAgdG9CeXRlcygpOiBVaW50OEFycmF5IHtcbiAgICByZXR1cm4gcHJvdG8uUHVibGljS2V5QnVuZGxlLmVuY29kZSh0aGlzKS5maW5pc2goKTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tQnl0ZXMoYnl0ZXM6IFVpbnQ4QXJyYXkpOiBQdWJsaWNLZXlCdW5kbGUge1xuICAgIGNvbnN0IGRlY29kZWQgPSBwcm90by5QdWJsaWNLZXlCdW5kbGUuZGVjb2RlKGJ5dGVzKTtcbiAgICBpZiAoIWRlY29kZWQuaWRlbnRpdHlLZXkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyBpZGVudGl0eSBrZXknKTtcbiAgICB9XG4gICAgaWYgKCFkZWNvZGVkLnByZUtleSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIHByZSBrZXknKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBQdWJsaWNLZXlCdW5kbGUoXG4gICAgICBuZXcgUHVibGljS2V5KGRlY29kZWQuaWRlbnRpdHlLZXkpLFxuICAgICAgbmV3IFB1YmxpY0tleShkZWNvZGVkLnByZUtleSlcbiAgICApO1xuICB9XG59XG4iXX0=