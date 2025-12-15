# xmtp.chat app

Use this React app as a tool to start building an app with XMTP.

The app is built using the [XMTP client browser SDK](/sdks/browser-sdk/README.md), [React](https://react.dev/), and [RainbowKit](https://www.rainbowkit.com/).

To keep up with the latest React app developments, see the [Issues tab](https://github.com/xmtp/xmtp-js/issues) in this repo.

To learn more about XMTP and get answers to frequently asked questions, see the [XMTP documentation](https://xmtp.org/docs).

## Run xmtp.chat locally

### Setup environment

Copy `.env.example` to `.env` and fill in the proper values.

### API service

Refer to the [README](../xmtp.chat-api-service/README.md) in the API service for instructions on running it locally.

### Start the app

Make sure the API service is up before running this command.

```bash
# Start the app in dev mode
yarn dev
```

## Useful commands

- `yarn clean`: Removes `node_modules` and `.turbo` folders
- `yarn dev`: Runs the app in development mode
- `yarn typecheck`: Runs `tsc`
