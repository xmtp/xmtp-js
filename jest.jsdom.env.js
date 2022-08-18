/* eslint-disable @typescript-eslint/no-var-requires */
const Environment = require('jest-environment-jsdom')

module.exports = class JsdomTestEnvironment extends Environment {
  async setup() {
    await super.setup()
    if (typeof this.global.TextEncoder === 'undefined') {
      const { TextEncoder } = require('util')
      this.global.TextEncoder = TextEncoder
    }
    if (typeof this.global.TextDecoder === 'undefined') {
      const { TextDecoder } = require('util')
      this.global.TextDecoder = TextDecoder
    }
    if (typeof this.global.setImmediate === 'undefined') {
      this.global.setImmediate = setImmediate
      this.global.clearImmediate = clearImmediate
    }
    if (typeof this.global.crypto === 'undefined') {
      this.global.crypto = require('crypto').webcrypto
    }

    // https://github.com/facebook/jest/issues/9983
    this.global.Uint8Array = Uint8Array
  }
}
