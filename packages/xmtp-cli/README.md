# @xmtp/cli

> [!CAUTION]
> This CLI is in beta status and ready for you to use. Software in this status may change based on feedback.

A command-line interface for [XMTP](https://xmtp.org), the decentralized messaging protocol.

## Features

- Send and receive encrypted messages
- Manage direct messages (DMs) and group conversations
- Manage identity across multiple wallets
- Set consent preferences for spam control
- Stream messages and conversations in real-time
- JSON output for scripting and automation

## Requirements

- Node.js >= 22

## Installation

```bash
# npm
npm install -g @xmtp/cli

# pnpm
pnpm add -g @xmtp/cli
```

## Run Without Installing

```bash
# npx
npx @xmtp/cli --help

# pnpx
pnpx @xmtp/cli --help

# yarn
yarn dlx @xmtp/cli --help
```

## Quick Start

```bash
# 1. Generate wallet and encryption keys
xmtp init

# 2. Check if a recipient can receive messages
xmtp can-message <address>

# 3. Create a DM and send a message
xmtp conversations create-dm <address>
xmtp conversation send-text <conversation-id> "Hello!"

# 4. Create a group and send a message
xmtp conversations create-group <address-1> <address-2> --name "My Group"
xmtp conversation send-text <conversation-id> "Hello!"
```

## Configuration

Running `xmtp init` generates a `.env` file at `~/.xmtp/.env` with:

| Variable                 | Description                              |
| ------------------------ | ---------------------------------------- |
| `XMTP_WALLET_KEY`        | Ethereum private key (hex)               |
| `XMTP_DB_ENCRYPTION_KEY` | 32-byte database encryption key (hex)    |
| `XMTP_ENV`               | Network: `local`, `dev`, or `production` |

The default environment is `dev`. Use `--env` to change it:

```bash
xmtp init --env production
```

Values from the `.env` file can always be overridden with CLI flags:

```bash
xmtp client info --env production --wallet-key <key> --db-encryption-key <key> --db-path ./my-db
```

Configuration is loaded in priority order:

1. CLI flags (highest)
2. `--env-file <path>`
3. `.env` in current directory
4. `~/.xmtp/.env` (default)

## Command Topics

| Topic           | Purpose                                |
| --------------- | -------------------------------------- |
| `client`        | Identity and installation management   |
| `conversations` | List, create, and stream conversations |
| `conversation`  | Interact with a single conversation    |
| `preferences`   | Consent and preference management      |

Run `xmtp --help` for all commands, or `xmtp <command> --help` for details on a specific command.

## Usage Examples

### Messages

```bash
# Send different message types
xmtp conversation send-text <conversation-id> "Hello!"
xmtp conversation send-markdown <conversation-id> "**bold** text"
xmtp conversation send-reply <conversation-id> <message-id> "Reply"
xmtp conversation send-reaction <conversation-id> <message-id> add "👍"

# Read messages
xmtp conversation messages <conversation-id>
xmtp conversation messages <conversation-id> --sync --limit 10
```

### Streaming

```bash
# Stream messages from all conversations
xmtp conversations stream-all-messages

# Stream from a single conversation
xmtp conversation stream <conversation-id>

# Stream new conversations
xmtp conversations stream --type dm
```

### Groups

```bash
# Create with metadata and permissions
xmtp conversations create-group <address> \
  --name "Project Team" \
  --description "Team discussion" \
  --permissions admin-only

# Manage members
xmtp conversation members <conversation-id>
xmtp conversation add-members <conversation-id> <inbox-id>
xmtp conversation remove-members <conversation-id> <inbox-id>
```

### Identity

```bash
# View client info
xmtp client info

# Sign and verify messages
xmtp client sign "Hello, World!"
xmtp client verify-signature "Hello, World!" --signature <signature>

# Manage wallets
xmtp client add-account --new-wallet-key <wallet-key> --force
xmtp client remove-account --identifier <address> --force
```

### JSON Output

All commands support `--json` for machine-readable output:

```bash
DM_ID=$(xmtp conversations create-dm <address> --json | jq -r '.id')
xmtp conversation send-text "$DM_ID" "Hello!"
```
