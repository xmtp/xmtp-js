# XMTP JS client library

![Test](https://github.com/xmtp/xmtp-js/actions/workflows/test.yml/badge.svg)
![Lint](https://github.com/xmtp/xmtp-js/actions/workflows/lint.yml/badge.svg)
![Build](https://github.com/xmtp/xmtp-js/actions/workflows/build.yml/badge.svg)

The XMTP SDK bundles the core code libraries, components, tools, documentation, and guides that developers require in order to build client experiences on top of the XMTP protocol and network.

## Usage

The API revolves around a network Client that allows retrieving and sending messages to other network participants. A Client must be connected to a wallet on startup. If this is the very first time the Client is created, the client will generate a key bundle that is used to encrypt and authenticate messages. The key bundle persists encrypted in local storage using a wallet signature. The public side of the key bundle is also regularly advertised on the network to allow parties to establish shared encryption keys. All this happens transparently, without requiring any additional code.

### Creating a Client

A Client is created with `Client.create(wallet: ethers.Signer): Client` that requires passing in a connected Wallet. The Client will request a wallet signature in 2 cases:

1. to sign the newly generated key bundle, this happens only the very first time when key bundle is not found in storage
2. to sign a random salt used to encrypt the key bundle in storage, this happens every time the Client is started (including the very first time)

The Client will connect to XMTP testnet by default. CreateOptions can be used to override this and other parameters of the network connection.

Note that currently the Client uses browser's local storage, so starting it on a different device or browser and connecting to the same wallet will create a "split identity" situation where only one of the clients will be able to decrypt given incoming message depending on which of the advertised key bundles the sender chose to use. Similarly if local storage is cleared for whatever reason and a new key bundle is created, older messages encrypted with older bundles cannot be decrypted anymore and will cause the client to throw.

### Sending messages

To be able to send a message, the recipient must have already started their Client at least once and consequently advertised their key bundle on the network. Messages are addressed using wallet addresses. Message payload is a string but neither the SDK or the network puts any constraints on its contents or interpretation.

First message and first response between two parties is sent to three separate topics:

1. sender's introduction topic
2. recipient's introduction topic
3. conversation topic shared by the sender and the recipient

Any following messages are sent to the conversation topic only.

The introduction topics allow the participants to reconstruct the list of conversations that they participate(d) in.

The conversation topics carry the contents of the conversations.

### Receiving messages

There are two types of primitives for retrieving messages from the network. Use the `list` methods to retrieve past messages that were stored by the network. Use the `stream` methods to listen to new messages using asynchronous iteration. Both primitive types have variants for listing or streaming the introduction topics (to manage the list of conversations) or the conversation topics (to manage the contents of the conversations).

A successfully received message (that makes it through the decoding and decryption without throwing) can be trusted to be authentic, i.e. that it was sent by the owner of the `message.senderAddress` wallet and that it wasn't modified in transit. The `message.sent` timestamp can be trusted to have been set by the sender.

The Stream returned by the `stream` methods is an asynchronous iterator and as such usable by a for-await-of loop. Note however that it is by its nature infinite, so any looping construct used with it will not terminate, unless the termination is explicitly initiated (by breaking the loop or external call to `Stream.return()`)

## Developing

Before committing your time to code, please read the [CONTRIBUTING.md document](https://github.com/xmtp/xmtp-js/blob/main/CONTRIBUTING.md).

### Prerequisites

**Node**

Please make sure you have a Node version compatible with that specified in the root `.nvmrc` file. We recommend using `nvm` to manage local node versions - find install instructions appropriate for your system [here](https://github.com/nvm-sh/nvm#installing-and-updating).

## License

@TODO
