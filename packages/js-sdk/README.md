# XMTP-JS

![Test](https://github.com/xmtp/xmtp-js/actions/workflows/test.yml/badge.svg)
![Lint](https://github.com/xmtp/xmtp-js/actions/workflows/lint.yml/badge.svg)
![Build](https://github.com/xmtp/xmtp-js/actions/workflows/build.yml/badge.svg)
![Status](https://img.shields.io/badge/Project_Status-Production-brightgreen)

![x-red-sm](https://user-images.githubusercontent.com/510695/163488403-1fb37e86-c673-4b48-954e-8460ae4d4b05.png)

**XMTP client SDK for JavaScript applications**

`xmtp-js` provides a TypeScript implementation of an XMTP client for use with JavaScript and React applications.

Build with `xmtp-js` to provide messaging between blockchain wallet addresses, delivering on use cases such as wallet-to-wallet messaging and dapp-to-wallet notifications.

`xmtp-js` was included in a [security assessment](https://xmtp.org/assets/files/REP-final-20230207T000355Z-3825cbc68c115f4ec81f3b1d53a24fce.pdf) prepared by [Certik](https://www.certik.com/company/about).

To learn more about XMTP and get answers to frequently asked questions, see the [XMTP documentation](https://xmtp.org/docs).

## Playground and example apps built with `xmtp-js`

- Use the [XMTP React playground app](https://github.com/xmtp/xmtp-react-playground) as a tool to start building an app with XMTP. This basic messaging app has an intentionally unopinionated UI to help make it easier for you to build with.

- Use the [XMTP Inbox Web example app](https://github.com/xmtp-labs/xmtp-inbox-web) as a reference implementation to understand how to implement features following developer and user experience best practices.

## Reference docs

Access the `xmtp-js` client SDK [reference documentation](https://xmtp-js.pages.dev/modules).

## Install

```bash
npm install @xmtp/xmtp-js
```

Additional configuration is required in React environments due to the removal of polyfills from Webpack 5.

## Troubleshoot

### Buffer polyfill

If you run into issues with Buffer and polyfills, see this [solution](https://xmtp.org/docs/faq#why-my-app-is-failing-saying-buffer-is-not-found).

### BigInt polyfill

This SDK uses `BigInt` in a way that's incompatible with polyfills. To ensure that a polyfill isn't added to your application bundle, update your [browserslist](https://github.com/browserslist/browserslist) configuration to exclude browsers that don't support `BigInt`.

For the list of browsers that don't support `BigInt`, see this [compatibility list](https://caniuse.com/bigint).

## Usage

The [XMTP message API](https://xmtp.org/docs/concepts/architectural-overview#network-layer) revolves around a network client that allows retrieving and sending messages to other network participants. A client must be connected to a wallet on startup. If this is the very first time the client is created, the client will generate a [key bundle](https://xmtp.org/docs/concepts/key-generation-and-usage) that is used to [encrypt and authenticate messages](https://xmtp.org/docs/concepts/invitation-and-message-encryption). The key bundle persists encrypted in the network using a [wallet signature](https://xmtp.org/docs/concepts/account-signatures). The public side of the key bundle is also regularly advertised on the network to allow parties to establish shared encryption keys. All this happens transparently, without requiring any additional code.

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

Currently, network nodes are configured to rate limit high-volume publishing from clients. A rate-limited client can expect to receive a 429 status code response from a node. Rate limits can change at any time in the interest of maintaining network health.

### Use local storage

> **Important**  
> If you are building a production-grade app, be sure to use an architecture that includes a local cache backed by an XMTP SDK.

To learn more, see [Use local-first architecture](https://xmtp.org/docs/build/local-first).

### Create a client

A client is created with `Client.create(wallet: Signer): Promise<Client>` that requires passing in a connected wallet that implements the [Signer](https://github.com/xmtp/xmtp-js/blob/main/src/types/Signer.ts) interface. The client will request a wallet signature in two cases:

1. To sign the newly generated key bundle. This happens only the very first time when key bundle is not found in storage.
2. To sign a random salt used to encrypt the key bundle in storage. This happens every time the client is started (including the very first time).

> **Important**  
> The client connects to the XMTP `dev` environment by default. [Use `ClientOptions`](https://github.com/xmtp/xmtp-js/blob/main/README.md#configure-the-client) to change this and other parameters of the network connection.

```ts
import { Client } from '@xmtp/xmtp-js'

// Create the client with a `Signer` from your application
const xmtp = await Client.create(wallet)
```

#### Configure the client

The client's network connection and key storage method can be configured with these optional parameters of `Client.create`:

| Parameter                 | Default                                                                           | Description                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| appVersion                | `undefined`                                                                       | Add a client app version identifier that's included with API requests.<br/>For example, you can use the following format: `appVersion: APP_NAME + '/' + APP_VERSION`.<br/>Setting this value provides telemetry that shows which apps are using the XMTP client SDK. This information can help XMTP developers provide app support, especially around communicating important SDK updates, including deprecations and required upgrades.                 |
| env                       | `dev`                                                                             | Connect to the specified XMTP network environment. Valid values include `dev`, `production`, or `local`. For important details about working with these environments, see [XMTP `production` and `dev` network environments](https://github.com/xmtp/xmtp-js/blob/main/README.md#xmtp-production-and-dev-network-environments).                                                                                                                          |
| apiUrl                    | `undefined`                                                                       | Manually specify an API URL to use. If specified, value of `env` will be ignored.                                                                                                                                                                                                                                                                                                                                                                        |
| keystoreProviders         | `[StaticKeystoreProvider, NetworkKeystoreProvider, KeyGeneratorKeystoreProvider]` | Override the default behaviour of how the client creates a Keystore with a custom provider. This can be used to get the user's private keys from a different storage mechanism.                                                                                                                                                                                                                                                                          |
| persistConversations      | `true`                                                                            | Maintain a cache of previously seen V2 conversations in the storage provider (defaults to `LocalStorage`).                                                                                                                                                                                                                                                                                                                                               |
| skipContactPublishing     | `false`                                                                           | Do not publish the user's contact bundle to the network on client creation. Designed to be used in cases where the client session is short-lived (for example, decrypting a push notification), and where it is known that a client instance has been instantiated with this flag set to false at some point in the past.                                                                                                                                |
| codecs                    | `[TextCodec]`                                                                     | Add codecs to support additional content types.                                                                                                                                                                                                                                                                                                                                                                                                          |
| maxContentSize            | `100M`                                                                            | Maximum message content size in bytes.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| preCreateIdentityCallback | `undefined`                                                                       | `preCreateIdentityCallback` is a function that will be called immediately before a [Create Identity wallet signature](https://xmtp.org/docs/concepts/account-signatures#sign-to-create-an-xmtp-identity) is requested from the user.                                                                                                                                                                                                                     |
| preEnableIdentityCallback | `undefined`                                                                       | `preEnableIdentityCallback` is a function that will be called immediately before an [Enable Identity wallet signature](https://xmtp.org/docs/concepts/account-signatures#sign-to-enable-an-xmtp-identity) is requested from the user.                                                                                                                                                                                                                    |
| useSnaps                  | `false`                                                                           | Enabling the `useSnaps` flag will allow the client to attempt to connect to the "Sign in with XMTP" MetaMask Snap as part of client creation. It is safe to enable this flag even if you do not know whether the user has an appropriate MetaMask version enabled. If no compatible version of MetaMask is found, client creation will proceed as if this flag was set to `false`. To learn more, see [Interacting with Snaps](#interacting-with-snaps). |
| basePersistence           | `InMemoryPersistence` (Node.js) or `LocalStoragePersistence` (browser)            | A persistence provider used by the Keystore to persist its cache of conversations and metadata. Ignored in cases where the `useSnaps` is enabled and the user has a Snaps-compatible browser.                                                                                                                                                                                                                                                            |
| apiClientFactory          | `HttpApiClient`                                                                   | Override the function used to create an API client for the XMTP network. If you are running `xmtp-js` on a server, you will want to import [`@xmtp/grpc-api-client`](https://github.com/xmtp/bot-kit-pro) and set this option to `GrpcApiClient.fromOptions` for better performance and reliability.                                                                                                                                                     |

### Conversations

Most of the time, when interacting with the network, you'll want to do it through `conversations`. Conversations are between two wallets.

```ts
import { Client } from '@xmtp/xmtp-js'

// Create the client with a `Signer` from your application
const xmtp = await Client.create(wallet)
const conversations = xmtp.conversations
```

#### List existing conversations

You can get a list of all conversations that have one or more messages.

```ts
const allConversations = await xmtp.conversations.list()
// Say gm to everyone you've been chatting with
for (const conversation of allConversations) {
  console.log(`Saying GM to ${conversation.peerAddress}`)
  await conversation.send('gm')
}
```

These conversations include all conversations for a user **regardless of which app created the conversation.** This functionality provides the concept of an [interoperable inbox](https://xmtp.org/docs/concepts/interoperable-inbox), which enables a user to access all of their conversations in any app built with XMTP.

#### Listen for new conversations

You can also listen for new conversations being started in real-time. This will allow applications to display incoming messages from new contacts.

> **Warning**  
> This stream will continue infinitely. To end the stream you can either break from the loop, or call `await stream.return()`.

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

#### Send messages

To be able to send a message, the recipient must have already started their client at least once and consequently advertised their key bundle on the network. Messages are addressed using wallet addresses. The message payload can be a plain string, but other types of content can be supported through the use of `SendOptions` (see [Handle different types of content](https://github.com/xmtp/xmtp-js/blob/main/README.md#handle-different-types-of-content) for more details)

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

#### Listen for new messages in all conversations

To listen for any new messages from _all_ conversations, use `conversations.streamAllMessages()`.

> **Note**  
> There is a chance this stream can miss messages if multiple new conversations are received in the time it takes to update the stream to include a new conversation.

```ts
for await (const message of await xmtp.conversations.streamAllMessages()) {
  if (message.senderAddress === xmtp.address) {
    // This message was sent from me
    continue
  }
  console.log(`New message from ${message.senderAddress}: ${message.content}`)
}
```

#### Check if an address is on the network

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

### Request and respect user consent

![Feature status](https://img.shields.io/badge/Feature_status-Alpha-orange)

The user consent feature enables your app to request and respect user consent preferences. With this feature, another blockchain account address registered on the XMTP network can have one of three consent preference values:

- Unknown
- Allowed
- Denied

To learn more, see [Request and respect user consent](https://xmtp.org/docs/build/user-consent).

### Send a broadcast message

You can send a broadcast message (1:many message or announcement) with XMTP. The recipient sees the message as a DM from the sending wallet address.

For important information about sending broadcast messages, see [Best practices for broadcast messages](https://xmtp.org/docs/tutorials/broadcast#best-practices-for-broadcast-messages).

1. Use the bulk query `canMessage` method to identify the wallet addresses that are activated on the XMTP network.
2. Send the message to all of the activated wallet addresses.

For example:

```js
const ethers = require('ethers')
const { Client } = require('@xmtp/xmtp-js')

async function main() {
  //Create a random wallet for example purposes. On the frontend you should replace it with the user's wallet (metamask, rainbow, etc)
  const wallet = ethers.Wallet.createRandom()
  //Initialize the xmtp client
  const xmtp = await Client.create(wallet)

  //In this example we are going to broadcast to the GM_BOT wallet (already activated) and a random wallet (not activated)
  const GM_BOT = '0x937C0d4a6294cdfa575de17382c7076b579DC176'
  const test = ethers.Wallet.createRandom()
  const broadcasts_array = [GM_BOT, test.address]

  //Querying the activation status of the wallets
  const broadcasts_canMessage = await Client.canMessage(broadcasts_array)
  for (let i = 0; i < broadcasts_array.length; i++) {
    //Checking the activation status of each wallet
    const wallet = broadcasts_array[i]
    const canMessage = broadcasts_canMessage[i]
    if (broadcasts_canMessage[i]) {
      //If activated, start
      const conversation = await xmtp.conversations.newConversation(wallet)
      // Send a message
      const sent = await conversation.send('gm')
    }
  }
}
main()
```

### Handle different types of content

All send functions support `SendOptions` as an optional parameter. The `contentType` option allows specifying different types of content than the default simple string standard content type, which is identified with content type identifier `ContentTypeText`.

To learn more about content types, see [Content types with XMTP](https://xmtp.org/docs/concepts/content-types).

Support for other types of content can be added by registering additional `ContentCodecs` with the `Client`. Every codec is associated with a content type identifier, `ContentTypeId`, which is used to signal to the client which codec should be used to process the content that is being sent or received.

For example, see the [Codecs](https://github.com/xmtp/xmtp-js/tree/main/src/codecs) available in `xmtp-js`.

If there is a concern that the recipient may not be able to handle a non-standard content type, the sender can use the `contentFallback` option to provide a string that describes the content being sent. If the recipient fails to decode the original content, the fallback will replace it and can be used to inform the recipient what the original content was.

```ts
// Assuming we've loaded a fictional NumberCodec that can be used to encode numbers,
// and is identified with ContentTypeNumber, we can use it as follows.

xmtp.registerCodec:(new NumberCodec())
conversation.send(3.14, {
  contentType: ContentTypeNumber,
  contentFallback: 'sending you a pie'
})
```

As shown in the example above, you must provide a `contentFallback` value. Use it to provide an alt text-like description of the original content. Providing a `contentFallback` value enables clients that don't support the content type to still display something meaningful.

> **Caution**  
> If you don't provide a `contentFallback` value, clients that don't support the content type will display an empty message. This results in a poor user experience and breaks interoperability.

Additional codecs can be configured through the `ClientOptions` parameter of `Client.create`. The `codecs` option is a list of codec instances that should be added to the default set of codecs (currently only the `TextCodec`). If a codec is added for a content type that is already in the default set, it will replace the original codec.

```ts
// Adding support for `xmtp.org/composite` content type
import { CompositeCodec } from '@xmtp/xmtp-js'

const xmtp = Client.create(wallet, { codecs: [new CompositeCodec()] })
```

To learn more about how to build a custom content type, see [Build a custom content type](https://xmtp.org/docs/content-types/introduction#create-custom-content-types).

Custom codecs and content types may be proposed as interoperable standards through XRCs. To learn about the custom content type proposal process, see [XIP-5](https://github.com/xmtp/XIPs/blob/main/XIPs/xip-5-message-content-types.md).

### Compression

Message content can be optionally compressed using the `compression` option. The value of the option is the name of the compression algorithm to use. Currently supported are `gzip` and `deflate`. Compression is applied to the bytes produced by the content codec.

Content will be decompressed transparently on the receiving end. Note that `Client` enforces maximum content size. The default limit can be overridden through the `ClientOptions`. Consequently, a message that would expand beyond that limit on the receiving end will fail to decode.

```ts
import { Compression } from '@xmtp/xmtp-js'

conversation.send('#'.repeat(1000), {
  compression: Compression.COMPRESSION_DEFLATE,
})
```

### Manually handle private key storage

The SDK will handle key storage for the user by encrypting the private key bundle using a signature generated from the wallet, and storing the encrypted payload on the XMTP network. This can be awkward for some server-side applications, where you may only want to give the application access to the XMTP keys but not your wallet keys. Mobile applications may also want to store keys in a secure enclave rather than rely on decrypting the remote keys on the network each time the application starts up.

You can export the unencrypted key bundle using the static method `Client.getKeys`, save it somewhere secure, and then provide those keys at a later time to initialize a new client using the exported XMTP identity.

```ts
import { Client } from '@xmtp/xmtp-js'

// Get the keys using a valid Signer. Save them somewhere secure.
const keys = await Client.getKeys(wallet)
// Create a client using keys returned from getKeys
const client = await Client.create(null, { privateKeyOverride: keys })
```

The keys returned by `getKeys` should be treated with the utmost care as compromise of these keys will allow an attacker to impersonate the user on the XMTP network. Ensure these keys are stored somewhere secure and encrypted.

### Cache conversations

When running in a browser, conversations are cached in `LocalStorage` by default. Running `client.conversations.list()` will update that cache and persist the results to the browser's `LocalStorage`. The data stored in `LocalStorage` is encrypted and signed using the Keystore's identity key so that attackers cannot read the sensitive contents or tamper with them.

To disable this behavior, set the `persistConversations` client option to `false`.

```ts
const clientWithNoCache = await Client.create(wallet, {
  persistConversations: false,
})
```

### Interacting with Snaps

If the user has a compatible version of MetaMask installed in their browser, and the `useSnaps` `ClientCreateOption` is set to `true`, the SDK will attempt to install and connect to the ["Sign in with XMTP" Snap](https://github.com/xmtp/snap) as part of client creation. If successful, all cryptographic operations will happen inside the secure context of the Snap instead of the main browser thread. This offers greater security and a smoother sign-in experience.

In cases where the Snap is being used, `Client.getKeys()` will fail because the client application has no access to the private key material when used with Snaps.

Currently, `useSnaps` uses a default value of `false`. However, in future versions of `xmtp-js`, it will be updated to use a default value of `true`.

## Breaking revisions

Because `xmtp-js` is in active development, you should expect breaking revisions that might require you to adopt the latest SDK release to enable your app to continue working as expected.

XMTP communicates about breaking revisions in the [XMTP Discord community](https://discord.gg/xmtp), providing as much advance notice as possible. Additionally, breaking revisions in an `xmtp-js` release are described on the [Releases page](https://github.com/xmtp/xmtp-js/releases).

### Deprecation

Older versions of the SDK will eventually be deprecated, which means:

1. The network will not support and eventually actively reject connections from clients using deprecated versions.
2. Bugs will not be fixed in deprecated versions.

The following table provides the deprecation schedule.

| Announced  | Effective  | Minimum Version | Rationale                                                                                                         |
| ---------- | ---------- | --------------- | ----------------------------------------------------------------------------------------------------------------- |
| 2022-08-18 | 2022-11-08 | v6.0.0          | XMTP network will stop supporting the Waku/libp2p-based client interface in favor of the new gRPC-based interface |

Issues and PRs are welcome in accordance with our [contribution guidelines](https://github.com/xmtp/xmtp-js/blob/main/CONTRIBUTING.md).

## XMTP `production` and `dev` network environments

XMTP provides both `production` and `dev` network environments to support the development phases of your project.

The `production` and `dev` networks are completely separate and not interchangeable.
For example, for a given blockchain account address, its XMTP identity on `dev` network is completely distinct from its XMTP identity on the `production` network, as are the messages associated with these identities. In addition, XMTP identities and messages created on the `dev` network can't be accessed from or moved to the `production` network, and vice versa.

> **Important**  
> When you [create a client](https://github.com/xmtp/xmtp-js/blob/main/README.md#create-a-client), it connects to the XMTP `dev` environment by default. To learn how to use the `env` parameter to set your client's network environment, see [Configure the client](https://github.com/xmtp/xmtp-js/blob/main/README.md#configure-the-client).

The `env` parameter accepts one of three valid values: `dev`, `production`, or `local`. Here are some best practices for when to use each environment:

- `dev`: Use to have a client communicate with the `dev` network. As a best practice, set `env` to `dev` while developing and testing your app. Follow this best practice to isolate test messages to `dev` inboxes.

- `production`: Use to have a client communicate with the `production` network. As a best practice, set `env` to `production` when your app is serving real users. Follow this best practice to isolate messages between real-world users to `production` inboxes.

- `local`: Use to have a client communicate with an XMTP node you are running locally. For example, an XMTP node developer can set `env` to `local` to generate client traffic to test a node running locally.

The `production` network is configured to store messages indefinitely. XMTP may occasionally delete messages and keys from the `dev` network, and will provide advance notice in the [XMTP Discord community](https://discord.gg/xmtp).
