import type { Client } from "@xmtp/node-sdk";

export class ClientContext<ContentTypes = unknown> {
  #client: Client<ContentTypes>;

  constructor({ client }: { client: Client<ContentTypes> }) {
    this.#client = client;
  }

  getClientAddress() {
    return this.#client.accountIdentifier?.identifier;
  }

  get client() {
    return this.#client;
  }
}
