#!/usr/bin/env bash
# Based loosely off of the script here https://docs.buf.build/ci-cd/setup
# Fixed a bug in their script + added support for checking if buf is already installed

set -eu

if which buf &>/dev/null; then
    echo "Existing buf version found. No need to install"
    exit 0
fi


# Use your desired buf version
BUF_VERSION=1.0.0
# Putting this in a location likely to already be in the $PATH
BIN_DIR="$npm_config_prefix/bin"

URL="https://github.com/bufbuild/buf/releases/download/v$BUF_VERSION/buf-$(uname -s)-$(uname -m)"
echo "Downloading buf from $URL"

curl -sSL $URL -o "$BIN_DIR/buf"
chmod +x "$BIN_DIR/buf"
