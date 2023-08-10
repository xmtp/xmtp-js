# Read receipt content type

This package provides an XMTP content type to support read receipts to messages.

> **Open for feedback**  
> You are welcome to provide feedback on this implementation by commenting on the [Read Receipts content type proposal](https://github.com/orgs/xmtp/discussions/43).

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

## Create a read receipt

With XMTP, read receipts are represented as objects with the following keys:

- `timestamp`: The timestamp the read receipt was sent, in ISO 8601 format

```tsx
const readReceipt: ReadReceipt = {
  timestamp: new Date().toISOString();
};
```

## Send a read receipt

If a sender has opened a conversation and has not yet sent a read receipt for its received messages (this can either be done with each message or the most recent message and is an individual app decision), you can send a read receipt like so:

```tsx
await conversation.messages.send(
  {
    timestamp: new Date().toISOString(),
  },
  ContentTypeReadReceipt,
);
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

Generally, read receipts should be displayed under the message it's associated with, and can include a timestamp or no timestamp. Ultimately, how you choose to display read receipts is completely up to you.

## UX best practices

While this is a per-app decision, the best practice is to provide users with the option to opt out of sending read receipts. If a user opts out, when they read a message, a read receipt will not be sent to the sender of the message.

## Playground implementation

In the XMTP React playground implementation, read receipts are stored in IndexedDB in their own table, separate from regular messages.

A read receipt is sent when a user opens a conversation only if the most recent message was from the other party, and there is no read receipt after that last message timestamp in the read receipts table. The decision to do this for the last message instead of for all received messages has to do with not wanting to potentially double the number of messages by sending read receipts for every single message.

To try it out, see the [XMTP React playground](https://github.com/xmtp/xmtp-react-playground).

A read receipt is shown if the most recent message was from the other party and a read receipt for that message exists.

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
