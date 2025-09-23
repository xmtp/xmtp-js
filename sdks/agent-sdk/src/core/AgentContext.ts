import type { Agent } from "./Agent.js";

export class AgentContext<ContentTypes = unknown> {
  #agent: Agent<ContentTypes>;

  constructor({ agent }: { agent: Agent<ContentTypes> }) {
    this.#agent = agent;
  }

  get agent() {
    return this.#agent;
  }
}
