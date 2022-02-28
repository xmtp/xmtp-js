#!/usr/bin/env bash

if which buf &>/dev/null; then
    echo "existing buf version found"
    exit 0
fi

# Use your desired buf version
BUF_VERSION=1.0.0
# Putting this in a location likely to already be in the $PATH
BIN_DIR=/usr/local/bin

curl -sSL \
    "https://github.com/bufbuild/buf/releases/download/v$BUF_VERSION/buf-$(shell uname -s)-$(shell uname -m)" \
    -o "$BIN_DIR/buf"
chmod +x "$BIN_DIR/buf"
