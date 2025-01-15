# Consent Proof Signature

![Status](https://img.shields.io/badge/Deprecated-brown)

> [!CAUTION]
> The Consent Proof Signature package is no longer maintained.

The documentation below is provided for reference only.

## Usage

```ts
// Sign the message for example with Viem
import { createWalletClient, custom } from "viem";

const timestamp = Date.now();
const message = createConsentMessage(broadcastAddress, timestamp);

const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom((window as any).ethereum!),
});
const [account] = await walletClient.getAddresses();
const signature = await walletClient.signMessage({
  account,
  message,
});
const consentProofBytes = createConsentProofPayload(signature, timestamp);
```

Now the `consentProofBytes` can be encoded and sent to a service to decode and add in a new conversation invitation
