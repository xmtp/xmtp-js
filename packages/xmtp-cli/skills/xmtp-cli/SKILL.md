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
# generate keys and save to default path (~/.xmtp/.env)
xmtp init

# output keys to console instead of writing to a file
xmtp init --stdout

# generate keys for production env and save to custom path
xmtp init --env production --output ./my-project/.env

# overwrite existing config file
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

| Variable                 | Description                                           | Required                      |
| ------------------------ | ----------------------------------------------------- | ----------------------------- |
| `XMTP_WALLET_KEY`        | Ethereum private key (hex, with or without 0x prefix) | Yes\*                         |
| `XMTP_DB_ENCRYPTION_KEY` | 32-byte encryption key (hex)                          | Yes\*                         |
| `XMTP_ENV`               | Network: `local`, `dev`, or `production`              | No (default: dev)             |
| `XMTP_DB_PATH`           | Custom database file path                             | No (default: ~/.xmtp/xmtp-db) |
| `XMTP_GATEWAY_HOST`      | Custom gateway URL                                    | No                            |

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

Use `--verbose` to see detailed client initialization logs (env, db path, etc.). When combined with `--json`, verbose output goes to stderr so it doesn't interfere with JSON parsing:

```bash
xmtp client info --verbose
xmtp conversations list --json --verbose 2>/dev/null
```

## Common Workflows

### Check if an Address Can Receive Messages

```bash
# check if a single address can receive XMTP messages
xmtp can-message <address>
# check multiple addresses at once
xmtp can-message <address-1> <address-2>
# output result as JSON for scripting
xmtp can-message <address> --json
```

### Get Client Information

Shows client properties (address, inboxId, installationId, etc.) and client options (env, dbPath, etc.) in two sections. JSON output is nested as `{ properties, options }`.

```bash
# display client properties in human-readable format
xmtp client info
# output as JSON (nested as { properties, options })
xmtp client info --json
```

### Sign and Verify Messages

```bash
# sign a message with the installation key, output signature as hex
xmtp client sign "Hello, World!"
# sign a message, output signature as base64 instead of hex
xmtp client sign "verify me" --base64

# verify a hex-encoded signature against the original message
xmtp client verify-signature "Hello, World!" --signature <hex-signature>
# verify a base64-encoded signature against the original message
xmtp client verify-signature "verify me" --signature <base64-signature> --base64
```

### Send a Message

```bash
# create a DM conversation with a wallet address
xmtp conversations create-dm <address>

# send a text message to a conversation by its ID
xmtp conversation send-text <conversation-id> "Hello, world!"

# combined: create DM, extract the conversation ID via JSON, then send
DM_ID=$(xmtp conversations create-dm <address> --json | jq -r '.id')
xmtp conversation send-text "$DM_ID" "Hello!"
```

### Send Optimistic Messages

```bash
# queue message locally without publishing to the network
xmtp conversation send-text <conversation-id> "Quick message" --optimistic
# publish all queued optimistic messages for this conversation
xmtp conversation publish-messages <conversation-id>
```

### Send Other Message Types

```bash
# send a markdown-formatted message
xmtp conversation send-markdown <conversation-id> "**bold** and *italic*"

# send a plain text reply referencing another message by its ID
xmtp conversation send-reply <conversation-id> <message-id> "Replying to your message"
# send a markdown-formatted reply referencing another message
xmtp conversation send-reply <conversation-id> <message-id> "**Bold** reply" --markdown

# add a reaction to a message (action: add, content: emoji)
xmtp conversation send-reaction <conversation-id> <message-id> add "👍"
# remove a previously added reaction from a message
xmtp conversation send-reaction <conversation-id> <message-id> remove "👍"

# send a read receipt to mark conversation as read
xmtp conversation send-read-receipt <conversation-id>
```

### Create a Group

```bash
# create a group with multiple members and a name
xmtp conversations create-group <address-1> <address-2> --name "My Team"

# create a group with full metadata and admin-only permissions
xmtp conversations create-group <address> \
  --name "Project Team" \
  --description "Discussion for our project" \
  --image-url "https://example.com/team.png" \
  --permissions admin-only
```

### List Conversations

```bash
# list all conversations from local database
xmtp conversations list
# sync from network before listing to get latest data
xmtp conversations list --sync
# filter to only DMs (or use --type group for groups)
xmtp conversations list --type dm
# filter to only conversations with "allowed" consent state
xmtp conversations list --consent-state allowed
# filter by multiple consent states (repeatable flag)
xmtp conversations list --consent-state allowed --consent-state unknown
# sort by most recent activity and limit to 10 results
xmtp conversations list --order-by last-activity --limit 10
# filter by creation time (nanosecond timestamps)
xmtp conversations list --created-after 1700000000000000000
xmtp conversations list --created-before 1700000000000000000
```

### Read Messages

```bash
# list messages in a conversation (default: descending order)
xmtp conversation messages <conversation-id>
# limit to the 10 most recent messages
xmtp conversation messages <conversation-id> --limit 10
# sync from network before reading to get latest messages
xmtp conversation messages <conversation-id> --sync
# sort in ascending order (oldest first)
xmtp conversation messages <conversation-id> --direction ascending
```

