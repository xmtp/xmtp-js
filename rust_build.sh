#!/bin/bash

set -ex

npm run clean
npm install ../libxmtp/bindings/wasm
npm run build
npm run package
