# Off-Chain Signature content type

This package provides an XMTP content type to support off-chain signature references.

## What’s an off-chain signature?

It is a signature generated for structured data ([EIP-712](https://eips.ethereum.org/EIPS/eip-712)) or a personal message ([EIP-191](https://eips.ethereum.org/EIPS/eip-191)). This content type facilitates sharing off-chain signatures with agents enabling transactions that involve off-chain signature generation like Permit2, Coinbase Spend Permissions, Hyperliquid Trading, etc...

## Install the package

```bash
# npm
npm i @xmtp/content-type-off-chain-signature

# yarn
yarn add @xmtp/content-type-off-chain-signature

# pnpm
pnpm i @xmtp/content-type-off-chain-signature
```

## Create an Off-chain signature

With XMTP, an off-chain signature is represented as an object with the following keys:

```tsx
const offChainSignature: OffChainSignature = {
  /**
   * Optional namespace for the networkId
   */
  namespace: "eip155";
  /**
   * The networkId for the signature, in decimal or hexadecimal format
   */
  networkId: 8453;
  /**
   * The off-chain signature
   */
  signature: "0x123...abc";
  /**
   * Optional metadata object
   */
  metadata: {
    transactionType: "spend",
    fromAddress: "0x456...def",
  };
};
```

## Send an off-chain signature

Once you have an off-chain signature, you can send it as part of your conversation:

```tsx
await conversation.messages.send(offChainSignature, {
  contentType: ContentTypeOffChainSignature,
});
```

## Receive an off-chain signature

To receive and process an off-chain signature:

```tsx
// Assume `loadLastMessage` is a thing you have
const message: DecodedMessage = await loadLastMessage();

if (!message.contentType.sameAs(ContentTypeOffChainSignature)) {
  // Handle non-off-chain signature message
  return;
}

const offChainSignature: OffChainSignature = message.content;
// Process the off-chain signature here
```

## Display the off chain signature

Since this content type is useful only for agents, the UI can be minimal just to show that an offline signature has been generated and a copy on click behavior.

## Developing

Run `yarn dev` to build the content type and watch for changes, which will trigger a rebuild.

## Testing

Before running unit tests, start the required Docker container at the root of this repository. For more info, see [Running tests](../../README.md#running-tests).

## Useful commands

- `yarn build`: Builds the content type
- `yarn clean`: Removes `node_modules`, `dist`, and `.turbo` folders
- `yarn dev`: Builds the content type and watches for changes, which will trigger a rebuild
- `yarn format`: Runs Prettier format and write changes
- `yarn format:check`: Runs Prettier format check
- `yarn lint`: Runs ESLint
- `yarn test:setup`: Starts a necessary Docker container for testing
- `yarn test:teardown`: Stops Docker container for testing
- `yarn test`: Runs all unit tests
- `yarn typecheck`: Runs `tsc`
