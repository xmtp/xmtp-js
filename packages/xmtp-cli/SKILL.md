---
name: xmtp-cli
description: Use when working with XMTP messaging - sending messages, managing conversations, groups, consent, and identity operations via the xmtp CLI tool
---

# XMTP CLI

The XMTP CLI (`xmtp`) is a command-line tool for interacting with the XMTP decentralized messaging protocol. It enables:

- Sending and receiving encrypted messages
- Managing direct messages (DMs) and group conversations
- Managing identity across multiple wallets
- Setting consent preferences for spam control

## Prerequisites

### Initialize Configuration

Before using most commands, initialize the CLI with wallet and encryption keys:

```bash
# Generate keys and save to default path (~/.xmtp/.env)
xmtp init

# Or output to console
xmtp init --stdout

# For production use with custom path
xmtp init --env production --output ./my-project/.env

# Overwrite existing config
xmtp init --force
```

This creates a `.env` file with:

- `XMTP_WALLET_KEY` - Your wallet private key (identity)
- `XMTP_DB_ENCRYPTION_KEY` - Database encryption key (local data protection)
- `XMTP_ENV` - Network environment (local, dev, production)

### Configuration Loading Priority

1. CLI flags (highest priority)
2. Explicit `--env-file <path>`
3. `.env` in the current working directory
4. `~/.xmtp/.env` (global default)

### Environment Variables

| Variable                 | Description                                           | Required              |
| ------------------------ | ----------------------------------------------------- | --------------------- |
| `XMTP_WALLET_KEY`        | Ethereum private key (hex, with or without 0x prefix) | Yes\*                 |
| `XMTP_DB_ENCRYPTION_KEY` | 32-byte encryption key (hex)                          | Yes\*                 |
| `XMTP_ENV`               | Network: `local`, `dev`, or `production`              | No (default: dev)     |
| `XMTP_DB_PATH`           | Custom database directory path                        | No (default: ~/.xmtp) |
| `XMTP_GATEWAY_HOST`      | Custom gateway URL                                    | No                    |

\*Required for commands that need a client. If missing, the CLI will suggest running `init` to generate them.

## Command Structure

All commands use kebab-case:

```
xmtp [TOPIC] [COMMAND] [ARGUMENTS] [FLAGS]
```

### Topics

| Topic           | Purpose                              |
| --------------- | ------------------------------------ |
| (root)          | Standalone utility commands          |
| `client`        | Identity and installation management |
| `conversations` | Manage multiple conversations        |
| `conversation`  | Single conversation operations       |
| `preferences`   | Consent and preferences              |

## Output Modes

All commands support `--json` for machine-readable JSON output:

```bash
xmtp client info --json
```

## Common Workflows

### Check if an Address Can Receive Messages

```bash
xmtp can-message <address>
xmtp can-message <address-1> <address-2>  # multiple addresses
xmtp can-message <address> --json
```

### Get Client Information

Shows client properties (address, inboxId, installationId, etc.) and client options (env, dbPath, etc.) in two sections. JSON output is nested as `{ properties, options }`.

```bash
xmtp client info
xmtp client info --json
```

### Sign and Verify Messages

```bash
# Sign a message with the installation key
xmtp client sign "Hello, World!"
xmtp client sign "verify me" --base64

# Verify a signature
xmtp client verify-signature "Hello, World!" --signature <hex-signature>
xmtp client verify-signature "verify me" --signature <base64-signature> --base64
```

### Send a Message

```bash
# Create a DM with someone
xmtp conversations create-dm <address>

# Send message to conversation
xmtp conversation send-text <conversation-id> "Hello, world!"

# Combined workflow
DM_ID=$(xmtp conversations create-dm <address> --json | jq -r '.id')
xmtp conversation send-text "$DM_ID" "Hello!"
```

### Send Optimistic Messages

```bash
xmtp conversation send-text <conversation-id> "Quick message" --optimistic
xmtp conversation publish-messages <conversation-id>  # publish later
```

### Send Other Message Types

