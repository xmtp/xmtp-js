# Reply content type

This package provides an XMTP content type to support replying to a message.

## What’s a reply?

...

## Why replies?

...

## Install the package

```bash
# npm
npm i @xmtp/content-type-reply

# yarn
yarn add @xmtp/content-type-reply

# pnpm
pnpm i @xmtp/content-type-reply
```

## Create a reply

With XMTP, replys are represented as objects with the following keys:

- `reference`: The message ID for the message that is being reacted to
- `content`: A string representation of the reply

```tsx
const reply: Reply = {
  reference: someMessageID,
  content: "I concur",
};
```

## Send a reply

Now that you have a reply, you can send it:

```tsx
await conversation.messages.send(reply, {
  contentType: ContentTypeReaction,
  contentFallback: `[Reply] ${client.address} replied to ${someMessage.content} with:\n\n${reply.content}`,
});
```

Note that we’re using `contentFallback` to enable clients that don't support these content types to still display something. For cases where clients *do* support these types, they can use the content fallback as alt text for accessibility purposes.

## Receive a reply

Now that you can send a reply, you need a way to receive a reply. For example:

```tsx
// Assume `loadLastMessage` is a thing you have
const message: DecodedMessage = await loadLastMessage();

if (!message.contentType.sameAs(ContentTypeReply)) {
  // We do not have a reply. A topic for another blog post.
  return;
}

// We've got a reply.
const reply: Reply = message.content;
```

## Display the reply

Generally, replys should be displayed alongside the original message to provide context. Ultimately, how you choose to display replies is completely up to you.

## Developing

Run `yarn dev` to build the content type and watch for changes, which will trigger a rebuild.

## Testing

Before running unit tests, start the required Docker container at the root of this repository. For more info, see [Running tests](../../README.md#running-tests).

## Useful commands

- `yarn build`: Builds the content type
- `yarn clean`: Removes `node_modules`, `dist`, and `.turbo` folders
- `yarn dev`: Builds the content type and watches for changes, which will trigger a rebuild
- `yarn format`: Runs prettier format and write changes
- `yarn format:check`: Runs prettier format check
- `yarn lint`: Runs ESLint
- `yarn test:setup`: Starts a necessary docker container for testing
- `yarn test:teardown`: Stops docker container for testing
- `yarn test`: Runs all unit tests
- `yarn typecheck`: Runs `tsc`
