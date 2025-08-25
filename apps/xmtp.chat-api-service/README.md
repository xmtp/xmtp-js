# xmtp.chat API service

This package contains code for the xmtp.chat API service.

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