```bash
# Markdown
xmtp conversation send-markdown <conversation-id> "**bold** and *italic*"

# Reply to a message
xmtp conversation send-reply <conversation-id> <message-id> "Replying to your message"

# Reaction (add or remove)
xmtp conversation send-reaction <conversation-id> <message-id> add "👍"
xmtp conversation send-reaction <conversation-id> <message-id> remove "👍"

# Read receipt
xmtp conversation send-read-receipt <conversation-id>
```

### Create a Group

```bash
xmtp conversations create-group <address-1> <address-2> --name "My Team"

# With full metadata
xmtp conversations create-group <address> \
  --name "Project Team" \
  --description "Discussion for our project" \
  --image-url "https://example.com/team.png" \
  --permissions admin-only
```

### List and Read Messages

```bash
xmtp conversations list
xmtp conversation messages <conversation-id>
xmtp conversation messages <conversation-id> --limit 10
xmtp conversation messages <conversation-id> --sync  # sync from network first
```

### Filter Messages

```bash
xmtp conversation messages <conversation-id> --content-type text --content-type markdown
xmtp conversation messages <conversation-id> --exclude-content-type reaction
xmtp conversation messages <conversation-id> --delivery-status published
xmtp conversation messages <conversation-id> --kind application
xmtp conversation messages <conversation-id> --sent-after 1700000000000000000
xmtp conversation messages <conversation-id> --exclude-sender <inbox-id>
xmtp conversation messages <conversation-id> --sort-by inserted-at
```

### Look Up a DM

```bash
xmtp conversations get-dm <address>
xmtp conversations get-dm <inbox-id>
```

### Stream in Real-Time

```bash
# Stream messages from all conversations
xmtp conversations stream-all-messages
xmtp conversations stream-all-messages --timeout 60
xmtp conversations stream-all-messages --count 10

# Stream messages from a single conversation
xmtp conversation stream <conversation-id>

# Stream new conversations
xmtp conversations stream
xmtp conversations stream --type dm
xmtp conversations stream --type group
xmtp conversations stream --timeout 60 --count 5
```

### Manage Group Members

```bash
xmtp conversation members <conversation-id>
xmtp conversation add-members <conversation-id> <inbox-id-1> <inbox-id-2>
xmtp conversation remove-members <conversation-id> <inbox-id>
```

### Update Group Permissions

```bash
# Update a permission type's policy
xmtp conversation update-permission <conversation-id> --type add-member --policy admin
xmtp conversation update-permission <conversation-id> --type remove-member --policy super-admin

# Update a metadata permission (requires --metadata-field)
xmtp conversation update-permission <conversation-id> --type update-metadata --policy admin --metadata-field group-name
xmtp conversation update-permission <conversation-id> --type update-metadata --policy admin --metadata-field group-description
```

Permission types: `add-member`, `remove-member`, `add-admin`, `remove-admin`, `update-metadata`

Policies: `allow`, `deny`, `admin`, `super-admin`

Metadata fields: `group-name`, `group-description`, `group-image-url`, `app-data`

### Manage Consent (Spam Control)

```bash
xmtp conversation consent-state <conversation-id>
xmtp conversation update-consent <conversation-id> --state allowed
xmtp conversation update-consent <conversation-id> --state denied
xmtp preferences set-consent --entity-type inbox-id --entity <inbox-id> --state denied
```

### Leave a Group

```bash
xmtp conversation request-removal <conversation-id>
```

### Sync Data from Network

```bash
xmtp conversations sync
xmtp conversations sync-all
xmtp conversation sync <conversation-id>
xmtp preferences sync
```

### Stream Preference Updates

```bash
xmtp preferences stream
xmtp preferences stream --timeout 60
```

### Inbox States

```bash
# Get your own inbox state
xmtp preferences inbox-state
xmtp preferences inbox-state --sync

# Get inbox states for multiple inbox IDs
xmtp inbox-states <inbox-id-1> <inbox-id-2>

# Get cached inbox states
xmtp preferences inbox-states
```

### HMAC Keys

```bash
xmtp conversations hmac-keys
```

### Manage Multiple Wallets

These operations require `--force` to skip confirmation:

```bash
xmtp client add-account --new-wallet-key <wallet-key> --force
xmtp client remove-account --identifier <address> --force
xmtp client change-recovery-identifier --identifier <address> --force
xmtp preferences inbox-state
```

