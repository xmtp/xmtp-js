import assert from 'assert'
import { CodecRegistry } from '../helpers'
import { ContentTypeId, Client } from '../../src'
import { newLocalHostClient, waitForUserContact } from '../helpers'

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

  fallback(content: number): string | undefined {
    return `Can’t display number content types. Number was ${JSON.stringify(
      content
    )}`
    //return undefined; if you don't want the content type to be displayed.
  }
}

describe('ContentTypeMultiplyNumberCodec', () => {
  const codec = new ContentTypeMultiplyNumberCodec()
  let alice: Client<string>
  let bob: Client<string>

  describe('v1', () => {
    it('can encode/decode numbers', () => {
      const numbers = { a: 2, b: 3 } as any
      const ec = codec.encode(numbers)
      assert(ec.type.sameAs(ContentTypeMultiplyNumbers))
      const product = codec.decode(ec)
      assert.equal(product, 6)
    })
    it('handles known content types', async () => {
      // Create two new clients, Alice and Bob
      alice = await newLocalHostClient()
      bob = await newLocalHostClient()

      // Register the codec with both Alice and Bob
      alice.registerCodec(codec)
      bob.registerCodec(codec)

      // Create new conversations between Alice and Bob
      const aliceConvo = await alice.conversations.newConversation(bob.address)
      const bobConvo = await bob.conversations.newConversation(alice.address)

      // Create message streams for Alice and Bob
      const aliceStream = await aliceConvo.streamMessages()
      const bobStream = await bobConvo.streamMessages()

      // Define a message with numbers
      const numbers = { a: 2, b: 3 } as any

      // Alice sends the message with the custom content type
      await aliceConvo.send(numbers, {
        contentType: ContentTypeMultiplyNumbers,
      })

      // Fetch the next message from Bob's stream
      const bobResult1 = await bobStream.next()
      const bobMessage1 = bobResult1.value

      // Check the received message's properties
      expect(bobMessage1).toBeTruthy()
      expect(bobMessage1.error).toBeUndefined()
      expect(bobMessage1.contentType).toBeTruthy()
      expect(bobMessage1.contentType.sameAs(ContentTypeMultiplyNumbers))
      expect(bobMessage1.content).toBe(6) // Expect the product of a and b
      expect(bobMessage1.contentFallback).toBeDefined()

      // Close the message streams
      await bobStream.return()
      await aliceStream.return()
    })
    // Test case to handle unknown content types
    it('handles unknown content types', async () => {
      // Create two new clients, Alice and Bob
      alice = await newLocalHostClient()
      bob = await newLocalHostClient()

      // Register the codec with Alice
      alice.registerCodec(codec)

      // Create new conversations between Alice and Bob
      const aliceConvo = await alice.conversations.newConversation(bob.address)
      const bobConvo = await bob.conversations.newConversation(alice.address)

      // Create message streams for Alice and Bob
      const aliceStream = await aliceConvo.streamMessages()
      const bobStream = await bobConvo.streamMessages()

      // Define a message with numbers
      const numbers = { a: 2, b: 3 } as any

      // Alice sends the message with the custom content type
      await aliceConvo.send(numbers, {
        contentType: ContentTypeMultiplyNumbers,
      })

      // Expect Bob's attempt to send the same message to fail due to unknown content type
      expect(
        bobConvo.send(numbers, {
          contentType: ContentTypeMultiplyNumbers,
        })
      ).rejects.toThrow('unknown content type your.domain/multiply-number:1.0')

      // Fetch the next message from Bob's stream
      const bobResult1 = await bobStream.next()
      const bobMessage1 = bobResult1.value

      // Check the received message's properties
      expect(bobMessage1).toBeTruthy()
      expect(bobMessage1.error?.message).toBe(
        'unknown content type your.domain/multiply-number:1.0'
      )
      expect(bobMessage1.contentType).toBeTruthy()
      expect(bobMessage1.contentType.sameAs(ContentTypeMultiplyNumbers))
      expect(bobMessage1.content).toBeUndefined()
      expect(bobMessage1.contentFallback).toBe(
        'Can’t display number content types. Number was {"a":2,"b":3}'
      )

      // Close the message streams
      await bobStream.return()
      await aliceStream.return()
    })
  })
})
