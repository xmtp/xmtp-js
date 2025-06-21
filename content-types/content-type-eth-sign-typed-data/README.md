# Eth Sign Typed Data content type

## Install the package

```bash
# npm
npm i @xmtp/content-type-eth-sign-typed-data

# yarn
yarn add @xmtp/content-type-eth-sign-typed-data

# pnpm
pnpm i @xmtp/content-type-eth-sign-typed-data
```

## Create an offline signature request

With XMTP, an offline signature request is represented using `eth_signTypedData` RPC specification from [EIP-712](https://eips.ethereum.org/EIPS/eip-712#specification-of-the-eth_signtypeddata-json-rpc) with additional metadata for display:

```tsx
const nowTimestamp = Math.floor(Date.now() / 1000);
const period = 86400;
const ethSignTypedData: EthSignTypedDataParams = {
  account: "0x123...456", // Optional
  domain: {
    name: "Spend Permission Manager",
    version: "1",
    chainId: 8453,
    verifyingContract: "0xf85210B21cC50302F477BA56686d2019dC9b67Ad",
  },
  types: {
    SpendPermission: [
      { name: "account", type: "address" },
      { name: "spender", type: "address" },
      { name: "token", type: "address" },
      { name: "allowance", type: "uint160" },
      { name: "period", type: "uint48" },
      { name: "start", type: "uint48" },
      { name: "end", type: "uint48" },
      { name: "salt", type: "uint256" },
      { name: "extraData", type: "bytes" },
    ],
  },
  primaryType: "SpendPermission",
  message: {
    account: "0x123...456",
    spender: "0x789...abc",
    token: "0xdef...123",
    allowance: 1000000,
    period,
    start: nowTimestamp,
    end: nowTimestamp + period,
    salt: nowTimestamp.toString(),
    extraData: "0x",
  },
  metadata: {
    description: "Allow 0x789...abc to spend 1 USDC on Base",
    transactionType: "spend",
  },
};
```

## Send signature request

Once you have the signature request, you can send it as part of your conversation:

```tsx
await conversation.messages.send(ethSignTypedData, {
  contentType: ContentTypeEthSignTypedData,
});
```

## Receive a signature request

To receive and process an offline signature request:

```tsx
// Assume `loadLastMessage` is a thing you have
const message: DecodedMessage = await loadLastMessage();

if (!message.contentType.sameAs(ContentTypeEthSignTypedData)) {
  // Handle non-transaction request message
  return;
}

const ethSignTypedData: EthSignTypedDataParams = message.content;
// Process the signature request here
```

## Developing

Run `yarn dev` to build the content type and watch for changes, which will trigger a rebuild.

For more information on contributing to this repository, see our [contributing guidelines](../../CONTRIBUTING.md).