### Filter Messages

```bash
# include only specific content types (repeatable flag)
xmtp conversation messages <conversation-id> --content-type text --content-type markdown
# exclude specific content types (repeatable flag)
xmtp conversation messages <conversation-id> --exclude-content-type reaction
# filter by delivery status: unpublished, published, or failed
xmtp conversation messages <conversation-id> --delivery-status published
# filter by message kind: application (user messages) or membership-change
xmtp conversation messages <conversation-id> --kind application
# filter by sent timestamp range (nanoseconds)
xmtp conversation messages <conversation-id> --sent-after 1700000000000000000
xmtp conversation messages <conversation-id> --sent-before 1700000000000000000
# filter by local insertion timestamp range (nanoseconds)
xmtp conversation messages <conversation-id> --inserted-after 1700000000000000000
xmtp conversation messages <conversation-id> --inserted-before 1700000000000000000
# exclude messages from a specific sender (repeatable flag)
xmtp conversation messages <conversation-id> --exclude-sender <inbox-id>
# sort by local insertion time instead of sent time
xmtp conversation messages <conversation-id> --sort-by inserted-at
```

Content types: `actions`, `attachment`, `custom`, `group-membership-change`, `group-updated`, `intent`, `leave-request`, `markdown`, `multi-remote-attachment`, `reaction`, `read-receipt`, `remote-attachment`, `reply`, `text`, `transaction-reference`, `wallet-send-calls`

### Look Up a DM

```bash
# look up a DM conversation by wallet address
xmtp conversations get-dm <address>
# look up a DM conversation by inbox ID
xmtp conversations get-dm <inbox-id>
```

### Stream in Real-Time

```bash
# stream messages from all conversations indefinitely
xmtp conversations stream-all-messages
# stop streaming after 60 seconds
xmtp conversations stream-all-messages --timeout 60
# stop after receiving 10 messages
xmtp conversations stream-all-messages --count 10
# only stream messages from group conversations (or use --type dm)
xmtp conversations stream-all-messages --type group
# only stream from conversations with "allowed" consent
xmtp conversations stream-all-messages --consent-state allowed
# skip the initial sync before streaming starts
xmtp conversations stream-all-messages --disable-sync

# stream messages from a single conversation
xmtp conversation stream <conversation-id>

# stream new conversations as they are created
xmtp conversations stream
# only stream new DM conversations
xmtp conversations stream --type dm
# only stream new group conversations
xmtp conversations stream --type group
# stop after 60 seconds or 5 new conversations, whichever comes first
xmtp conversations stream --timeout 60 --count 5
# skip the initial sync before streaming starts
xmtp conversations stream --disable-sync
```

### Manage Group Members

```bash
# list members of a conversation
xmtp conversation members <conversation-id>
# sync from network before listing to get latest membership
xmtp conversation members <conversation-id> --sync
# add members by their Ethereum addresses (space-separated)
xmtp conversation add-members <conversation-id> <address-1> <address-2>
# remove a member by their Ethereum address
xmtp conversation remove-members <conversation-id> <address>
```

### Update Group Permissions

```bash
# restrict adding members to admins only
xmtp conversation update-permission <conversation-id> --type add-member --policy admin
# restrict removing members to super-admins only
xmtp conversation update-permission <conversation-id> --type remove-member --policy super-admin

# restrict updating group name to admins (--metadata-field required for update-metadata type)
xmtp conversation update-permission <conversation-id> --type update-metadata --policy admin --metadata-field group-name
# restrict updating group description to admins
xmtp conversation update-permission <conversation-id> --type update-metadata --policy admin --metadata-field group-description
```

Permission types: `add-member`, `remove-member`, `add-admin`, `remove-admin`, `update-metadata`

Policies: `allow`, `deny`, `admin`, `super-admin`

Metadata fields: `group-name`, `group-description`, `group-image-url`, `app-data`

### Manage Consent (Spam Control)

```bash
# get the consent state of a conversation
xmtp conversation consent-state <conversation-id>
# allow messages from this conversation
xmtp conversation update-consent <conversation-id> --state allowed
# block messages from this conversation
xmtp conversation update-consent <conversation-id> --state denied

# get consent state for an inbox ID
xmtp preferences get-consent --entity-type inbox_id --entity <inbox-id>
# get consent state for a conversation ID
xmtp preferences get-consent --entity-type conversation_id --entity <conversation-id>
# block an inbox ID (deny all messages from this sender)
xmtp preferences set-consent --entity-type inbox_id --entity <inbox-id> --state denied
# allow a conversation ID
xmtp preferences set-consent --entity-type conversation_id --entity <conversation-id> --state allowed
```

Entity types use snake_case: `inbox_id`, `conversation_id`

### Leave a Group

```bash
# request to be removed from a group conversation
xmtp conversation request-removal <conversation-id>
```

### Sync Data from Network

