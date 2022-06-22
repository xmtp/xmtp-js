# XMTP-JS

![Test](https://github.com/xmtp/xmtp-js/actions/workflows/test.yml/badge.svg)
![Lint](https://github.com/xmtp/xmtp-js/actions/workflows/lint.yml/badge.svg)
![Build](https://github.com/xmtp/xmtp-js/actions/workflows/build.yml/badge.svg)

![x-red-sm](https://user-images.githubusercontent.com/510695/163488403-1fb37e86-c673-4b48-954e-8460ae4d4b05.png)

**Pre-stable XMTP client implementation for JavaScript applications**. Test sending and receiving messages on behalf of Ethereum wallets via the [XMTP Labs](https://xmtp.com) development network in your own app. For a complete demonstration, see the [example React app](https://github.com/xmtp/example-chat-react). For key concepts and answers to frequently asked questions, see <https://docs.xmtp.org/>.

## 🚧 **XMTP-JS is in active development** 🚧

> ![Security](https://img.shields.io/badge/security-unaudited-orange) ![Stability](https://img.shields.io/badge/code%20stability-low-orange) ![Message Retention](https://img.shields.io/badge/message%20retention-7%20days-orange)
>
> This pre-stable development release is publicly available for evaluation, feedback, and community contribution. All wallets and messages are forcibly deleted from the development network on Mondays.
>
> - **DO NOT** use this package version in production.
> - **DO NOT** share sensitive information via the development network.
> - **DO** expect significant, frequent breaking revisions.
> - **DO** contribute issues and PRs in this repo. The core team has limited bandwidth and may need a few days to review.

## Installation

```bash
npm install @xmtp/xmtp-js
```

Additional configuration is required in React environments due to the removal of polyfills from Webpack 5.

### Create React App

Use `react-scripts` prior to version `5.0.0`. For example:

```bash
npx create-react-app --scripts-version 4.0.2
```

Or downgrade after creating your app.

### Next.js

In `next.config.js`:

```js
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback.fs = false
  }
  return config
}
```

## Usage

The API revolves around a network Client that allows retrieving and sending messages to other network participants. A Client must be connected to a wallet on startup. If this is the very first time the Client is created, the client will generate a key bundle that is used to encrypt and authenticate messages. The key bundle persists encrypted in the network using a wallet signature, or optionally in local storage. The public side of the key bundle is also regularly advertised on the network to allow parties to establish shared encryption keys. All this happens transparently, without requiring any additional code.

```ts
import { Client } from '@xmtp/xmtp-js'
import { Wallet } from 'ethers'

// You'll want to replace this with a wallet from your application
const wallet = Wallet.createRandom()
// Create the client with your wallet. This will connect to the XMTP development network by default
const xmtp = await Client.create(wallet)
// Start a conversation with Vitalik
const conversation = await xmtp.conversations.newConversation(
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
)
// Load all messages in the conversation
const messages = await conversation.messages()
// Send a message
await conversation.send('gm')
// Listen for new messages in the conversation
for await (const message of await conversation.streamMessages()) {
  console.log(`[${message.senderAddress}]: ${message.text}`)
}
```

### Creating a Client

A Client is created with `Client.create(wallet: ethers.Signer): Promise<Client>` that requires passing in a connected Wallet. The Client will request a wallet signature in 2 cases:

1. To sign the newly generated key bundle. This happens only the very first time when key bundle is not found in storage.
2. To sign a random salt used to encrypt the key bundle in storage. This happens every time the Client is started (including the very first time).

The Client will connect to the XMTP playnet by default. ClientOptions can be used to override this and other parameters of the network connection.

```ts
import { Client } from '@xmtp/xmtp-js'
// Create the client with an `ethers.Signer` from your application
const xmtp = await Client.create(wallet)
```

#### Configuring the Client

The client's network connection and key storage method can be configured with these optional parameters of `Client.create`:

| Parameter             | Default               | Description                                                                      |
| --------------------- | --------------------- | -------------------------------------------------------------------------------- |
| env                   | `'dev'`               | Connect to the specified network environment.                                    |
| waitForPeersTimeoutMs | `10000`               | Wait this long for an initial peer connection.                                   |
| keyStoreType          | `networkTopicStoreV1` | Persist the wallet's key bundle to the network, or optionally to `localStorage`. |
| codecs                | `[TextCodec]`         | Add codecs to support additional content types.                                  |
| maxContentSize        | `100M`                | Maximum message content size in bytes.                                           |

### Conversations

Most of the time, when interacting with the network, you'll want to do it through `conversations`. Conversations are between two wallets.

```ts
import { Client } from '@xmtp/xmtp-js'
// Create the client with an `ethers.Signer` from your application
const xmtp = await Client.create(wallet)
const conversations = xmtp.conversations
```

#### List existing conversations

You can get a list of all conversations that have had 1 or more messages exchanged in the last 30 days.

```ts
const allConversations = await xmtp.conversations.list()
// Say gm to everyone you've been chatting with
for (const conversation of allConversations) {
  console.log(`Saying GM to ${conversation.peerAddress}`)
  await conversation.send('gm')
}
```

#### Listen for new conversations

You can also listen for new conversations being started in real-time. This will allow applications to display incoming messages from new contacts.

_Warning: this stream will continue infinitely. To end the stream you can either break from the loop, or call `await stream.return()`_

```ts
const stream = await xmtp.conversations.stream()
for await (const conversation of stream) {
  console.log(`New conversation started with ${conversation.peerAddress}`)
  // Say hello to your new friend
  await conversation.send('Hi there!')
  // Break from the loop to stop listening
  break
}
```

#### Start a new conversation

You can create a new conversation with any Ethereum address on the XMTP network.

```ts
const newConversation = await xmtp.conversations.newConversation(
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
)
```

#### Sending messages

To be able to send a message, the recipient must have already started their Client at least once and consequently advertised their key bundle on the network. Messages are addressed using wallet addresses. The message payload can be a plain string, but other types of content can be supported through the use of SendOptions (see [Different types of content](#different-types-of-content) for more details)

```ts
const conversation = await xmtp.conversations.newConversation(
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
)
await conversation.send('Hello world')
```

#### List messages in a conversation

You can receive the complete message history in a conversation by calling `conversation.messages()`

```ts
for (const conversation of await xmtp.conversations.list()) {
  // All parameters are optional and can be omitted
  const opts = {
    // Only show messages from last 24 hours
    startTime: new Date(new Date().setDate(new Date().getDate() - 1)),
    endTime: new Date(),
  }
  const messagesInConversation = await conversation.messages(opts)
}
```

#### Listen for new messages in a conversation

You can listen for any new messages (incoming or outgoing) in a conversation by calling `conversation.streamMessages()`.

A successfully received message (that makes it through the decoding and decryption without throwing) can be trusted to be authentic, i.e. that it was sent by the owner of the `message.senderAddress` wallet and that it wasn't modified in transit. The `message.sent` timestamp can be trusted to have been set by the sender.

The Stream returned by the `stream` methods is an asynchronous iterator and as such usable by a for-await-of loop. Note however that it is by its nature infinite, so any looping construct used with it will not terminate, unless the termination is explicitly initiated (by breaking the loop or by an external call to `Stream.return()`)

```ts
const conversation = await xmtp.conversations.newConversation(
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
)
for await (const message of await conversation.streamMessages()) {
  if (message.senderAddress === xmtp.address) {
    // This message was sent from me
    continue
  }
  console.log(`New message from ${message.senderAddress}: ${message.text}`)
}
```

#### Different types of content

All the send functions support `SendOptions` as an optional parameter. The `contentType` option allows specifying different types of content than the default simple string, which is identified with content type identifier `ContentTypeText`. Support for other types of content can be added by registering additional `ContentCodecs` with the `Client`. Every codec is associated with a content type identifier, `ContentTypeId`, which is used to signal to the Client which codec should be used to process the content that is being sent or received. See [XIP-5](https://github.com/xmtp/XIPs/blob/main/XIPs/xip-5-message-content-types.md) for more details on codecs and content types.

Codecs and content types may be proposed as interoperable standards through [XRCs](https://github.com/xmtp/XIPs/blob/main/XIPs/xip-9-composite-content-type.md). If there is a concern that the recipient may not be able to handle a non-standard content type, the sender can use the `contentFallback` option to provide a string that describes the content being sent. If the recipient fails to decode the original content, the fallback will replace it and can be used to inform the recipient what the original content was.

```ts
// Assuming we've loaded a fictional NumberCodec that can be used to encode numbers,
// and is identified with ContentTypeNumber, we can use it as follows.

xmtp.registerCodec:(new NumberCodec())
conversation.send(3.14, {
  contentType: ContentTypeNumber,
  contentFallback: 'sending you a pie'
})
```

Additional codecs can be configured through the `ClientOptions` parameter of `Client.create`. The `codecs` option is a list of codec instances that should be added to the default set of codecs (currently only the `TextCodec`). If a codec is added for a content type that is already in the default set, it will replace the original codec.

```ts
// Adding support for `xmtp.org/composite` content type
import { CompositeCodec } from '@xmtp/xmtp-js'
const xmtp = Client.create(wallet, { codecs: [new CompositeCodec()] })
```

#### Compression

Message content can be optionally compressed using the `compression` option. The value of the option is the name of the compression algorithm to use. Currently supported are `gzip` and `deflate`. Compression is applied to the bytes produced by the content codec.

Content will be decompressed transparently on the receiving end. Note that `Client` enforces maximum content size. The default limit can be overridden through the `ClientOptions`. Consequently a message that would expand beyond that limit on the receiving end will fail to decode.

```ts
conversation.send('#'.repeat(1000), {
  compression: 'deflate',
})
```

#### Under the hood

Using `xmtp.conversations` hides the details of this, but for the curious this is how sending a message on XMTP works. The first message and first response between two parties is sent to three separate [Waku](https://rfc.vac.dev/spec/10/) content topics:

1. Sender's introduction topic
2. Recipient's introduction topic
3. Conversation topic shared by the sender and the recipient

This is used to establish a shared secret and negotiate a topic to communicate on. Any following messages are sent to the conversation topic only.

The introduction topics allow the participants to reconstruct the list of conversations that they participate(d) in.

The conversation topics carry the contents of the conversations.
