function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import * as proto from '../../src/proto/message';
import PublicKey from './PublicKey'; // PublicKeyBundle packages all the keys that a participant should advertise.
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

      return new PublicKeyBundle(new PublicKey(decoded.identityKey), new PublicKey(decoded.preKey));
    }
  }]);

  return PublicKeyBundle;
}();

export { PublicKeyBundle as default };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jcnlwdG8vUHVibGljS2V5QnVuZGxlLnRzIl0sIm5hbWVzIjpbInByb3RvIiwiUHVibGljS2V5IiwiUHVibGljS2V5QnVuZGxlIiwiaWRlbnRpdHlLZXkiLCJwcmVLZXkiLCJFcnJvciIsImVuY29kZSIsImZpbmlzaCIsImJ5dGVzIiwiZGVjb2RlZCIsImRlY29kZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQSxPQUFPLEtBQUtBLEtBQVosTUFBdUIseUJBQXZCO0FBQ0EsT0FBT0MsU0FBUCxNQUFzQixhQUF0QixDLENBRUE7QUFDQTtBQUNBOztJQUNxQkMsZTtBQUluQiwyQkFDRUMsV0FERixFQUVFQyxNQUZGLEVBR0U7QUFBQTs7QUFBQTs7QUFBQTs7QUFDQSxRQUFJLENBQUNELFdBQUwsRUFBa0I7QUFDaEIsWUFBTSxJQUFJRSxLQUFKLENBQVUsc0JBQVYsQ0FBTjtBQUNEOztBQUNELFFBQUksQ0FBQ0QsTUFBTCxFQUFhO0FBQ1gsWUFBTSxJQUFJQyxLQUFKLENBQVUsaUJBQVYsQ0FBTjtBQUNEOztBQUNELFNBQUtGLFdBQUwsR0FBbUJBLFdBQW5CO0FBQ0EsU0FBS0MsTUFBTCxHQUFjQSxNQUFkO0FBQ0Q7Ozs7V0FFRCxtQkFBc0I7QUFDcEIsYUFBT0osS0FBSyxDQUFDRSxlQUFOLENBQXNCSSxNQUF0QixDQUE2QixJQUE3QixFQUFtQ0MsTUFBbkMsRUFBUDtBQUNEOzs7V0FFRCxtQkFBaUJDLEtBQWpCLEVBQXFEO0FBQ25ELFVBQU1DLE9BQU8sR0FBR1QsS0FBSyxDQUFDRSxlQUFOLENBQXNCUSxNQUF0QixDQUE2QkYsS0FBN0IsQ0FBaEI7O0FBQ0EsVUFBSSxDQUFDQyxPQUFPLENBQUNOLFdBQWIsRUFBMEI7QUFDeEIsY0FBTSxJQUFJRSxLQUFKLENBQVUsc0JBQVYsQ0FBTjtBQUNEOztBQUNELFVBQUksQ0FBQ0ksT0FBTyxDQUFDTCxNQUFiLEVBQXFCO0FBQ25CLGNBQU0sSUFBSUMsS0FBSixDQUFVLGlCQUFWLENBQU47QUFDRDs7QUFDRCxhQUFPLElBQUlILGVBQUosQ0FDTCxJQUFJRCxTQUFKLENBQWNRLE9BQU8sQ0FBQ04sV0FBdEIsQ0FESyxFQUVMLElBQUlGLFNBQUosQ0FBY1EsT0FBTyxDQUFDTCxNQUF0QixDQUZLLENBQVA7QUFJRDs7Ozs7O1NBbENrQkYsZSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHByb3RvIGZyb20gJy4uLy4uL3NyYy9wcm90by9tZXNzYWdlJztcbmltcG9ydCBQdWJsaWNLZXkgZnJvbSAnLi9QdWJsaWNLZXknO1xuXG4vLyBQdWJsaWNLZXlCdW5kbGUgcGFja2FnZXMgYWxsIHRoZSBrZXlzIHRoYXQgYSBwYXJ0aWNpcGFudCBzaG91bGQgYWR2ZXJ0aXNlLlxuLy8gVGhlIFByZUtleSBtdXN0IGJlIHNpZ25lZCBieSB0aGUgSWRlbnRpdHlLZXkuXG4vLyBUaGUgSWRlbnRpdHlLZXkgY2FuIGJlIHNpZ25lZCBieSB0aGUgd2FsbGV0IHRvIGF1dGhlbnRpY2F0ZSBpdC5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFB1YmxpY0tleUJ1bmRsZSBpbXBsZW1lbnRzIHByb3RvLlB1YmxpY0tleUJ1bmRsZSB7XG4gIGlkZW50aXR5S2V5OiBQdWJsaWNLZXkgfCB1bmRlZmluZWQ7XG4gIHByZUtleTogUHVibGljS2V5IHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGlkZW50aXR5S2V5OiBQdWJsaWNLZXkgfCB1bmRlZmluZWQsXG4gICAgcHJlS2V5OiBQdWJsaWNLZXkgfCB1bmRlZmluZWRcbiAgKSB7XG4gICAgaWYgKCFpZGVudGl0eUtleSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIGlkZW50aXR5IGtleScpO1xuICAgIH1cbiAgICBpZiAoIXByZUtleSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIHByZSBrZXknKTtcbiAgICB9XG4gICAgdGhpcy5pZGVudGl0eUtleSA9IGlkZW50aXR5S2V5O1xuICAgIHRoaXMucHJlS2V5ID0gcHJlS2V5O1xuICB9XG5cbiAgdG9CeXRlcygpOiBVaW50OEFycmF5IHtcbiAgICByZXR1cm4gcHJvdG8uUHVibGljS2V5QnVuZGxlLmVuY29kZSh0aGlzKS5maW5pc2goKTtcbiAgfVxuXG4gIHN0YXRpYyBmcm9tQnl0ZXMoYnl0ZXM6IFVpbnQ4QXJyYXkpOiBQdWJsaWNLZXlCdW5kbGUge1xuICAgIGNvbnN0IGRlY29kZWQgPSBwcm90by5QdWJsaWNLZXlCdW5kbGUuZGVjb2RlKGJ5dGVzKTtcbiAgICBpZiAoIWRlY29kZWQuaWRlbnRpdHlLZXkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyBpZGVudGl0eSBrZXknKTtcbiAgICB9XG4gICAgaWYgKCFkZWNvZGVkLnByZUtleSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIHByZSBrZXknKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBQdWJsaWNLZXlCdW5kbGUoXG4gICAgICBuZXcgUHVibGljS2V5KGRlY29kZWQuaWRlbnRpdHlLZXkpLFxuICAgICAgbmV3IFB1YmxpY0tleShkZWNvZGVkLnByZUtleSlcbiAgICApO1xuICB9XG59XG4iXX0=