```bash
# sync conversation list from the network
xmtp conversations sync
# sync all conversations and their messages (more thorough, slower)
xmtp conversations sync-all
# sync only conversations with "allowed" consent state
xmtp conversations sync-all --consent-state allowed
# sync a single conversation from the network
xmtp conversation sync <conversation-id>
# sync user preferences (consent states, HMAC keys) from the network
xmtp preferences sync
```

### Stream Preference Updates

```bash
# stream all preference changes (consent updates, HMAC key updates) indefinitely
xmtp preferences stream
# stop streaming after 60 seconds
xmtp preferences stream --timeout 60
# stop after receiving 5 preference update batches
xmtp preferences stream --count 5
# skip the initial preferences sync before streaming starts
xmtp preferences stream --disable-sync
```

### Inbox States

```bash
# get your own inbox state from local database
xmtp preferences inbox-state
# fetch the latest inbox state from the network before displaying
xmtp preferences inbox-state --sync

# fetch inbox states from the network for specific inbox IDs (no local client needed)
xmtp inbox-states <inbox-id-1> <inbox-id-2>

# get cached inbox states from local database for specific inbox IDs
xmtp preferences inbox-states <inbox-id-1> <inbox-id-2>
```

### HMAC Keys

```bash
# get HMAC keys for all conversations
xmtp conversations hmac-keys
```

### Manage Multiple Wallets

These operations require `--force` to skip confirmation:

```bash
# add a new wallet to this inbox (--force skips confirmation prompt)
xmtp client add-account --new-wallet-key <wallet-key> --force
# remove a wallet from this inbox
xmtp client remove-account --identifier <address> --force
# change the recovery wallet address for this inbox
xmtp client change-recovery-identifier --identifier <address> --force
# verify the current inbox state after changes
xmtp preferences inbox-state
```

### Authorization Checks

```bash
# check if a wallet address is authorized for an inbox (args: inbox-id, address)
xmtp address-authorized <inbox-id> <address>

# check if an installation is authorized for an inbox (args: inbox-id, installation-id)
xmtp installation-authorized <inbox-id> <installation-id>

# look up the inbox ID associated with a wallet address
xmtp client inbox-id --identifier <address>
```

### Conversation Details

```bash
# get detailed info about a conversation (type, metadata, members)
xmtp conversations get <conversation-id>

# get the permission policies for a group conversation
xmtp conversation permissions <conversation-id>

# get internal debug info for a conversation
xmtp conversation debug-info <conversation-id>

# fetch a specific message by its ID
xmtp conversations get-message <message-id>

# count messages in a conversation from local database
xmtp conversation count-messages <conversation-id>
# sync from network before counting to include latest messages
xmtp conversation count-messages <conversation-id> --sync
# count only application messages (exclude membership changes)
xmtp conversation count-messages <conversation-id> --kind application
# count only text and markdown messages
xmtp conversation count-messages <conversation-id> --content-type text --content-type markdown
# count messages sent after a timestamp (nanoseconds)
xmtp conversation count-messages <conversation-id> --sent-after 1700000000000000000
```

### Group Admin Operations

```bash
# promote a member to admin
xmtp conversation add-admin <conversation-id> <inbox-id>
# demote an admin to regular member
xmtp conversation remove-admin <conversation-id> <inbox-id>
# promote a member to super admin
xmtp conversation add-super-admin <conversation-id> <inbox-id>
# demote a super admin
xmtp conversation remove-super-admin <conversation-id> <inbox-id>
# list all admins in a group
xmtp conversation list-admins <conversation-id>
# list all super admins in a group
xmtp conversation list-super-admins <conversation-id>
```

### Update Group Metadata

```bash
# set the group name
xmtp conversation update-name <conversation-id> "New Name"
# set the group description
xmtp conversation update-description <conversation-id> "New description"
# set the group image URL
xmtp conversation update-image-url <conversation-id> "https://example.com/image.png"
```

### Security Operations

```bash
# list all installations for this client's inbox
xmtp preferences inbox-state --json | jq '.installations'
# revoke specific installations from this client's inbox (--force skips confirmation)
xmtp client revoke-installations --installation-ids <installation-id> --force
# revoke all installations except the current one
xmtp client revoke-all-other-installations --force
# check key package status for specific installations
xmtp client key-package-status --installation-ids <installation-id>

# revoke installations from any inbox without local database (requires wallet key)
xmtp revoke-installations <inbox-id> -i <installation-id>
# revoke multiple installations (repeated -i flag)
xmtp revoke-installations <inbox-id> -i <id-1> -i <id-2>
# revoke multiple installations (comma-separated)
xmtp revoke-installations <inbox-id> -i <id-1>,<id-2>
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
# 1. initialize with dev environment (first time only)
xmtp init --env dev

# 2. check if the recipient can receive XMTP messages
xmtp can-message <address>

# 3. create a DM conversation and extract the conversation ID
DM=$(xmtp conversations create-dm <address> --json)
DM_ID=$(echo "$DM" | jq -r '.id')

# 4. send a text message to the new DM
xmtp conversation send-text "$DM_ID" "Hello! This is my first message."

# 5. stream replies for up to 5 minutes
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
