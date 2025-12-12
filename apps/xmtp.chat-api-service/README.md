# xmtp.chat API service

This package contains code for the xmtp.chat API service, a server-side intermediary between the xmtp.chat frontend and external services (web3.bio, Pinata, etc.).

## Featues

The xmtp.chat API service is a backend service that provides the following:

- **Name Resolution**: Resolves ENS and Base names to Ethereum addresses and profile information using [web3.bio](https://web3.bio/)
- **Profile Caching**: Caches resolved profiles in a PostgreSQL database to reduce external API calls
- **File Storage**: Integrates with [Pinata](https://pinata.cloud/) for IPFS file uploads and management
- **Rate Limiting**: Protects endpoints from abuse with configurable rate limits
- **CORS Support**: Handles cross-origin requests from the xmtp.chat frontend

### Get started

#### Setup environment

Copy `.env.example` to `.env` and fill in the proper values.

#### Run the app locally

```bash
# Run the app in watch mode
yarn dev
```

#### Run the app locally with Docker

```bash
# Build the Docker image
docker build -t "xmtp-chat-api-service" .

# Run the Docker container
docker run --env-file .env -d -p 4000:4000 xmtp-chat-api-service
```

Adjust the `-p 4000:4000` flag to match the port in the `.env` file. The default port is `4000`.
