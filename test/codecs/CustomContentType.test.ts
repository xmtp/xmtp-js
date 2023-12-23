import assert from 'assert'
import { CodecRegistry } from '../helpers'
import { ContentTypeId } from '../../src'

// Create a unique identifier for your content type
const ContentTypeMultiplyNumbers = new ContentTypeId({
  authorityId: 'your.domain',
  typeId: 'multiply-number',
  versionMajor: 1,
  versionMinor: 0,
})

// Define the MultiplyCodec class
class ContentTypeMultiplyNumberCodec {
  get contentType() {
    return ContentTypeMultiplyNumbers
  }

  // The encode method accepts an object with two numbers (a, b) and encodes it as a byte array
  encode({ a, b }: { a: number; b: number }) {
    return {
      type: ContentTypeMultiplyNumbers,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify({ a, b })),
    }
  }

  // The decode method decodes the byte array, parses the string into numbers (a, b), and returns their product
  decode(content: { content: any }) {
    const uint8Array = content.content
    const { a, b } = JSON.parse(new TextDecoder().decode(uint8Array))
    return a * b
  }

  fallback(content: string): string | undefined {
    return `Can’t display "${content}". This app doesn’t support "${content}".`
    //return undefined; if you don't want the content type to be displayed.
  }
}

describe('ContentTypeMultiplyNumberCodec', () => {
  const codecs = new CodecRegistry()
  const codec = new ContentTypeMultiplyNumberCodec()
  codecs.registerCodec(codec)

  it('can encode/decode numbers', () => {
    const numbers = { a: 2, b: 3 }
    const ec = codec.encode(numbers)
    assert(ec.type.sameAs(ContentTypeMultiplyNumbers))
    const product = codec.decode(ec)
    assert.equal(product, 6)
  })

  it('fallback on unknown content', () => {
    const unknownContent = 'unknown content'
    const fallbackMessage = codec.fallback(unknownContent)
    assert.equal(
      fallbackMessage,
      `Can’t display "${unknownContent}". This app doesn’t support "${unknownContent}".`
    )
  })
})
