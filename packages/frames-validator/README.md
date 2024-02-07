# Frames Validator

A set of tools for validating POST payloads from XMTP Frames

## Usage

```ts
import { validateFramesPost } from "@xmtp/frames-validator"

export function handler(requestBody: any) {
  // This is an XMTP payload
  if (requestBody.untrustedData?.clientType === "xmtp") {
    const { verifiedWalletAddress } = await validateFramesPost(requestBody)
    return doSomethingWithWalletAddress(verifiedWalletAddress)
  } else {
    // This is a Farcaster POST payload
    return doSomethingWithFarcasterPayload(requestBody)
  }
}
```
