# Read receipt content type

This package provides an XMTP content type to support read receipts to messages.

## What’s a read receipt?

A read receipt is a message sent to confirm that a previously sent message has been read by the recipient. With XMTP, read receipts are special messages with the `ReadReceipt` content type. They contain a timestamp of when the original message was read.

When someone receives a message using an app with read receipts enabled, their XMTP client can send a read receipt when they open that message.

## Why read receipts?

Read receipts give the sender confirmation that the recipient has read their message. This avoids uncertainty about whether a message was seen, without needing to rely on a manual response.

## Install the package

```bash
# npm
npm i @xmtp/content-type-read-receipt

# yarn
yarn add @xmtp/content-type-read-receipt

# pnpm
pnpm i @xmtp/content-type-read-receipt
```

## Provide an opt-out option

While this is a per-app decision, the best practice is to provide users with the option to opt out of sending read receipts. If a user opts out, when they read a message, a read receipt will not be sent to the sender of the message.

## Create a read receipt

With XMTP, read receipts are represented as empty objects.

```tsx
const readReceipt: ReadReceipt = {};
```

## Send a read receipt

If a sender has opened a conversation and has not yet sent a read receipt for its received messages (this can either be done with each message or the most recent message and is an individual app decision), you can send a read receipt like so:

```tsx
await conversation.messages.send({}, ContentTypeReadReceipt);
```

## Receive a read receipt

Now that you can send a read receipt, you can also receive a read receipt that was sent from another user. For example:

```tsx
// Assume `loadLastMessage` is a thing you have
const message: DecodedMessage = await loadLastMessage();

if (message.contentType.sameAs(ContentTypeReadReceipt)) {
  // We have a read receipt
  return;
}
```

## Display the read receipt

Generally, a read receipt indicator should be displayed under the message it's associated with. The indicator can include a timestamp. Ultimately, how you choose to display a read receipt indicator is completely up to you.

> [!IMPORTANT]
> The read receipt is provided as an **empty message** whose timestamp provides the data needed for the indicators. **Be sure to filter out read receipt empty messages and not display them to users.**

## Developing

Run `yarn dev` to build the content type and watch for changes, which will trigger a rebuild.

For more information on contributing to this repository, see our [contributing guidelines](../../CONTRIBUTING.md).
