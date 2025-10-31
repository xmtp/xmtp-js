
## Available commands

```bash
# Groups

## Create a DM (default behavior)
yarn groups

## Create a DM with custom name
yarn groups --name "My DM"

## Create a group with multiple members
yarn groups --members 5 --name "My Group"

## Use repeat tasks for multiple DMs
yarn groups --repeat 3
yarn groups create

## Create group by inbox ID
yarn groups create --name "My Group" --members 5

## Create group by Ethereum addresses
yarn groups create-by-address --name "Address Group" --member-addresses "0x123...,0x456..."

## Create group with random addresses from inboxes.json
yarn groups create-by-address --name "Random Group" --members 5

## Update group metadata
yarn groups metadata --group-id <group-id> --name "New Name" --description "New description"

## Get group messages
yarn groups get-messages --group-id <group-id>

## Get group members
yarn groups get-members --group-id <group-id>

## List group members and permissions
yarn permissions list --group-id <group-id>

## Get detailed group information
yarn permissions info --group-id <group-id>


# Update group permissions

yarn permissions update-permissions --group-id <group-id> --features add-member,remove-member --permissions admin-only

## Send single message to target
yarn send --target 0x1234... --message "Hello!"

## Send multiple messages for testing
yarn send --target 0x1234... --users 10

## Send message to group
yarn send --group-id abc123... --message "Hello group!" --sender 0x1234...

## Performance testing with multiple attempts
yarn send --target 0x1234... --users 500 --attempts 10

## Wait for responses
yarn send --target 0x1234... --users 100 --wait

## Custom message with repeat execution
yarn send --target 0x1234... --custom-message "Test message" --repeat 3 --delay 1000

## Advanced testing with error handling
yarn send --target 0x1234... --users 1 --repeat 5 --continue-on-error --verbose


# List Operations

## List all conversations
yarn list conversations

## List conversations with pagination
yarn list conversations --limit 20

## List conversations with custom offset
yarn list conversations --limit 10 --offset 20

## List members from a conversation
yarn list members --conversation-id <conversation-id>

## List messages from a conversation
yarn list messages --conversation-id <conversation-id>

## List messages with pagination
yarn list messages --conversation-id <conversation-id> --limit 10

## List messages with custom offset
yarn list messages --conversation-id <conversation-id> --limit 10 --offset 5

## Find conversation by inbox ID and get messages
yarn list find --inbox-id <inbox-id>
yarn list find --inbox-id <inbox-id> --limit 5

## Find conversation by address and get messages
yarn list find --address <ethereum-address>
yarn list find --address <ethereum-address> --limit 5


# Debug & Information

## Get general system information
yarn debug info

## Get address information
yarn debug address --address 0xe089d4e01a5cd0af7c119abce22b7828851cd387
yarn debug address --inbox-id 743f3805fa9daaf879103bc26a2e79bb53db688088259c23cf18dcf1ea2aee64

## Resolve address to inbox ID (or inbox ID to address)
yarn debug resolve --address 0xe089d4e01a5cd0af7c119abce22b7828851cd387
yarn debug resolve --inbox-id 743f3805fa9daaf879103bc26a2e79bb53db688088259c23cf18dcf1ea2aee64

## Get inbox information
yarn debug inbox --inbox-id 743f3805fa9daaf879103bc26a2e79bb53db688088259c23cf18dcf1ea2aee64
yarn debug inbox --address 0xe089d4e01a5cd0af7c119abce22b7828851cd387

## Check key package status
yarn debug key-package --inbox-id 743f3805fa9daaf879103bc26a2e79bb53db688088259c23cf18dcf1ea2aee64
yarn debug key-package --address 0xe089d4e01a5cd0af7c119abce22b7828851cd387

## Get installation information for an inbox
yarn debug installations --inbox-id 743f3805fa9daaf879103bc26a2e79bb53db688088259c23cf18dcf1ea2aee64
yarn debug installations --address 0xe089d4e01a5cd0af7c119abce22b7828851cd387


# Content Types

## Send text message with reply and reaction
yarn content text --target 0x1234...

## Send markdown formatted message
yarn content markdown --target 0x1234...

## Send remote attachment
yarn content attachment --target 0x1234...

## Send transaction frame (USDC)
yarn content transaction --target 0x1234... --amount 0.5

## Send deeplink to create conversation
yarn content deeplink --target 0x1234...

## Send mini app URL
yarn content miniapp --target 0x1234...

## Send content to a group
yarn content text --group-id <group-id>
yarn content markdown --group-id <group-id>

## Test content types with repeat
yarn content text --target 0x1234... --repeat 3 --delay 1000
```
