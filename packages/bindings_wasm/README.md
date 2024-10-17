# [WASM](https://webassembly.org/) for the libXMTP rust library

# WARNING: DO NOT USE FOR PRODUCTION XMTP CLIENTS

This code is still under development.

## Generate bindings for Node.js

```shell
cd bindings_wasm
npm i
npm run build
```

## Test the WASM bindings from Node.js

Use the steps above to generate the bindings first.

```shell
node test.mjs
```
