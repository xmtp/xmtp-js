# XMTP-JS

![Test](https://github.com/xmtp/xmtp-js/actions/workflows/test.yml/badge.svg)
![Lint](https://github.com/xmtp/xmtp-js/actions/workflows/lint.yml/badge.svg)
![Build](https://github.com/xmtp/xmtp-js/actions/workflows/build.yml/badge.svg)

![x-red-sm](https://user-images.githubusercontent.com/510695/163488403-1fb37e86-c673-4b48-954e-8460ae4d4b05.png)

**XMTP client SDK for JavaScript applications**

`xmtp-js` provides a TypeScript implementation of an XMTP client for use with JavaScript and React applications.

Build with `xmtp-js` to provide messaging between blockchain wallet addresses, delivering on use cases such as wallet-to-wallet messaging and dapp-to-wallet notifications.

For a demonstration of the core concepts and capabilities of the `xmtp-js` client SDK, see the [example React app repo](https://github.com/xmtp/example-chat-react).

`xmtp-js` has not undergone a formal security audit.

To learn more about XMTP and get answers to frequently asked questions, see [FAQ about XMTP](https://xmtp.org/docs/dev-concepts/faq).

## 🏗 **Breaking revisions**

Because `xmtp-js` is in active development, you should expect breaking revisions that might require you to adopt the latest SDK release to enable your app to continue working as expected.

XMTP communicates about breaking revisions in the [XMTP Discord community](https://discord.gg/xmtp), providing as much advance notice as possible. Additionally, breaking revisions in an `xmtp-js` release are described on the [Releases page](https://github.com/xmtp/xmtp-js/releases).

### Deprecation

Older versions of the SDK will eventually become deprecated, which means:

1. The network will not support and eventually actively reject connections from clients using deprecated versions.
2. Bugs will not be fixed in deprecated versions.

Following table shows the deprecation schedule.

| Announced  | Effective  | Minimum Version | Rationale                                                                                                         |
| ---------- | ---------- | --------------- | ----------------------------------------------------------------------------------------------------------------- |
| 2022-08-18 | 2022-11-08 | v6.0.0          | XMTP network will stop supporting the Waku/libp2p based client interface in favor of the new GRPC based interface |

Issues and PRs are welcome in accordance with our [contribution guidelines](https://github.com/xmtp/xmtp-js/blob/main/CONTRIBUTING.md).

## XMTP `production` and `dev` network environments

XMTP provides both `production` and `dev` network environments to support the development phases of your project.

The `production` network is configured to store messages indefinitely. XMTP may occasionally delete messages and keys from the `dev` network, and will provide advance notice in the [XMTP Discord community](https://discord.gg/xmtp).

To learn how to set your client's network environment, see [Configuring the Client](#configuring-the-client).

## Installation

```bash
npm install @xmtp/xmtp-js
```

Additional configuration is required in React environments due to the removal of polyfills from Webpack 5.

### Create React App

Use `react-scripts` prior to version `5.0.0`. For example:

```bash
npx create-react-app my-app --scripts-version 4.0.2
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

The API revolves around a network Client that allows retrieving and sending messages to other network participants. A Client must be connected to a wallet on startup. If this is the very first time the Client is created, the client will generate a key bundle that is used to encrypt and authenticate messages. The key bundle persists encrypted in the network using a wallet signature. The public side of the key bundle is also regularly advertised on the network to allow parties to establish shared encryption keys. All this happens transparently, without requiring any additional code.

```ts
import { Client } from '@xmtp/xmtp-js'
import { Wallet } from 'ethers'

// You'll want to replace this with a wallet from your application
const wallet = Wallet.createRandom()
// Create the client with your wallet. This will connect to the XMTP development network by default
const xmtp = await Client.create(wallet)
// Start a conversation with XMTP
const conversation = await xmtp.conversations.newConversation(
  '0x3F11b27F323b62B159D2642964fa27C46C841897'
)
// Load all messages in the conversation
const messages = await conversation.messages()
// Send a message
await conversation.send('gm')
// Listen for new messages in the conversation
for await (const message of await conversation.streamMessages()) {
  console.log(`[${message.senderAddress}]: ${message.content}`)
}
```

### Creating a Client

A Client is created with `Client.create(wallet: ethers.Signer): Promise<Client>` that requires passing in a connected Wallet. The Client will request a wallet signature in 2 cases:

1. To sign the newly generated key bundle. This happens only the very first time when key bundle is not found in storage.
2. To sign a random salt used to encrypt the key bundle in storage. This happens every time the Client is started (including the very first time).

The Client will connect to the XMTP `dev` environment by default. ClientOptions can be used to override this and other parameters of the network connection.

```ts
import { Client } from '@xmtp/xmtp-js'
// Create the client with an `ethers.Signer` from your application
const xmtp = await Client.create(wallet)
```

#### Configuring the Client

The client's network connection and key storage method can be configured with these optional parameters of `Client.create`:

| Parameter      | Default               | Description                                                                                                                                                                                                                                                                |
| -------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| env            | `dev`                 | Connect to the specified XMTP network environment. Valid values also include `production` and `local`. For important details about working with these environments, see [XMTP `production` and `dev` network environments](#xmtp-production-and-dev-network-environments). |
| apiUrl         | `undefined`           | Manually specify an API URL to use. If specified, value of `env` will be ignored.                                                                                                                                                                                          |
|                |
| keyStoreType   | `networkTopicStoreV1` | Persist the wallet's key bundle to the network, or use `static` to provide private keys manually.                                                                                                                                                                          |
| codecs         | `[TextCodec]`         | Add codecs to support additional content types.                                                                                                                                                                                                                            |
| maxContentSize | `100M`                | Maximum message content size in bytes.                                                                                                                                                                                                                                     |

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
  '0x3F11b27F323b62B159D2642964fa27C46C841897'
)
```

#### Sending messages

To be able to send a message, the recipient must have already started their Client at least once and consequently advertised their key bundle on the network. Messages are addressed using wallet addresses. The message payload can be a plain string, but other types of content can be supported through the use of SendOptions (see [Different types of content](#different-types-of-content) for more details)

```ts
const conversation = await xmtp.conversations.newConversation(
  '0x3F11b27F323b62B159D2642964fa27C46C841897'
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

#### List messages in a conversation with pagination

It may be helpful to retrieve and process the messages in a conversation page by page. You can do this by calling `conversation.messagesPaginated()` which will return an [AsyncGenerator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator) yielding one page of results at a time. `conversation.messages()` uses this under the hood internally to gather all messages.

```ts
const conversation = await xmtp.conversations.newConversation(
  '0x3F11b27F323b62B159D2642964fa27C46C841897'
)

for await (const page of conversation.messagesPaginated({ pageSize: 25 })) {
  for (const msg of page) {
    // Breaking from the outer loop will stop the client from requesting any further pages
    if (msg.content === 'gm') {
      return
    }
    console.log(msg.content)
  }
}
```

#### Listen for new messages in a conversation

You can listen for any new messages (incoming or outgoing) in a conversation by calling `conversation.streamMessages()`.

A successfully received message (that makes it through the decoding and decryption without throwing) can be trusted to be authentic, i.e. that it was sent by the owner of the `message.senderAddress` wallet and that it wasn't modified in transit. The `message.sent` timestamp can be trusted to have been set by the sender.

The Stream returned by the `stream` methods is an asynchronous iterator and as such usable by a for-await-of loop. Note however that it is by its nature infinite, so any looping construct used with it will not terminate, unless the termination is explicitly initiated (by breaking the loop or by an external call to `Stream.return()`)

```ts
const conversation = await xmtp.conversations.newConversation(
  '0x3F11b27F323b62B159D2642964fa27C46C841897'
)
for await (const message of await conversation.streamMessages()) {
  if (message.senderAddress === xmtp.address) {
    // This message was sent from me
    continue
  }
  console.log(`New message from ${message.senderAddress}: ${message.content}`)
}
```

#### Checking if an address is on the network

If you would like to check and see if a blockchain address is registered on the network before instantiating a client instance, you can use `Client.canMessage`.

```ts
import { Client } from '@xmtp/xmtp-js'

const isOnDevNetwork = await Client.canMessage(
  '0x3F11b27F323b62B159D2642964fa27C46C841897'
)
const isOnProdNetwork = await Client.canMessage(
  '0x3F11b27F323b62B159D2642964fa27C46C841897',
  { env: 'production' }
)
```

#### Handling multiple conversations with the same blockchain address

With XMTP, you can have multiple ongoing conversations with the same blockchain address. For example, you might want to have a conversation scoped to your particular application, or even a conversation scoped to a particular item in your application.

To accomplish this, just set the `conversationId` when you are creating a conversation. We recommend conversation IDs start with a domain, to help avoid unwanted collisions between your application and other apps on the XMTP network.

```ts
// Start a scoped conversation with ID mydomain.xyz/foo
const conversation1 = await xmtp.conversations.newConversation(
  '0x3F11b27F323b62B159D2642964fa27C46C841897',
  {
    conversationId: 'mydomain.xyz/foo',
  }
)

// Start a scoped conversation with ID mydomain.xyz/bar. And add some metadata
const conversation2 = await xmtp.conversations.newConversation(
  '0x3F11b27F323b62B159D2642964fa27C46C841897',
  {
    conversationId: 'mydomain.xyz/bar',
    metadata: {
      title: 'Bar conversation',
    },
  }
)

// Get all the conversations
const conversations = await xmtp.conversations.list()
// Filter for the ones from your application
const myAppConversations = conversations.filter(
  (convo) =>
    convo.context?.conversationId &&
    convo.context.conversationId.startsWith('mydomain.xyz/')
)

for (const conversation of myAppConversations) {
  const conversationId = conversation.context?.conversationId
  if (conversationId === 'mydomain.xyz/foo') {
    await conversation.send('foo')
  }
  if (conversationId === 'mydomain.xyz/bar') {
    await conversation.send('bar')
    console.log(conversation.context?.metadata.title)
  }
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

#### Manually handling private key storage

The SDK will handle key storage for the user by encrypting the private key bundle using a signature generated from the wallet, and storing the encrypted payload on the XMTP network. This can be awkward for some server-side applications, where you may only want to give the application access to the XMTP keys but not your wallet keys. Mobile applications may also want to store keys in a secure enclave rather than rely on decrypting the remote keys on the network each time the application starts up.

You can export the unencrypted key bundle using the static method `Client.getKeys`, save it somewhere secure, and then provide those keys at a later time to initialize a new client using the exported XMTP identity.

```ts
import { Client } from '@xmtp/xmtp-js'
// Get the keys using a valid ethers.Signer. Save them somewhere secure.
const keys = await Client.getKeys(wallet)
// Create a client using keys returned from getKeys
const client = await Client.create(null, { privateKeyOverride: keys })
```

The keys returned by `getKeys` should be treated with the utmost care as compromise of these keys will allow an attacker to impersonate the user on the XMTP network. Ensure these keys are stored somewhere secure and encrypted.

#### Under the hood

Using `xmtp.conversations` hides the details of this, but for the curious this is how sending a message on XMTP works. The first message and first response between two parties is sent to three separate [Waku](https://rfc.vac.dev/spec/10/) content topics:

1. Sender's introduction topic
2. Recipient's introduction topic
3. Conversation topic shared by the sender and the recipient

This is used to establish a shared secret and negotiate a topic to communicate on. Any following messages are sent to the conversation topic only.

The introduction topics allow the participants to reconstruct the list of conversations that they participate(d) in.

The conversation topics carry the contents of the conversations.
