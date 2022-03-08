# XMTP JS client library

![Test](https://github.com/xmtp/xmtp-js/actions/workflows/test.yml/badge.svg)
![Lint](https://github.com/xmtp/xmtp-js/actions/workflows/lint.yml/badge.svg)
![Build](https://github.com/xmtp/xmtp-js/actions/workflows/build.yml/badge.svg)

## Disclaimer: Pre-Stable Alpha

The XMTP protocol is in the early stages of development. This pre-stable alpha library is being provided for evaluation, feedback, and community contribution. It has not undergone a formal security audit and is not intended for production applications. Significant breaking revisions should be expected for all pre-stable alpha software.

## Installation

This library is not yet published as an NPM module. It can be installed from this repo using `npm install xmtp/xmtp-js`.

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

The API revolves around a network Client that allows retrieving and sending messages to other network participants. A Client must be connected to a wallet on startup. If this is the very first time the Client is created, the client will generate a key bundle that is used to encrypt and authenticate messages. The key bundle persists encrypted in local storage using a wallet signature. The public side of the key bundle is also regularly advertised on the network to allow parties to establish shared encryption keys. All this happens transparently, without requiring any additional code.

```ts
import { Client } from '@xmtp/xmtp-js'
import { Wallet } from 'ethers'

// You'll want to replace this with a wallet from your application
const wallet = Wallet.createRandom()
// Create the client with your wallet. This will connect to the XMTP testnet by default
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
for await (const message of conversation.streamMessages()) {
  console.log(`[${message.senderAddress}]: ${message.text}`)
}
```

### Creating a Client

A Client is created with `Client.create(wallet: ethers.Signer): Promise<Client>` that requires passing in a connected Wallet. The Client will request a wallet signature in 2 cases:

1. To sign the newly generated key bundle. This happens only the very first time when key bundle is not found in storage.
2. To sign a random salt used to encrypt the key bundle in storage. This happens every time the Client is started (including the very first time).

The Client will connect to the XMTP playnet by default. CreateOptions can be used to override this and other parameters of the network connection.

```ts
import { Client } from '@xmtp/xmtp-js'
// Create the client with an `ethers.Signer` from your application
const xmtp = await Client.create(wallet)
```

_Pre-Stable Alpha Limitation:_ Currently, the Client uses the browser's local storage to store the key bundle. Starting it on a different device or browser and connecting to the same wallet will create a "split identity" situation where only one of the clients will be able to decrypt an incoming message, depending on which of the advertised key bundles the sender chose to use. Similarly if local storage is cleared for whatever reason and a new key bundle is created, older messages encrypted with older bundles cannot be decrypted anymore and will cause the client to throw.

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
const stream = xmtp.conversations.stream()
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

To be able to send a message, the recipient must have already started their Client at least once and consequently advertised their key bundle on the network. Messages are addressed using wallet addresses. The message payload can be a plain string, but other types of contents can be supported through the use of the optional `contentType` argument. The sender can also include optional `contentFallback` string, if there is a concern that the recipient may not be able to handle particular content type. In that case the fallback will replace the original content and can be used to describe what the original content was.

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

_Pre-Stable Alpha Limitation:_ After 30 days, messages are deleted from the network and cannot be retrieved.

#### Listen for new messages in a conversation

You can listen for any new messages (incoming or outgoing) in a conversation by calling `conversation.streamMessages()`.

A successfully received message (that makes it through the decoding and decryption without throwing) can be trusted to be authentic, i.e. that it was sent by the owner of the `message.senderAddress` wallet and that it wasn't modified in transit. The `message.sent` timestamp can be trusted to have been set by the sender.

The Stream returned by the `stream` methods is an asynchronous iterator and as such usable by a for-await-of loop. Note however that it is by its nature infinite, so any looping construct used with it will not terminate, unless the termination is explicitly initiated (by breaking the loop or by an external call to `Stream.return()`)

```ts
const conversation = await xmtp.conversations.newConversation(
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
)
for await (const message of conversation.streamMessages()) {
  if (message.senderAddress === xmtp.address) {
    // This message was sent from me
    continue
  }
  console.log(`New message from ${message.senderAddress}: ${message.text}`)
}
```

#### Supporting different types of content

(TODO:mk)

#### Under the hood

Using `xmtp.conversations` hides the details of this, but for the curious this is how sending a message on XMTP works. The first message and first response between two parties is sent to three separate [Waku](https://rfc.vac.dev/spec/10/) content topics:

1. Sender's introduction topic
2. Recipient's introduction topic
3. Conversation topic shared by the sender and the recipient

This is used to establish a shared secret and negotiate a topic to communicate on. Any following messages are sent to the conversation topic only.

The introduction topics allow the participants to reconstruct the list of conversations that they participate(d) in.

The conversation topics carry the contents of the conversations.

## Developing

### Auto-releasing and commit conventions

A new version of this package will be automatically published whenever there is a merge to the `main` branch. Specifically, new GitHub releases and tags will be created, and a new NPM package version will be published. The release version increment type is derived from the commits that were bundled in the merge to `main`, using [semantic-release commit message conventions](https://github.com/semantic-release/semantic-release#commit-message-format).

The table below shows example commits and the resulting release type:

<!-- prettier-ignore-start -->
| Commit message                                                                                                                                                                                   | Release type                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `fix(pencil): stop graphite breaking when too much pressure applied`                                                                                                                             | ~~Patch~~ Fix Release                                                                                           |
| `feat(pencil): add 'graphiteWidth' option`                                                                                                                                                       | ~~Minor~~ Feature Release                                                                                       |
| `perf(pencil): remove graphiteWidth option`<br><br>`BREAKING CHANGE: The graphiteWidth option has been removed.`<br>`The default graphite width of 10mm is always used for performance reasons.` | ~~Major~~ Breaking Release <br /> (Note that the `BREAKING CHANGE:` token must be in the footer of the commit) |
<!-- prettier-ignore-end -->

This is currently configured to use the [Angular Commit Message Conventions](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format).

### Prerequisites

#### Node

Please make sure you have a Node version compatible with that specified in the root `.nvmrc` file. We recommend using `nvm` to manage local node versions - find install instructions appropriate for your system [here](https://github.com/nvm-sh/nvm#installing-and-updating).

#### Buf

You will need to install [Buf](https://buf.build/) in your environment in order to `npm build` this package from source.

```bash
brew install bufbuild/buf/buf
```
