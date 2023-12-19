# Screen effect content type

This experimental package provides a content type to support adding screen effects to messages.

## What’s a screen effect?

A screen effect is something that happens on a particular trigger, such as sending balloons along with a happy birthday message or sending snowflakes to accompany a holiday message.

## Why screen effects?

Providing screen effects can be a way to surprise and delight an app's users, by presenting them with an unexpected visual effect.

## Install the package

```bash
# npm
npm i @xmtp/experimental-content-type-screen-effect

# yarn
yarn add @xmtp/experimental-content-type-screen-effect

# pnpm
pnpm i @xmtp/experimental-content-type-screen-effect
```

## Create a screen effect

Screen effects are represented as objects with the following keys:

- `messageId`: The message id for the message that the screen effect is being sent with
- `effectType`: The type of effect (currently `SNOW` or `RAIN`, feel free to add additional effects via a PR)

```tsx
const screenEffect: ScreenEffect = {
  reference: someMessageID,
  effectType: "SNOW",
};
```

## Send a screen effect

Now that you have a screen effect, you can send it:

```tsx
await conversation.messages.send(screenEffect, {
  contentType: ContentTypeScreenEffect,
});
```

> **Note**  
> `contentFallback` text is provided by the codec and is set to undefined, ensuring that clients that _don't_ support this content type are not required to render anything in their app.

## Receive a screen effect

Now that you can send a screen effect, you need a way to receive it. For example:

```tsx
// Assume `loadLastMessage` is a thing you have
const message: DecodedMessage = await loadLastMessage();

if (message.contentType.sameAs(ContentTypeScreenEffect)) {
  // We've got a screen effect.
  const screenEffect: ScreenEffect = message.content;
}
```

## Display the screen effect

Generally, screen effects sent with snow or rain are displayed as a visual effect. For example, a snow effect might be displayed as snow falling down the page for a short period of time.

It is important to note that these are not intended to be displayed every time a message is loaded; for that reason, apps using screen effects must track the effects that have already been run so as to not re-run effects on every page refresh.

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
