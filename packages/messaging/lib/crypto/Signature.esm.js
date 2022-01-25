function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import * as proto from '../../src/proto/message';
import * as secp from '@noble/secp256k1';
import PublicKey from './PublicKey'; // Signature represents an ECDSA signature with recovery bit.

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
      return bytes ? new PublicKey({
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

export { Signature as default };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jcnlwdG8vU2lnbmF0dXJlLnRzIl0sIm5hbWVzIjpbInByb3RvIiwic2VjcCIsIlB1YmxpY0tleSIsIlNpZ25hdHVyZSIsIm9iaiIsImVjZHNhQ29tcGFjdCIsIkVycm9yIiwiYnl0ZXMiLCJsZW5ndGgiLCJyZWNvdmVyeSIsImRpZ2VzdCIsInJlY292ZXJQdWJsaWNLZXkiLCJzZWNwMjU2azFVbmNvbXByZXNzZWQiLCJ1bmRlZmluZWQiLCJwdWIiLCJnZXRQdWJsaWNLZXkiLCJnZXRFdGhlcmV1bUFkZHJlc3MiLCJlbmNvZGUiLCJmaW5pc2giLCJkZWNvZGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEsT0FBTyxLQUFLQSxLQUFaLE1BQXVCLHlCQUF2QjtBQUNBLE9BQU8sS0FBS0MsSUFBWixNQUFzQixrQkFBdEI7QUFDQSxPQUFPQyxTQUFQLE1BQXNCLGFBQXRCLEMsQ0FFQTs7SUFDcUJDLFM7QUFHbkIscUJBQVlDLEdBQVosRUFBa0M7QUFBQTs7QUFBQTs7QUFDaEMsUUFBSSxDQUFDQSxHQUFHLENBQUNDLFlBQVQsRUFBdUI7QUFDckIsWUFBTSxJQUFJQyxLQUFKLENBQVUsbUJBQVYsQ0FBTjtBQUNEOztBQUNELFFBQUlGLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQkUsS0FBakIsQ0FBdUJDLE1BQXZCLEtBQWtDLEVBQXRDLEVBQTBDO0FBQ3hDLFlBQU0sSUFBSUYsS0FBSixxQ0FDeUJGLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQkUsS0FBakIsQ0FBdUJDLE1BRGhELEVBQU47QUFHRDs7QUFDRCxTQUFLSCxZQUFMLEdBQW9CRCxHQUFHLENBQUNDLFlBQXhCOztBQUNBLFFBQUlELEdBQUcsQ0FBQ0MsWUFBSixDQUFpQkksUUFBakIsS0FBOEIsQ0FBOUIsSUFBbUNMLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQkksUUFBakIsS0FBOEIsQ0FBckUsRUFBd0U7QUFDdEUsWUFBTSxJQUFJSCxLQUFKLGlDQUFtQ0YsR0FBRyxDQUFDQyxZQUFKLENBQWlCSSxRQUFwRCxFQUFOO0FBQ0Q7O0FBQ0QsU0FBS0osWUFBTCxDQUFrQkksUUFBbEIsR0FBNkJMLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQkksUUFBOUM7QUFDRCxHLENBRUQ7QUFDQTtBQUNBOzs7OztXQUNBLHNCQUFhQyxNQUFiLEVBQXdEO0FBQ3RELFVBQUksQ0FBQyxLQUFLTCxZQUFWLEVBQXdCO0FBQ3RCLGNBQU0sSUFBSUMsS0FBSixDQUFVLG1CQUFWLENBQU47QUFDRDs7QUFDRCxVQUFNQyxLQUFLLEdBQUdOLElBQUksQ0FBQ1UsZ0JBQUwsQ0FDWkQsTUFEWSxFQUVaLEtBQUtMLFlBQUwsQ0FBa0JFLEtBRk4sRUFHWixLQUFLRixZQUFMLENBQWtCSSxRQUhOLENBQWQ7QUFLQSxhQUFPRixLQUFLLEdBQ1IsSUFBSUwsU0FBSixDQUFjO0FBQ1pVLFFBQUFBLHFCQUFxQixFQUFFO0FBQUVMLFVBQUFBLEtBQUssRUFBTEE7QUFBRjtBQURYLE9BQWQsQ0FEUSxHQUlSTSxTQUpKO0FBS0QsSyxDQUVEO0FBQ0E7QUFDQTs7OztXQUNBLDRCQUFtQkgsTUFBbkIsRUFBMkQ7QUFDekQsVUFBTUksR0FBRyxHQUFHLEtBQUtDLFlBQUwsQ0FBa0JMLE1BQWxCLENBQVo7O0FBQ0EsVUFBSSxDQUFDSSxHQUFMLEVBQVU7QUFDUixlQUFPRCxTQUFQO0FBQ0Q7O0FBQ0QsYUFBT0MsR0FBRyxDQUFDRSxrQkFBSixFQUFQO0FBQ0Q7OztXQUVELG1CQUFzQjtBQUNwQixhQUFPaEIsS0FBSyxDQUFDRyxTQUFOLENBQWdCYyxNQUFoQixDQUF1QixJQUF2QixFQUE2QkMsTUFBN0IsRUFBUDtBQUNEOzs7V0FFRCxtQkFBaUJYLEtBQWpCLEVBQStDO0FBQzdDLGFBQU8sSUFBSUosU0FBSixDQUFjSCxLQUFLLENBQUNHLFNBQU4sQ0FBZ0JnQixNQUFoQixDQUF1QlosS0FBdkIsQ0FBZCxDQUFQO0FBQ0Q7Ozs7OztTQXZEa0JKLFMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwcm90byBmcm9tICcuLi8uLi9zcmMvcHJvdG8vbWVzc2FnZSc7XG5pbXBvcnQgKiBhcyBzZWNwIGZyb20gJ0Bub2JsZS9zZWNwMjU2azEnO1xuaW1wb3J0IFB1YmxpY0tleSBmcm9tICcuL1B1YmxpY0tleSc7XG5cbi8vIFNpZ25hdHVyZSByZXByZXNlbnRzIGFuIEVDRFNBIHNpZ25hdHVyZSB3aXRoIHJlY292ZXJ5IGJpdC5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNpZ25hdHVyZSBpbXBsZW1lbnRzIHByb3RvLlNpZ25hdHVyZSB7XG4gIGVjZHNhQ29tcGFjdDogcHJvdG8uU2lnbmF0dXJlX0VDRFNBQ29tcGFjdCB8IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3RvcihvYmo6IHByb3RvLlNpZ25hdHVyZSkge1xuICAgIGlmICghb2JqLmVjZHNhQ29tcGFjdCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHNpZ25hdHVyZScpO1xuICAgIH1cbiAgICBpZiAob2JqLmVjZHNhQ29tcGFjdC5ieXRlcy5sZW5ndGggIT09IDY0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBpbnZhbGlkIHNpZ25hdHVyZSBsZW5ndGg6ICR7b2JqLmVjZHNhQ29tcGFjdC5ieXRlcy5sZW5ndGh9YFxuICAgICAgKTtcbiAgICB9XG4gICAgdGhpcy5lY2RzYUNvbXBhY3QgPSBvYmouZWNkc2FDb21wYWN0O1xuICAgIGlmIChvYmouZWNkc2FDb21wYWN0LnJlY292ZXJ5ICE9PSAwICYmIG9iai5lY2RzYUNvbXBhY3QucmVjb3ZlcnkgIT09IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCByZWNvdmVyeSBiaXQ6ICR7b2JqLmVjZHNhQ29tcGFjdC5yZWNvdmVyeX1gKTtcbiAgICB9XG4gICAgdGhpcy5lY2RzYUNvbXBhY3QucmVjb3ZlcnkgPSBvYmouZWNkc2FDb21wYWN0LnJlY292ZXJ5O1xuICB9XG5cbiAgLy8gSWYgdGhlIHNpZ25hdHVyZSBpcyB2YWxpZCBmb3IgdGhlIHByb3ZpZGVkIGRpZ2VzdFxuICAvLyB0aGVuIHJldHVybiB0aGUgcHVibGljIGtleSB0aGF0IHZhbGlkYXRlcyBpdC5cbiAgLy8gT3RoZXJ3aXNlIHJldHVybiB1bmRlZmluZWQuXG4gIGdldFB1YmxpY0tleShkaWdlc3Q6IFVpbnQ4QXJyYXkpOiBQdWJsaWNLZXkgfCB1bmRlZmluZWQge1xuICAgIGlmICghdGhpcy5lY2RzYUNvbXBhY3QpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBzaWduYXR1cmUnKTtcbiAgICB9XG4gICAgY29uc3QgYnl0ZXMgPSBzZWNwLnJlY292ZXJQdWJsaWNLZXkoXG4gICAgICBkaWdlc3QsXG4gICAgICB0aGlzLmVjZHNhQ29tcGFjdC5ieXRlcyxcbiAgICAgIHRoaXMuZWNkc2FDb21wYWN0LnJlY292ZXJ5XG4gICAgKTtcbiAgICByZXR1cm4gYnl0ZXNcbiAgICAgID8gbmV3IFB1YmxpY0tleSh7XG4gICAgICAgICAgc2VjcDI1NmsxVW5jb21wcmVzc2VkOiB7IGJ5dGVzIH1cbiAgICAgICAgfSlcbiAgICAgIDogdW5kZWZpbmVkO1xuICB9XG5cbiAgLy8gSWYgdGhlIHNpZ25hdHVyZSBpcyB2YWxpZCBmb3IgdGhlIHByb3ZpZGVkIGRpZ2VzdFxuICAvLyByZXR1cm4gdGhlIGFkZHJlc3MgZGVyaXZlZCBmcm9tIHRlIHB1YmxpYyBrZXkgdGhhdCB2YWxpZGVzdCBpdC5cbiAgLy8gT3RoZXJ3aXNlIHJldHVybiB1bmRlZmluZWQuXG4gIGdldEV0aGVyZXVtQWRkcmVzcyhkaWdlc3Q6IFVpbnQ4QXJyYXkpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IHB1YiA9IHRoaXMuZ2V0UHVibGljS2V5KGRpZ2VzdCk7XG4gICAgaWYgKCFwdWIpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBwdWIuZ2V0RXRoZXJldW1BZGRyZXNzKCk7XG4gIH1cblxuICB0b0J5dGVzKCk6IFVpbnQ4QXJyYXkge1xuICAgIHJldHVybiBwcm90by5TaWduYXR1cmUuZW5jb2RlKHRoaXMpLmZpbmlzaCgpO1xuICB9XG5cbiAgc3RhdGljIGZyb21CeXRlcyhieXRlczogVWludDhBcnJheSk6IFNpZ25hdHVyZSB7XG4gICAgcmV0dXJuIG5ldyBTaWduYXR1cmUocHJvdG8uU2lnbmF0dXJlLmRlY29kZShieXRlcykpO1xuICB9XG59XG4iXX0=