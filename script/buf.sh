#!/usr/bin/env bash

set -euo pipefail

if which buf &>/dev/null; then
    echo "Existing buf version found. No need to install"
    exit 0
fi

# Try and install curl if it doesn't exist. Needed for CloudFlare Pages
if ! which curl &>/dev/null; then
  echo "Installing curl"
  apt update
  apt install curl 
fi

# Use your desired buf version
BUF_VERSION=1.0.0
# Putting this in a location likely to already be in the $PATH
BIN_DIR=/usr/local/bin

curl -sSL \
    "https://github.com/bufbuild/buf/releases/download/v$BUF_VERSION/buf-$(shell uname -s)-$(shell uname -m)" \
    -o "$BIN_DIR/buf"
chmod +x "$BIN_DIR/buf"
