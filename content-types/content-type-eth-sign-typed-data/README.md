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
const ethSignTypedData: EthSignTypedDataParams = {
  version: "1.0",
  from: "0x123...abc",
  chainId: "0x2105",
  calls: [
    {
      to: "0x456...def",
      value: "0x5AF3107A4000",
      metadata: {
        description: "Send 0.0001 ETH on base to 0x456...def",
        transactionType: "transfer",
        currency: "ETH",
        amount: 100000000000000,
        decimals: 18,
        toAddress: "0x456...def",
      },
    },
    {
      to: "0x789...cba",
      data: "0xdead...beef",
      metadata: {
        description: "Lend 10 USDC on base with Morpho @ 8.5% APY",
        transactionType: "lend",
        currency: "USDC",
        amount: 10000000,
        decimals: 6,
        platform: "morpho",
        apy: "8.5",
      },
    },
  ],
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
