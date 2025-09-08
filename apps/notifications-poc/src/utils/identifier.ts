import { IdentifierKind, type Identifier } from "@xmtp/node-sdk";

export function addressToIdentifier(address: string): Identifier {
  return {
    identifier: address,
    identifierKind: IdentifierKind.Ethereum,
  };
}
