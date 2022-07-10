#!/usr/bin/env sh
set -e
protoc -I /opt/proto "$@"
