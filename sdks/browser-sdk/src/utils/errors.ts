import type { ContentTypeId } from "@xmtp/content-type-primitives";
import { SignatureRequestType } from "@xmtp/wasm-bindings";

export class ClientNotInitializedError extends Error {
  constructor() {
    super("Client not initialized");
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

export class GenerateSignatureError extends Error {
  constructor(signatureType: SignatureRequestType) {
    let type = "";

    switch (signatureType) {
      case SignatureRequestType.AddWallet:
        type = "add account";
        break;
      case SignatureRequestType.CreateInbox:
        type = "create inbox";
        break;
      case SignatureRequestType.RevokeWallet:
        type = "remove account";
        break;
      case SignatureRequestType.RevokeInstallations:
        type = "revoke installations";
        break;
      case SignatureRequestType.ChangeRecoveryIdentifier:
        type = "change recovery identifier";
        break;
    }

    super(`Failed to generate ${type} signature text`);
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
