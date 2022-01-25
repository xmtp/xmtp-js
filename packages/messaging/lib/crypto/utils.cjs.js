"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.crypto = exports.bytesToHex = void 0;
exports.equalBytes = equalBytes;
exports.getRandomValues = void 0;
exports.hexToBytes = hexToBytes;

var secp = _interopRequireWildcard(require("@noble/secp256k1"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

// crypto should provide access to standard Web Crypto API
// in both the browser environment and node.
var crypto = typeof window !== 'undefined' ? window.crypto : // eslint-disable-next-line @typescript-eslint/no-var-requires
require('crypto').webcrypto;
exports.crypto = crypto;
var getRandomValues = crypto.getRandomValues;
exports.getRandomValues = getRandomValues;
var bytesToHex = secp.utils.bytesToHex;
exports.bytesToHex = bytesToHex;

function hexToBytes(s) {
  if (s.startsWith('0x')) {
    s = s.slice(2);
  }

  var bytes = new Uint8Array(s.length / 2);

  for (var i = 0; i < bytes.length; i++) {
    var j = i * 2;
    bytes[i] = Number.parseInt(s.slice(j, j + 2), 16);
  }

  return bytes;
}

function equalBytes(b1, b2) {
  if (b1.length !== b2.length) {
    return false;
  }

  for (var i = 0; i < b1.length; i++) {
    if (b1[i] !== b2[i]) {
      return false;
    }
  }

  return true;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jcnlwdG8vdXRpbHMudHMiXSwibmFtZXMiOlsiY3J5cHRvIiwid2luZG93IiwicmVxdWlyZSIsIndlYmNyeXB0byIsImdldFJhbmRvbVZhbHVlcyIsImJ5dGVzVG9IZXgiLCJzZWNwIiwidXRpbHMiLCJoZXhUb0J5dGVzIiwicyIsInN0YXJ0c1dpdGgiLCJzbGljZSIsImJ5dGVzIiwiVWludDhBcnJheSIsImxlbmd0aCIsImkiLCJqIiwiTnVtYmVyIiwicGFyc2VJbnQiLCJlcXVhbEJ5dGVzIiwiYjEiLCJiMiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7OztBQUVBO0FBQ0E7QUFDTyxJQUFNQSxNQUFjLEdBQ3pCLE9BQU9DLE1BQVAsS0FBa0IsV0FBbEIsR0FDSUEsTUFBTSxDQUFDRCxNQURYLEdBRUk7QUFDQ0UsT0FBTyxDQUFDLFFBQUQsQ0FBUCxDQUFrQkMsU0FKbEI7O0FBTUEsSUFBTUMsZUFBZSxHQUFHSixNQUFNLENBQUNJLGVBQS9COztBQUVBLElBQU1DLFVBQVUsR0FBR0MsSUFBSSxDQUFDQyxLQUFMLENBQVdGLFVBQTlCOzs7QUFFQSxTQUFTRyxVQUFULENBQW9CQyxDQUFwQixFQUEyQztBQUNoRCxNQUFJQSxDQUFDLENBQUNDLFVBQUYsQ0FBYSxJQUFiLENBQUosRUFBd0I7QUFDdEJELElBQUFBLENBQUMsR0FBR0EsQ0FBQyxDQUFDRSxLQUFGLENBQVEsQ0FBUixDQUFKO0FBQ0Q7O0FBQ0QsTUFBTUMsS0FBSyxHQUFHLElBQUlDLFVBQUosQ0FBZUosQ0FBQyxDQUFDSyxNQUFGLEdBQVcsQ0FBMUIsQ0FBZDs7QUFDQSxPQUFLLElBQUlDLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdILEtBQUssQ0FBQ0UsTUFBMUIsRUFBa0NDLENBQUMsRUFBbkMsRUFBdUM7QUFDckMsUUFBTUMsQ0FBQyxHQUFHRCxDQUFDLEdBQUcsQ0FBZDtBQUNBSCxJQUFBQSxLQUFLLENBQUNHLENBQUQsQ0FBTCxHQUFXRSxNQUFNLENBQUNDLFFBQVAsQ0FBZ0JULENBQUMsQ0FBQ0UsS0FBRixDQUFRSyxDQUFSLEVBQVdBLENBQUMsR0FBRyxDQUFmLENBQWhCLEVBQW1DLEVBQW5DLENBQVg7QUFDRDs7QUFDRCxTQUFPSixLQUFQO0FBQ0Q7O0FBQ00sU0FBU08sVUFBVCxDQUFvQkMsRUFBcEIsRUFBb0NDLEVBQXBDLEVBQTZEO0FBQ2xFLE1BQUlELEVBQUUsQ0FBQ04sTUFBSCxLQUFjTyxFQUFFLENBQUNQLE1BQXJCLEVBQTZCO0FBQzNCLFdBQU8sS0FBUDtBQUNEOztBQUNELE9BQUssSUFBSUMsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR0ssRUFBRSxDQUFDTixNQUF2QixFQUErQkMsQ0FBQyxFQUFoQyxFQUFvQztBQUNsQyxRQUFJSyxFQUFFLENBQUNMLENBQUQsQ0FBRixLQUFVTSxFQUFFLENBQUNOLENBQUQsQ0FBaEIsRUFBcUI7QUFDbkIsYUFBTyxLQUFQO0FBQ0Q7QUFDRjs7QUFDRCxTQUFPLElBQVA7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHNlY3AgZnJvbSAnQG5vYmxlL3NlY3AyNTZrMSc7XG5cbi8vIGNyeXB0byBzaG91bGQgcHJvdmlkZSBhY2Nlc3MgdG8gc3RhbmRhcmQgV2ViIENyeXB0byBBUElcbi8vIGluIGJvdGggdGhlIGJyb3dzZXIgZW52aXJvbm1lbnQgYW5kIG5vZGUuXG5leHBvcnQgY29uc3QgY3J5cHRvOiBDcnlwdG8gPVxuICB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgID8gd2luZG93LmNyeXB0b1xuICAgIDogLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby12YXItcmVxdWlyZXNcbiAgICAgIChyZXF1aXJlKCdjcnlwdG8nKS53ZWJjcnlwdG8gYXMgdW5rbm93biBhcyBDcnlwdG8pO1xuXG5leHBvcnQgY29uc3QgZ2V0UmFuZG9tVmFsdWVzID0gY3J5cHRvLmdldFJhbmRvbVZhbHVlcztcblxuZXhwb3J0IGNvbnN0IGJ5dGVzVG9IZXggPSBzZWNwLnV0aWxzLmJ5dGVzVG9IZXg7XG5cbmV4cG9ydCBmdW5jdGlvbiBoZXhUb0J5dGVzKHM6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICBpZiAocy5zdGFydHNXaXRoKCcweCcpKSB7XG4gICAgcyA9IHMuc2xpY2UoMik7XG4gIH1cbiAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShzLmxlbmd0aCAvIDIpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgaiA9IGkgKiAyO1xuICAgIGJ5dGVzW2ldID0gTnVtYmVyLnBhcnNlSW50KHMuc2xpY2UoaiwgaiArIDIpLCAxNik7XG4gIH1cbiAgcmV0dXJuIGJ5dGVzO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGVxdWFsQnl0ZXMoYjE6IFVpbnQ4QXJyYXksIGIyOiBVaW50OEFycmF5KTogYm9vbGVhbiB7XG4gIGlmIChiMS5sZW5ndGggIT09IGIyLmxlbmd0aCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGIxLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGIxW2ldICE9PSBiMltpXSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cbiJdfQ==