### Authorization Checks

```bash
# Check if an address is authorized for an inbox
xmtp address-authorized <address> --inbox-id <inbox-id>

# Check if an installation is authorized for an inbox
xmtp installation-authorized <installation-id> --inbox-id <inbox-id>

# Look up inbox ID for an address
xmtp client inbox-id --identifier <address>
```

### Conversation Details

```bash
# Get conversation info
xmtp conversation info <conversation-id>

# Get conversation permissions (groups only)
xmtp conversation permissions <conversation-id>

# Get debug info for a conversation
xmtp conversation debug-info <conversation-id>

# Get a specific conversation by ID
xmtp conversations get <conversation-id>

# Get a specific message by ID
xmtp conversations get-message <message-id>

# Count messages in a conversation
xmtp conversation count-messages <conversation-id>
```

### Group Admin Operations

```bash
xmtp conversation add-admin <conversation-id> <inbox-id>
xmtp conversation remove-admin <conversation-id> <inbox-id>
xmtp conversation add-super-admin <conversation-id> <inbox-id>
xmtp conversation remove-super-admin <conversation-id> <inbox-id>
xmtp conversation list-admins <conversation-id>
xmtp conversation list-super-admins <conversation-id>
```

### Update Group Metadata

```bash
xmtp conversation update-name <conversation-id> "New Name"
xmtp conversation update-description <conversation-id> "New description"
xmtp conversation update-image-url <conversation-id> "https://example.com/image.png"
```

### Security Operations

```bash
xmtp preferences inbox-state --json | jq '.installations'
xmtp client revoke-installations --installation-ids <installation-id> --force
xmtp client revoke-all-other-installations --force
xmtp client key-package-status --installation-ids <installation-id>
```

## Important Concepts

### Inbox ID vs Wallet Address

- **Wallet Address**: Ethereum address (0x...), used for identity
- **Inbox ID**: XMTP network identifier, derived from wallet
- Multiple wallets can be associated with one inbox ID

### Installation ID

Each device/app instance has a unique installation ID. This allows:

- Multiple devices using the same identity
- Revoking access from lost devices

### Conversation ID

Unique identifier for each conversation (DM or group). Required for most conversation operations.

### Consent States

| State     | Meaning              |
| --------- | -------------------- |
| `allowed` | Messages are welcome |
| `denied`  | Messages are blocked |
| `unknown` | No decision made     |

### Environment Networks

| Network      | Use Case                      |
| ------------ | ----------------------------- |
| `local`      | Local XMTP node               |
| `dev`        | Development/testing (default) |
| `production` | Production use                |

## Error Handling

1. **Missing wallet/encryption key**: Run `xmtp init` to generate keys
2. **Invalid wallet key**: Check key format (hex, 32 bytes)
3. **Address not registered**: Use `can-message` to check first
4. **Conversation not found**: Sync first with `conversations sync`
5. **Permission denied**: Check group permissions with `conversation permissions`

## Complete Example

```bash
# 1. Initialize (first time only)
xmtp init --env dev

# 2. Check if recipient can receive messages
xmtp can-message <address>

# 3. Create DM conversation
DM=$(xmtp conversations create-dm <address> --json)
DM_ID=$(echo "$DM" | jq -r '.id')

# 4. Send message
xmtp conversation send-text "$DM_ID" "Hello! This is my first message."

# 5. Stream for replies
xmtp conversation stream "$DM_ID" --timeout 300
```

## Tips

1. **Always check capabilities first**: Use `can-message` before creating conversations
2. **Use JSON output for parsing**: Add `--json` flag when you need to extract data
3. **Sync before reading**: Add `--sync` flag when reading messages to ensure fresh data
4. **Handle streaming gracefully**: Use `--timeout` and `--count` flags for bounded operations
5. **Specify environment**: Use `--env` flag explicitly when context requires specific network
6. **Dangerous operations require --force**: Commands like `add-account`, `remove-account`, `revoke-installations`, `revoke-all-other-installations`, and `change-recovery-identifier` prompt for confirmation unless `--force` is passed
7. **Check command help**: Run `xmtp <command> --help` for full flag documentation
