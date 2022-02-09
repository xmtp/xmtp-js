# XMTP JS client library

![Test](https://github.com/xmtp/xmtp-js/actions/workflows/test.yml/badge.svg)
![Lint](https://github.com/xmtp/xmtp-js/actions/workflows/lint.yml/badge.svg)
![Build](https://github.com/xmtp/xmtp-js/actions/workflows/build.yml/badge.svg)

The XMTP SDK bundles the core code libraries, components, tools, documentation, and guides that developers require in order to build client experiences on top of the XMTP protocol and network.

## Usage

The API revolves around a network Client that allows retrieving and sending messages to other network participants. A Client must be connected to a wallet on startup. If this is the very first time the Client is created, the client will generate a key bundle that is used to encrypt and authenticate messages. The key bundle persists in local storage encrypted using a wallet signature. The public side of the key bundle is also regularly advertised on the network to allow parties to establish shared encryption keys. All this happens transparently, without requiring any additional code.

### Creating a Client

A Client is created with `Client.create(wallet: ethers.Signer): Client` that requires passing in a connected Wallet. The Client will request a wallet signature in 2 cases:

1. to sign the newly generated key bundle, this happens only the very first time when key bundle is not found in storage
2. to sign a random salt used to encrypt the key bundle in storage, this happens every time the Client is started (including the very first time)

The Client will connect to XMTP testnet by default, but CreateOptions can be used to override this and other parameters of the network connection.

Note that currently the Client uses browser's local storage, so starting it on a different device or browser and connecting to the same wallet will create a "split identity" situation where only one of the clients will be able to decrypt given incoming message depending on which key bundle the sender chose to use.

### Sending messages

To be able to send a message, the recipient must have already started their Client at least once and consequently advertised their key bundle on the network.

### Receiving messages

## Developing

Before committing your time to code, please read the [CONTRIBUTING.md document](https://github.com/xmtp/xmtp-js/blob/main/CONTRIBUTING.md).

### Prerequisites

**Node**

Please make sure you have a Node version compatible with that specified in the root `.nvmrc` file. We recommend using `nvm` to manage local node versions - find install instructions appropriate for your system [here](https://github.com/nvm-sh/nvm#installing-and-updating).

## License

@TODO
