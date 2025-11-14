# XMTP CLI

A command-line interface for XMTP.

## Installation

```bash
npm install -g @xmtp/cli
# or
pnpm add -g @xmtp/cli
# or
yarn global add @xmtp/cli
```

## Environment Variables

Set the following required variables in your `.env` file:

```bash
XMTP_ENV=dev                    # or production
XMTP_WALLET_KEY=0x1234...      # Private key for Ethereum wallet
XMTP_DB_ENCRYPTION_KEY=0xabcd... # Database encryption key
XMTP_DB_DIRECTORY=my/database/dir # Database directory (optional)
```

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

### Send

Send messages to conversations.

```bash
# Send to address
xmtp send --target 0x1234... --message "Hello!"

# Send to group
xmtp send --group-id abc123... --message "Hello group!"
```

**Options:**

- `--target <address>` - Target wallet address
- `--group-id <id>` - Group ID
- `--message <text>` - Message text (required)

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

## Examples

```bash
# Create a group with member addresses and send a message
xmtp groups create --type group --name "Team" --member-addresses "0x123...,0x456..."
xmtp send --group-id <group-id> --message "Welcome!"

# Create a group with inbox IDs
xmtp groups create --type group --name "Team" --member-inbox-ids "inbox1...,inbox2..."

# Debug your setup
xmtp debug info

# List conversations
xmtp list conversations
```

## Development

```bash
# Build
yarn build

# Run during development
yarn start
```

---

Build something delightful. Then tell us what you wish was easier.

Happy hacking 💫
