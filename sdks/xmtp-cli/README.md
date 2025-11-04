# XMTP CLI

A command-line interface for managing XMTP protocol operations. 🚀

## Installation

Choose your package manager:

```bash
npm install -g @xmtp/cli

# or

pnpm add -g @xmtp/cli

# or

yarn global add @xmtp/cli
```

## Quick Start

```bash
# Get general help
xmtp --help

# Check your agent setup
xmtp debug info

# Send a message
xmtp send --target 0x1234... --message "Hello!"
```

## Environment Variables

The XMTP CLI uses environment variables from your `.env` file or `process.env`. Set the following variables:

**Required Variables:**

| Variable                 | Purpose                                                                                                         | Example                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `XMTP_DB_DIRECTORY`      | [Database directory](https://docs.xmtp.org/agents/build-agents/local-database#understand-local-database-files)  | `XMTP_DB_DIRECTORY=my/database/dir`     |
| `XMTP_DB_ENCRYPTION_KEY` | [Database encryption key](https://docs.xmtp.org/agents/concepts/identity#keep-the-database-encryption-key-safe) | `XMTP_DB_ENCRYPTION_KEY=0xabcd...1234`  |
| `XMTP_ENV`               | [Network environment](https://docs.xmtp.org/chat-apps/core-messaging/create-a-client#xmtp-network-environments) | `XMTP_ENV=dev` or `XMTP_ENV=production` |
| `XMTP_WALLET_KEY`        | [Private key for Ethereum wallet](https://docs.xmtp.org/chat-apps/core-messaging/create-a-signer)               | `XMTP_WALLET_KEY=0x1234...abcd`         |

**Example `.env` file:**

```bash
XMTP_ENV=dev
XMTP_WALLET_KEY=0x1234...
XMTP_DB_ENCRYPTION_KEY=0xabcd...
```

## Commands

### Groups Command

Manage XMTP groups and direct messages.

```bash
# Create a DM (default type)
xmtp groups create --target 0x123...

# Create a DM explicitly
xmtp groups create --type dm --target 0x123...

# Create a group with addresses (automatically detected)
xmtp groups create --type group --name "Team" --members "0x123...,0x456..."

# Create a group with inbox IDs (automatically detected)
xmtp groups create --type group --name "Team" --members "inbox1...,inbox2..."

# Update group metadata
xmtp groups metadata --group-id <id> --name "New Name"
xmtp groups metadata --group-id <id> --image-url "https://example.com/image.jpg"
```

**Operations:**

- `create` - Create DMs or groups (default: creates DM)
- `metadata` - Update group name, description, or image

**Options:**

- `--group-id <id>` - Group ID for metadata operations
- `--name <name>` - Group name
- `--description <desc>` - Group description
- `--type <type>` - Conversation type: `dm` or `group` (default: `dm`)
- `--target <address>` - Target address (required for DM creation)
- `--members <members>` - Comma-separated member addresses or inbox IDs (automatically detected)
- `--image-url <url>` - Image URL for metadata updates

### Send Command

Send messages to conversations.

```bash
# Send a single message
xmtp send --target 0x1234... --message "Hello!"

# Send multiple messages (load testing)
xmtp send --target 0x1234... --users 10

# Send to a group
xmtp send --group-id abc123... --message "Hello group!"

# Send with multiple attempts
xmtp send --target 0x1234... --users 100 --attempts 5

# Send and wait for responses
xmtp send --target 0x1234... --users 10 --wait
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
xmtp debug info

# Resolve address to inbox ID
xmtp debug resolve --address 0x1234...

# Resolve inbox ID to address
xmtp debug resolve --inbox-id abc...

# Get address information
xmtp debug address --address 0x1234...

# Get inbox information
xmtp debug inbox --inbox-id abc...

# Check key package status
xmtp debug key-package --inbox-id abc...

# Get installations
xmtp debug installations --inbox-id abc...
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
xmtp permissions list --group-id <id>

# Get detailed group info
xmtp permissions info --group-id <id>

# Update permissions
xmtp permissions update-permissions --group-id <id> --features update-metadata --permissions admin-only
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
xmtp list conversations

# List with pagination
xmtp list conversations --limit 20 --offset 10

# List members of a conversation
xmtp list members --conversation-id <id>

# List messages in a conversation
xmtp list messages --conversation-id <id>

# Find conversation by inbox ID or address
xmtp list find --inbox-id abc...
xmtp list find --address 0x1234...
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
xmtp content text --target 0x1234...

# Send markdown formatted message
xmtp content markdown --target 0x1234...

# Send attachment (simplified)
xmtp content attachment --target 0x1234...

# Send to a group
xmtp content text --group-id abc123...
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

## Getting Help

```bash
# General help
xmtp --help

# Command-specific help
xmtp groups --help
xmtp send --help
xmtp debug --help
xmtp permissions --help
xmtp list --help
xmtp content --help
```

## Examples

### Create a Group and Send a Message

```bash
# Create a group
xmtp groups create --type group --name "Team Chat" \
  --members "0x123...,0x456...,0x789..."

# Send a message to the group
xmtp send --group-id <group-id> --message "Welcome to the team!"
```

### Load Testing

```bash
# Send 100 messages with 5 attempts
xmtp send --target 0x1234... --users 100 --attempts 5 --threshold 95
```

### Debug Agent Setup

```bash
# Check your agent is working
xmtp debug info

# Verify installation
xmtp debug installations --inbox-id <your-inbox-id>
```

### Monitor Conversations

```bash
# List recent conversations
xmtp list conversations --limit 10

# Check messages in a conversation
xmtp list messages --conversation-id <id> --limit 20
```

## Troubleshooting

**"Agent creation failed"**

- Check your `.env` file has `XMTP_WALLET_KEY` and `XMTP_DB_ENCRYPTION_KEY`
- Verify `XMTP_ENV` is set to correct environment (dev/production)

**"No conversations found"**

- Run `xmtp debug info` to verify agent setup
- Check you're using the correct environment

**"Group not found"**

- Verify the group ID is correct
- Ensure you have access to the group
- Check environment matches the group's environment

## Development

For developers working on the CLI repository:

### Internal Commands

When working in the repository, you can use yarn scripts to run commands directly:

```bash
# Run commands during development
yarn groups --help
yarn send --target 0x1234...
yarn debug info
yarn permissions list --group-id <id>
yarn list conversations
yarn content text --target 0x1234...
```

### Architecture

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

### Building

```bash
# Build the CLI
yarn build

# Run type checking
yarn typecheck

# Lint code
yarn lint

# Format code
yarn format
```

## Contributing / Feedback

We'd love your feedback: [open an issue](https://github.com/xmtp/xmtp-js/issues) or discussion. PRs welcome for docs, examples, and core improvements.

---

Build something delightful. Then tell us what you wish was easier.

Happy hacking 💫
