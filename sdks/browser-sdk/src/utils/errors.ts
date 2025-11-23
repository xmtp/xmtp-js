import type { ContentTypeId } from "@xmtp/content-type-primitives";

export class ClientNotInitializedError extends Error {
  constructor() {
    super(
      "Client not initialized, use Client.create or Client.build to create a client",
    );
  }
}

export class SignerUnavailableError extends Error {
  constructor() {
    super(
      "Signer unavailable, use Client.create to create a client with a signer",
    );
  }
}

export class CodecNotFoundError extends Error {
  constructor(contentType: ContentTypeId) {
    super(`Codec not found for "${contentType.toString()}" content type`);
  }
}

export class InboxReassignError extends Error {
  constructor() {
    super(
      "Unable to create add account signature text, `allowInboxReassign` must be true",
    );
  }
}

export class AccountAlreadyAssociatedError extends Error {
  constructor(inboxId: string) {
    super(`Account already associated with inbox ${inboxId}`);
  }
}

export class GroupNotFoundError extends Error {
  constructor(groupId: string) {
    super(`Group "${groupId}" not found`);
  }
}

export class StreamNotFoundError extends Error {
  constructor(streamId: string) {
    super(`Stream "${streamId}" not found`);
  }
}

export class InvalidGroupMembershipChangeError extends Error {
  constructor(messageId: string) {
    super(`Invalid group membership change for message ${messageId}`);
  }
}

export class MissingContentTypeError extends Error {
  constructor() {
    super("Content type is required when sending content other than text");
  }
}

export class StreamFailedError extends Error {
  constructor(retryAttempts: number) {
    const times = `time${retryAttempts !== 1 ? "s" : ""}`;
    super(`Stream failed, retried ${retryAttempts} ${times}`);
  }
}

export class StreamInvalidRetryAttemptsError extends Error {
  constructor() {
    super("Stream retry attempts must be greater than 0");
  }
}
