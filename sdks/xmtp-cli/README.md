# XMTP CLI

A barebones CLI built with [Commander.js](https://github.com/tj/commander.js) for managing XMTP protocol operations.

## Quick Start

```bash
# Run commands via yarn or the xmtp binary
yarn groups --help
yarn send --target 0x123...
xmtp debug info
```

## Commands Overview

### Groups Command

Manage XMTP groups and direct messages.

```bash
# Create a DM (default type)
yarn groups create --target 0x123...

# Create a DM explicitly
yarn groups create --type dm --target 0x123...

# Create a group with specific addresses
yarn groups create-by-address --name "Team" --member-addresses "0x123...,0x456..."

# Update group metadata
yarn groups metadata --group-id <id> --name "New Name"
yarn groups metadata --group-id <id> --image-url "https://example.com/image.jpg"
```

**Operations:**

- `create` - Create DMs or groups (default: creates DM)
- `create-by-address` - Create groups using Ethereum addresses
- `metadata` - Update group name, description, or image

**Options:**

- `--group-id <id>` - Group ID for metadata operations
- `--name <name>` - Group name
- `--description <desc>` - Group description
- `--type <type>` - Conversation type: `dm` or `group` (default: `dm`)
- `--target <address>` - Target address (required for DM creation)
- `--member-addresses <addresses>` - Comma-separated Ethereum addresses
- `--image-url <url>` - Image URL for metadata updates

### Send Command

Send messages to conversations.

```bash
# Send a single message
yarn send --target 0x1234... --message "Hello!"

# Send multiple messages (load testing)
yarn send --target 0x1234... --users 10

# Send to a group
yarn send --group-id abc123... --message "Hello group!"

# Send with multiple attempts
yarn send --target 0x1234... --users 100 --attempts 5

# Send and wait for responses
yarn send --target 0x1234... --users 10 --wait
```

**Options:**

- `--target <address>` - Target wallet address
- `--group-id <id>` - Group ID
- `--message <text>` - Message text
- `--users <count>` - Number of messages to send (default: 1)
- `--attempts <count>` - Number of attempts (default: 1)
- `--threshold <percent>` - Success threshold percentage (default: 95)
- `--wait` - Wait for responses from target

### Debug Command

Get debug and diagnostic information.

```bash
# General info about your agent
yarn debug info

# Resolve address to inbox ID
yarn debug resolve --address 0x1234...

# Resolve inbox ID to address
yarn debug resolve --inbox-id abc...

# Get address information
yarn debug address --address 0x1234...

# Get inbox information
yarn debug inbox --inbox-id abc...

# Check key package status
yarn debug key-package --inbox-id abc...

# Get installations
yarn debug installations --inbox-id abc...
```

**Operations:**

- `info` - General agent information (default)
- `address` - Address information and installations
- `inbox` - Inbox information and identifiers
- `resolve` - Resolve between addresses and inbox IDs
- `key-package` - Key package validation status
- `installations` - Installation details

**Options:**

- `--address <address>` - Ethereum address
- `--inbox-id <id>` - Inbox ID

### Permissions Command

Manage group permissions.

```bash
# List group members and permissions
yarn permissions list --group-id <id>

# Get detailed group info
yarn permissions info --group-id <id>

# Update permissions
yarn permissions update-permissions --group-id <id> --features update-metadata --permissions admin-only
```

**Operations:**

- `list` - List members and permissions (default)
- `info` - Get detailed group information
- `update-permissions` - Update permission policies

**Options:**

- `--group-id <id>` - Group ID (required)
- `--features <features>` - Comma-separated features to update
- `--permissions <type>` - Permission type: `everyone`, `disabled`, `admin-only`, `super-admin-only`

**Available Features:**

- `add-member` - Adding members to group
- `remove-member` - Removing members from group
- `add-admin` - Promoting members to admin
- `remove-admin` - Demoting admins to members
- `update-metadata` - Updating group metadata

### List Command

List conversations, members, and messages.

```bash
# List all conversations
yarn list conversations

# List with pagination
yarn list conversations --limit 20 --offset 10

# List members of a conversation
yarn list members --conversation-id <id>

# List messages in a conversation
yarn list messages --conversation-id <id>

# Find conversation by inbox ID or address
yarn list find --inbox-id abc...
yarn list find --address 0x1234...
```

**Operations:**

- `conversations` - List all conversations (default)
- `members` - List members of a conversation
- `messages` - List messages in a conversation
- `find` - Find conversation by inbox ID or address

**Options:**

- `--conversation-id <id>` - Conversation ID
- `--limit <count>` - Maximum results (default: 50)
- `--offset <count>` - Pagination offset (default: 0)
- `--inbox-id <id>` - Inbox ID for find operation
- `--address <address>` - Ethereum address for find operation

### Content Command

Demonstrate various XMTP content types.

```bash
# Send text with reply and reaction
yarn content text --target 0x1234...

# Send markdown formatted message
yarn content markdown --target 0x1234...

# Send attachment (simplified)
yarn content attachment --target 0x1234...

# Send to a group
yarn content text --group-id abc123...
```

**Operations:**

- `text` - Text with reply and reaction (default)
- `markdown` - Markdown formatted content
- `attachment` - Remote attachments
- `transaction` - Wallet transaction calls
- `deeplink` - Deep link for messaging
- `miniapp` - Mini app URLs

**Options:**

- `--target <address>` - Target wallet address
- `--group-id <id>` - Group ID
- `--amount <amount>` - Amount for transactions (default: 0.1)

## Environment Variables

Commands use environment variables from your `.env` file:

```bash
XMTP_ENV=dev                    # local, dev, production
XMTP_WALLET_KEY=...             # Agent wallet private key
XMTP_DB_ENCRYPTION_KEY=...      # Database encryption key
```

## Architecture

The CLI uses a minimal architecture built with Commander.js:

```
packages/cli/
├── index.ts           # Main CLI entry point
└── commands/          # Individual command files
    ├── groups.ts
    ├── send.ts
    ├── debug.ts
    ├── permissions.ts
    ├── list.ts
    └── content-types.ts
```

Each command file:

1. Uses Commander.js for argument parsing
2. Creates its own Agent instance via `Agent.createFromEnv()`
3. Implements only the essential command logic
4. No shared utilities or abstractions

## Getting Help

```bash
# General help
xmtp --help

# Command-specific help
yarn groups --help
yarn send --help
yarn debug --help
yarn permissions --help
yarn list --help
yarn content --help
```

## Examples

### Create a Group and Send a Message

```bash
# Create a group
yarn groups create-by-address --name "Team Chat" \
  --member-addresses "0x123...,0x456...,0x789..."

# Send a message to the group
yarn send --group-id <group-id> --message "Welcome to the team!"
```

### Load Testing

```bash
# Send 100 messages with 5 attempts
yarn send --target 0x1234... --users 100 --attempts 5 --threshold 95
```

### Debug Agent Setup

```bash
# Check your agent is working
yarn debug info

# Verify installation
yarn debug installations --inbox-id <your-inbox-id>
```

### Monitor Conversations

```bash
# List recent conversations
yarn list conversations --limit 10

# Check messages in a conversation
yarn list messages --conversation-id <id> --limit 20
```

## Notes

- Commands can be run via `yarn <command>` or globally via `xmtp <command>`
- All commands require proper environment setup and authentication
- The CLI focuses on simplicity - each command is self-contained
- No agent utilities or complex abstractions - just raw Commander.js power

## Troubleshooting

**"Agent creation failed"**

- Check your `.env` file has `XMTP_WALLET_KEY` and `XMTP_DB_ENCRYPTION_KEY`
- Verify `XMTP_ENV` is set to correct environment (local/dev/production)

**"No conversations found"**

- Run `yarn debug info` to verify agent setup
- Check you're using the correct environment

**"Group not found"**

- Verify the group ID is correct
- Ensure you have access to the group
- Check environment matches the group's environment
