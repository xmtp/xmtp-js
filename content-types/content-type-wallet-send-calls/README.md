# Wallet Send Calls content type

This package provides an XMTP content type to support wallet transactions using the `wallet_sendCalls` RPC specification from [EIP-5792](https://eips.ethereum.org/EIPS/eip-5792).

> **Open for feedback**  
> You are welcome to provide feedback on this implementation by commenting on [XIP-59: Trigger on-chain calls via wallet_sendCalls](https://community.xmtp.org/t/xip-59-trigger-on-chain-calls-via-wallet-sendcalls/889).

## Install the package

```bash
# npm
npm i @xmtp/content-type-wallet-send-calls

# yarn
yarn add @xmtp/content-type-wallet-send-calls

# pnpm
pnpm i @xmtp/content-type-wallet-send-calls
```

## Create a transaction request

With XMTP, a transaction request is represented using `wallet_sendCalls` with additional metadata for display:

```tsx
const walletSendCalls: WalletSendCallsParams = {
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

## Send a transaction request

Once you have a transaction reference, you can send it as part of your conversation:

```tsx
await conversation.messages.send(walletSendCalls, {
  contentType: ContentTypeWalletSendCalls,
});
```

## Receive a transaction request

To receive and process a transaction request:

```tsx
// Assume `loadLastMessage` is a thing you have
const message: DecodedMessage = await loadLastMessage();

if (!message.contentType.sameAs(ContentTypeWalletSendCalls)) {
  // Handle non-transaction request message
  return;
}

const walletSendCalls: WalletSendCallsParams = message.content;
// Process the transaction request here
```

## Developing

Run `yarn dev` to build the content type and watch for changes, which will trigger a rebuild.

For more information on contributing to this repository, see our [contributing guidelines](../../CONTRIBUTING.md).
