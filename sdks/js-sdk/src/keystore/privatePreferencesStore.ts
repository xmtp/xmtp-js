import { keystore, type privatePreferences } from "@xmtp/proto";
import { Mutex } from "async-mutex";
import { numberToUint8Array, uint8ArrayToNumber } from "@/utils/bytes";
import { fromNanoString } from "@/utils/date";
import type { Persistence } from "./persistence/interface";

const PRIVATE_PREFERENCES_ACTIONS_STORAGE_KEY = "private-preferences/actions";

export type ActionsMap = Map<
  string,
  privatePreferences.PrivatePreferencesAction
>;

/**
 * PrivatePreferencesStore holds a mapping of message timestamp -> private
 * preference action and writes to the persistence layer on changes
 */
export class PrivatePreferencesStore {
  #persistence: Persistence;
  #persistenceKey: string;
  #mutex: Mutex;
  #revision: number;
  actionsMap: ActionsMap;

  constructor(
    persistence: Persistence,
    persistenceKey: string,
    initialData: ActionsMap = new Map(),
  ) {
    this.#persistenceKey = persistenceKey;
    this.#persistence = persistence;
    this.#revision = 0;
    this.#mutex = new Mutex();
    this.actionsMap = initialData;
  }

  get revisionKey(): string {
    return this.#persistenceKey + "/revision";
  }

  static async create(
    persistence: Persistence,
  ): Promise<PrivatePreferencesStore> {
    const store = new PrivatePreferencesStore(
      persistence,
      PRIVATE_PREFERENCES_ACTIONS_STORAGE_KEY,
    );
    await store.refresh();
    return store;
  }

  async refresh() {
    const currentRevision = await this.getRevision();
    if (currentRevision > this.#revision) {
      this.actionsMap = await this.loadFromPersistence();
    }
    this.#revision = currentRevision;
  }

  async getRevision(): Promise<number> {
    const data = await this.#persistence.getItem(this.revisionKey);
    if (!data) {
      return 0;
    }
    return uint8ArrayToNumber(data);
  }

  async setRevision(number: number) {
    await this.#persistence.setItem(
      this.revisionKey,
      numberToUint8Array(number),
    );
  }

  async loadFromPersistence(): Promise<ActionsMap> {
    const rawData = await this.#persistence.getItem(this.#persistenceKey);
    if (!rawData) {
      return new Map();
    }
    const data = keystore.PrivatePreferencesActionMap.decode(rawData);
    const actionsMap: ActionsMap = new Map();
    const entries = Object.entries(data.actions);
    for (let i = 0; i < entries.length; i++) {
      actionsMap.set(entries[i][0], entries[i][1]);
    }
    return actionsMap;
  }

  async store() {
    await this.#persistence.setItem(this.#persistenceKey, this.#toBytes());
    this.#revision++;
    await this.setRevision(this.#revision);
  }

  async add(actionsMap: ActionsMap): Promise<void> {
    await this.#mutex.runExclusive(async () => {
      await this.refresh();
      let isDirty = false;
      const keys = Array.from(actionsMap.keys());
      for (let i = 0; i < keys.length; i++) {
        // ignore duplicate actions
        if (!this.actionsMap.has(keys[i])) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.actionsMap.set(keys[i], actionsMap.get(keys[i])!);
          // indicate new value added
          isDirty = true;
        }
      }
      // only write to persistence if new values were added
      if (isDirty) {
        await this.store();
      }
    });
  }

  get actions(): ActionsMap {
    // sort actions by their keys (timestamps) in ascending order
    const sortedActions = new Map(
      [...this.actionsMap.entries()].sort(
        (a, b) =>
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          fromNanoString(a[0])!.getTime() - fromNanoString(b[0])!.getTime(),
      ),
    );
    return sortedActions;
  }

  lookup(key: string): privatePreferences.PrivatePreferencesAction | undefined {
    return this.actionsMap.get(key);
  }

  #toBytes(): Uint8Array {
    return keystore.PrivatePreferencesActionMap.encode({
      actions: Object.fromEntries(this.actionsMap),
    }).finish();
  }
}
