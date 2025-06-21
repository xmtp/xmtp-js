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
  namespace: "eip155",
  networkId: "0x2105",
  signature: "0x000...000",
  metadata: {
    transactionType: "spend",
    fromAddress: "0x123...456",
  },
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

For more information on contributing to this repository, see our [contributing guidelines](../../CONTRIBUTING.md).
