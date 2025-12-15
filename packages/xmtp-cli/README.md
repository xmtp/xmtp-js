# XMTP CLI

XMTP CLI is designed for testing, debugging, and generally interacting with XMTP conversations, groups, and messages. The `xmtp` command allows for managing conversations, sending messages, and debugging your XMTP setup.

## Getting started

- [Installation instructions →](#installation)

- [Usage without installation →](#usage-without-installation)

- [Full documentation →](https://docs.xmtp.org)

## Installation

```bash
npm install -g @xmtp/cli
# or
pnpm add -g @xmtp/cli
# or
yarn global add @xmtp/cli
```

## Usage Without Installation

You can also run the CLI without installing it globally:

```bash
# npm
npx @xmtp/cli <command> <arguments>

# pnpm
pnpx @xmtp/cli <command> <arguments>

# yarn
yarn dlx @xmtp/cli <command> <arguments>
```

## Features

- Manage XMTP groups and direct messages

- Send messages to conversations

- Debug and diagnose XMTP setup

- List conversations, members, and messages

- Manage group permissions

- Support for various content types (text, markdown, attachments, transactions, and more)

- Formatted and colorized output

[See all features →](https://docs.xmtp.org)

## Environment Variables

Set the following required variables in your `.env` file:

```bash
XMTP_ENV=dev                    # or production
XMTP_WALLET_KEY=0x1234...      # Private key for Ethereum wallet
XMTP_DB_ENCRYPTION_KEY=0xabcd... # Database encryption key
XMTP_DB_DIRECTORY=my/database/dir # Database directory (optional)
```

## Examples

Send a message to an address:

```bash
xmtp send --target 0x1234... --message "Hello!"
# Send a message to a group
xmtp send --group-id <group-id> --message "Welcome!"
# Send and wait for a response
xmtp send --target 0x1234... --wait

```

Create a group and send a message:

```bash
xmtp groups create --type group --name "Team" --member-addresses "0x123...,0x456..."
xmtp send --group-id <group-id> --message "Welcome!"
```

Get debug information:

```bash
xmtp debug info
```

List conversations:

```bash
xmtp list conversations
```

Use without installation:

```bash
npx @xmtp/cli send --target 0x1234... --message "Hello!"
```

[See more examples →](#commands)

## Commands

### Groups

Manage XMTP groups and DMs.

```bash
# Create a DM
xmtp groups create --target 0x123...

# Create a group with member addresses
xmtp groups create --type group --name "Team" --member-addresses "0x123...,0x456..."

# Create a group with inbox IDs
xmtp groups create --type group --name "Team" --member-inbox-ids "inbox1...,inbox2..."

# Create a group with both addresses and inbox IDs
xmtp groups create --type group --name "Team" --member-addresses "0x123..." --member-inbox-ids "inbox1..."

# Update group metadata
xmtp groups metadata --group-id <id> --name "New Name"
```

**Options:**

- `--target <address>` - Target address (required for DM)
- `--type <type>` - Conversation type: `dm` or `group` (default: `dm`)
- `--name <name>` - Group name
- `--member-addresses <addresses>` - Comma-separated member Ethereum addresses
- `--member-inbox-ids <inboxIds>` - Comma-separated member inbox IDs
- `--group-id <id>` - Group ID for metadata operations
- `--image-url <url>` - Image URL for metadata updates

## Debugging

CLI can also recognize the following environment variables for debugging:

| Variable                 | Purpose                                                              | Example                        |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------ |
| `XMTP_FORCE_DEBUG`       | [Activate debugging logs](https://docs.xmtp.org/agents/debug-agents) | `XMTP_FORCE_DEBUG=true`        |
| `XMTP_FORCE_DEBUG_LEVEL` | Specify the logging level (defaults to `"info"`)                     | `XMTP_FORCE_DEBUG_LEVEL=debug` |

### Sync

Sync conversations and groups.

```bash
# Sync conversations
xmtp sync

# Sync all conversations and messages
xmtp syncall
```

### Send

Send messages to conversations.

```bash
# Send to address
xmtp send --target 0x1234... --message "Hello!"

# Send to address with alias
xmtp send -t 0x1234... -m "Hello!"

# Send to group
xmtp send --group-id abc123... --message "Hello group!"

# Send and wait for response
xmtp send --target 0x1234... --message "Hello!" --wait

# Send and wait for response with custom timeout
xmtp send --target 0x1234... --message "Hello!" --wait --timeout 60000
```

**Options:**

- `--target <address>` / `-t` - Target wallet address
- `--group-id <id>` - Group ID
- `--message <text>` / `-m` - Message text (default: "hello world")
- `--wait` - Wait for a response after sending the message (default: false)
- `--timeout <ms>` - Timeout in milliseconds when waiting for response (default: 30000)

### Debug

Get debug and diagnostic information.

```bash
# General info
xmtp debug info

# Resolve address to inbox ID
xmtp debug resolve --address 0x1234...

# Get address information
xmtp debug address --address 0x1234...

# Get inbox information
xmtp debug inbox --inbox-id abc...
```

**Operations:** `info` (default), `address`, `inbox`, `resolve`, `installations`, `key-package`

**Options:**

- `--address <address>` - Ethereum address
- `--inbox-id <id>` - Inbox ID

### Permissions

Manage group permissions.

```bash
# List members and permissions
xmtp permissions list --group-id <id>

# Get detailed group info
xmtp permissions info --group-id <id>

# Update permissions
xmtp permissions update-permissions --group-id <id> --features update-metadata --permissions admin-only
```

**Operations:** `list` (default), `info`, `update-permissions`

**Options:**

- `--group-id <id>` - Group ID (required)
- `--features <features>` - Comma-separated features to update
- `--permissions <type>` - Permission type: `everyone`, `disabled`, `admin-only`, `super-admin-only`

### List

List conversations, members, and messages.

```bash
# List conversations
xmtp list conversations

# List members
xmtp list members --conversation-id <id>

# List messages
xmtp list messages --conversation-id <id>

# Find conversation
xmtp list find --address 0x1234...
```

**Operations:** `conversations` (default), `members`, `messages`, `find`

**Options:**

- `--conversation-id <id>` - Conversation ID
- `--limit <count>` - Maximum results (default: 50)
- `--offset <count>` - Pagination offset (default: 0)
- `--address <address>` - Ethereum address for find
- `--inbox-id <id>` - Inbox ID for find

### Content

Demonstrate various XMTP content types.

```bash
# Send text with reply and reaction
xmtp content text --target 0x1234...

# Send markdown
xmtp content markdown --target 0x1234...

# Send attachment
xmtp content attachment --target 0x1234...
```

**Operations:** `text` (default), `markdown`, `attachment`, `transaction`, `deeplink`, `miniapp`

**Options:**

- `--target <address>` - Target wallet address
- `--group-id <id>` - Group ID
- `--amount <amount>` - Amount for transactions (default: 0.1)

## Getting Help

```bash
xmtp --help
xmtp <command> --help
```

## Community & Support

- Visit the [XMTP website](https://xmtp.org) for full documentation and useful links.

- Join our [Community Forums](https://community.xmtp.org) to ask questions, discuss features, and for general XMTP chat.

- Check out the [XMTP documentation](https://docs.xmtp.org) for detailed guides and API references.

- Create [GitHub Issues](https://github.com/xmtp/xmtp-js/issues) for bug reports and feature requests.

## Contributing

Have a look through existing [Issues](https://github.com/xmtp/xmtp-js/issues) and [Pull Requests](https://github.com/xmtp/xmtp-js/pulls) that you could help with. If you'd like to request a feature or report a bug, please [create a GitHub Issue](https://github.com/xmtp/xmtp-js/issues) using one of the templates provided.

[See contribution guide →](https://github.com/xmtp/xmtp-js/blob/main/CONTRIBUTING.md)

## Development

```bash
# Build
yarn build

# Run during development
yarn start
```

---

Build something delightful. Then tell us what you wish was easier.

Happy hacking!
