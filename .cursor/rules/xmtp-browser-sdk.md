# XMTP Browser SDK Rules

## File Patterns

- \*_/_.ts
- \*_/_.tsx

## Authentication Guidelines

### Client Initialization

- Always initialize XMTP client through the `Client.create` static method with appropriate signer
- Use `createEOASigner` for wallet-based authentication or `createEphemeralSigner` for ephemeral sessions
- Add proper error handling around client initialization
- Store authentication state appropriately in local storage with encryption when needed
- Check if user is registered with `client.isRegistered()` before proceeding with operations

```typescript
// Example client initialization pattern
const client = await Client.create(signer, {
  env: environment, // Important: 'dev', 'production', or custom environment
  dbEncryptionKey: encryptionKey ? hexToUint8Array(encryptionKey) : undefined,
  loggingLevel: loggingLevel, // 'error', 'warn', 'info', 'debug', 'trace', or 'off'
  codecs: [...requiredCodecs],
});
```

### Signers

- Always create appropriate signers based on the authentication method:
  - Use `createEOASigner` for standard wallet connections (MetaMask, WalletConnect, etc.)
  - Use `createEphemeralSigner` for temporary sessions or testing
- Signers must implement the `Signer` interface with proper `getIdentifier` and `signMessage` methods
- For wallet authentication, ensure wallet is properly connected before creating the signer

### Client Management

- Properly disconnect clients when no longer needed with `client.close()`
- Handle reconnection scenarios appropriately
- Implement proper loading states during client initialization and connection
- Store necessary authentication parameters securely in localStorage with encryption

## Synchronization Guidelines

### Conversation Synchronization

- Always call `sync()` or `syncAll()` on conversations to ensure up-to-date data
- Implement streaming pattern for real-time updates using `conversation.stream()` and `client.conversations.stream()`
- Properly manage stream lifecycles (start/stop) based on component lifecycles
- Use cleanup functions to close streams when components unmount

```typescript
// Example conversation streaming pattern
useEffect(() => {
  const startStream = async () => {
    const onMessage = (
      error: Error | null,
      message: DecodedMessage | undefined,
    ) => {
      if (message) {
        setMessages((prev) => [...prev, message]);
      }
    };
    stopStreamRef.current = await conversation.stream(onMessage);
  };

  void startStream();

  return () => {
    stopStreamRef.current?.();
  };
}, [conversation.id]);
```

### Message Synchronization

- Use `conversation.messages()` with appropriate options to fetch messages
- Call `conversation.sync()` before fetching messages to ensure latest data
- Implement proper loading states during synchronization
- Use streaming for real-time message updates

### Network Status Handling

- Implement proper error handling for network-related errors during synchronization
- Handle reconnection scenarios after network disruptions
- Provide feedback to users during synchronization processes

## Local Storage Guidelines

### Database Encryption

- Always use `dbEncryptionKey` with client initialization to encrypt local database
- Generate and securely store encryption keys
- Use `hexToUint8Array` to convert hex encryption keys for use with the client

```typescript
// Example with database encryption
client = await Client.create(signer, {
  env: environment,
  dbEncryptionKey: encryptionKey ? hexToUint8Array(encryptionKey) : undefined,
  // Important configuration properties:
  // - dbPath: Optional custom path for the database (defaults to `xmtp-${env}-${inboxId}.db3`)
  // - apiUrl: Optional custom API endpoint (overrides env setting)
  // - historySyncUrl: Optional custom history sync endpoint
});
```

### Settings Persistence

- Use local storage hooks for storing user settings
- Store sensitive information securely (encryption keys, authentication tokens)
- Follow a consistent pattern for localStorage keys
- Prefer namespaced keys for XMTP-related settings

```typescript
// Example settings pattern with important properties
const [environment, setEnvironment] = useLocalStorage({
  key: "XMTP_NETWORK",
  defaultValue: "dev", // Important: Consider your default environment
});

const [encryptionKey, setEncryptionKey] = useLocalStorage({
  key: "XMTP_ENCRYPTION_KEY",
  defaultValue: "", // Critical security consideration
});

const [loggingLevel, setLoggingLevel] = useLocalStorage({
  key: "XMTP_LOGGING_LEVEL",
  defaultValue: "off", // Important for production vs development
});
```

### Client Options

- Store user preferences for network environment, logging levels, etc.
- Allow users to configure essential options like network environment (dev/production)
- Implement UI components to manage these settings when appropriate
- Restore previous settings when re-initializing the client

## Content Types

- Register all required content codecs during client initialization
- Import content type codecs from their respective packages
- Ensure backward compatibility with text messages
- Important built-in codecs include:
  - TextCodec (required for basic text messages)
  - ReactionCodec (for message reactions)
  - ReplyCodec (for threaded replies)
  - RemoteAttachmentCodec (for file attachments)

## Error Handling

- Implement proper error boundaries around XMTP client operations
- Handle specific error types appropriately (auth failures, network issues, etc.)
- Provide user-friendly error messages
- Log errors appropriately based on environment

## Performance

- Implement efficient syncing strategies (sync only when needed)
- Use pagination for message retrieval when appropriate
- Properly close streams when components unmount to prevent memory leaks
- Consider UI blocking during intensive operations
