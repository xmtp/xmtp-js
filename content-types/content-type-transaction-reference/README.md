# Transaction reference content type

This package provides an XMTP content type to support on-chain transaction references.

> **Open for feedback**  
> You are welcome to provide feedback on this implementation by commenting on [XIP-21: On-chain transaction reference content type](https://community.xmtp.org/t/xip-21-on-chain-transaction-reference-content-type/532).

## What’s a transaction reference?

It is a reference to an on-chain transaction sent as a message. This content type facilitates sharing transaction hashes or IDs, thereby providing a direct link to on-chain activities.

## Why transaction references?

Transaction references serve to display transaction details, facilitating the sharing of on-chain activities, such as token transfers, between users.

## Install the package

```bash
# npm
npm i @xmtp/content-type-transaction-reference

# yarn
yarn add @xmtp/content-type-transaction-reference

# pnpm
pnpm i @xmtp/content-type-transaction-reference
```

## Create a transaction reference

With XMTP, a transaction reference is represented as an object with the following keys:

```tsx
const transactionReference: TransactionReference = {
  /**
   * Optional namespace for the networkId
   */
  namespace: "eip155";
  /**
   * The networkId for the transaction, in decimal or hexadecimal format
   */
  networkId: 1;
  /**
   * The transaction hash
   */
  reference: "0x123...abc";
  /**
   * Optional metadata object
   */
  metadata: {
    transactionType: "transfer",
    currency: "USDC",
    amount: 100000, // In integer format, this represents 1 USDC (100000/10^6)
    decimals: 6, // Specifies that the currency uses 6 decimal places
    fromAddress: "0x456...def",
    toAddress: "0x789...ghi"
  };
};
```

## Send a transaction reference

Once you have a transaction reference, you can send it as part of your conversation:

```tsx
await conversation.messages.send(transactionReference, {
  contentType: ContentTypeTransactionReference,
});
```

## Receive a transaction reference

To receive and process a transaction reference:

```tsx
// Assume `loadLastMessage` is a thing you have
const message: DecodedMessage = await loadLastMessage();

if (!message.contentType.sameAs(ContentTypeTransactionReference)) {
  // Handle non-transaction reference message
  return;
}

const transactionRef: TransactionReference = message.content;
// Process the transaction reference here
```

## Display the transaction reference

Displaying a transaction reference typically involves rendering details such as the transaction hash, network ID, and any relevant metadata. The exact UI representation can vary based on your application's design, you might want to fetch on-chain data before showing them to the user.

## Note on Metadata

The optional metadata within a transaction reference, such as transaction type, currency, amount, and addresses, are provided for informational purposes only. These details should not be solely relied upon for verifying transaction specifics. Developers are responsible for ensuring the accuracy of transaction data, either by directing users to the appropriate block explorer or by fetching and displaying verified transaction data from the blockchain.

## Developing

Run `yarn dev` to build the content type and watch for changes, which will trigger a rebuild.

For more information on contributing to this repository, see our [contributing guidelines](../../CONTRIBUTING.md).
