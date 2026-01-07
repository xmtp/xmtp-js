import type { CodecRegistry } from "@/CodecRegistry";
import { Conversation } from "@/Conversation";
import type { ClientWorkerAction } from "@/types/actions";
import type { SafeConversation } from "@/utils/conversions";
import type { WorkerBridge } from "@/utils/WorkerBridge";

/**
 * Represents a direct message conversation between two inboxes
 *
 * This class is not intended to be initialized directly.
 */
export class Dm<ContentTypes = unknown> extends Conversation<ContentTypes> {
  #codecRegistry: CodecRegistry;
  #worker: WorkerBridge<ClientWorkerAction>;
  #id: string;

  /**
   * Creates a new direct message conversation instance
   *
   * @param worker - The worker bridge instance for client communication
   * @param codecRegistry - The codec registry instance
   * @param id - Identifier for the direct message conversation
   * @param data - Optional conversation data to initialize with
   */
  constructor(
    worker: WorkerBridge<ClientWorkerAction>,
    codecRegistry: CodecRegistry,
    id: string,
    data?: SafeConversation,
  ) {
    super(worker, codecRegistry, id, data);
    this.#worker = worker;
    this.#codecRegistry = codecRegistry;
    this.#id = id;
  }

  /**
   * Retrieves the inbox ID of the other participant in the DM
   *
   * @returns Promise that resolves with the peer's inbox ID
   */
  async peerInboxId() {
    return this.#worker.action("dm.peerInboxId", {
      id: this.#id,
    });
  }

  async duplicateDms() {
    const conversations = await this.#worker.action("dm.duplicateDms", {
      id: this.#id,
    });

    return conversations.map(
      (conversation) =>
        new Dm<ContentTypes>(
          this.#worker,
          this.#codecRegistry,
          conversation.id,
          conversation,
        ),
    );
  }
}
