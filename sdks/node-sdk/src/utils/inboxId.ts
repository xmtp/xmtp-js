import {
  generateInboxId as generateInboxIdBinding,
  getInboxIdByIdentity,
  type Backend,
  type Identifier,
} from "@xmtp/node-bindings";

export const generateInboxId = (
  identifier: Identifier,
  nonce?: bigint,
): string => {
  return generateInboxIdBinding(identifier, nonce);
};

export const getInboxIdForIdentifier = async (
  backend: Backend,
  identifier: Identifier,
) => {
  return getInboxIdByIdentity(backend, identifier);
};
