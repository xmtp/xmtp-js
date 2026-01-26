# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

XMTP-JS is a monorepo containing TypeScript SDKs and content types for XMTP messaging protocol. It includes browser and Node.js SDKs, various content types for different message formats, and example applications.

## Repository Structure

- `sdks/` - Client SDKs for different environments
  - `browser-sdk/` - XMTP client SDK for browsers (uses Web Workers)
  - `node-sdk/` - XMTP client SDK for Node.js
- `content-types/` - Message content type packages (text, reactions, attachments, etc.)
- `apps/` - Example applications
  - `xmtp.chat/` - React chat application demo
- `dev/` - Development environment setup (Docker compose)

## Development Commands

### Essential Commands

- `yarn` - Install dependencies
- `yarn build` - Build all packages using Turbo
- `yarn test` - Run all tests across workspaces
- `yarn lint` - Lint code (requires build first)
- `yarn typecheck` - TypeScript type checking
- `yarn format` - Format code with Prettier
- `yarn clean` - Remove all build artifacts and dependencies
- `yarn reset` - Full clean and rebuild

### Testing Setup

- `yarn test:setup` - Start local XMTP node via Docker (run once)
- `yarn test:teardown` - Stop local XMTP node

### Individual Package Commands

Navigate to specific package directories to run:

- `yarn test` - Run package tests (uses Vitest)
- `yarn build` - Build specific package
- `yarn dev` - Watch mode for development

## Architecture

### Core Components

- **Client**: Main entry point for XMTP operations, handles authentication and configuration
- **Conversations**: Manages DMs and group conversations
- **DecodedMessage**: Represents messages with content type handling
- **Content Types**: Extensible system for different message formats (text, reactions, attachments, etc.)

### SDK Differences

- **Browser SDK**: Uses Web Workers for performance, includes worker-specific classes (WorkerClient, WorkerConversation)
- **Node SDK**: Direct bindings, includes utility scripts for account/group generation

### Content Type System

Content types define how different message formats are encoded/decoded:

- Primitives package provides base interfaces
- Each content type (text, reaction, reply, etc.) is a separate package
- Custom content types can be registered with clients

## Technology Stack

- **Build System**: Turbo monorepo with Rollup bundling
- **Testing**: Vitest with coverage via V8
- **Linting**: ESLint 9 with TypeScript integration
- **Formatting**: Prettier with import sorting
- **Package Management**: Yarn 4 with workspaces
- **TypeScript**: v5.8+ with strict configuration

## Development Guidelines

### Code Style (from .cursor/rules)

- Use ES modules exclusively
- Favor named exports over default exports
- Use type inference where possible, avoid enums
- Prefer `unknown` over `any`
- Use early returns to reduce nesting
- Write comprehensive tests for new features
- Document with JSDoc comments

### Testing Requirements

- Unit tests must pass before PRs
- Some tests require local XMTP node (use `yarn test:setup`)
- Browser SDK tests run in browser environment via Vitest + Playwright
- Node SDK tests run in Node environment

### Publishing

- Uses Changesets for version management
- PRs require changeset for publishing
- Changesets bot guides through process
