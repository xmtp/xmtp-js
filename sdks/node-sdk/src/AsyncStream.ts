type ResolveValue<T> = {
  value: T | undefined;
  done: boolean;
  error: Error | null;
};

type ResolveNext<T> = (resolveValue: ResolveValue<T>) => void;

export type StreamCallback<T> = (err: Error | null, value: T) => void;

export class AsyncStream<T> {
  #done = false;
  #resolveNext: ResolveNext<T> | null;
  #queue: T[];

  stopCallback: (() => void) | undefined = undefined;

  constructor() {
    this.#queue = [];
    this.#resolveNext = null;
    this.#done = false;
  }

  get isDone() {
    return this.#done;
  }

  callback: StreamCallback<T> = (error, value) => {
    if (error) {
      console.error("stream error", error);
      this.stop(error);
      return;
    }

    if (this.#done) {
      return;
    }

    if (this.#resolveNext) {
      this.#resolveNext({
        done: false,
        error: null,
        value,
      });
      this.#resolveNext = null;
    } else {
      this.#queue.push(value);
    }
  };

  stop = (error?: Error) => {
    this.#done = true;
    if (this.#resolveNext) {
      this.#resolveNext({
        done: true,
        error: error ?? null,
        value: undefined,
      });
    }
    this.stopCallback?.();
  };

  next = (): Promise<ResolveValue<T>> => {
    if (this.#queue.length > 0) {
      return Promise.resolve({
        done: false,
        error: null,
        value: this.#queue.shift(),
      });
    } else if (this.#done) {
      return Promise.resolve({
        done: true,
        error: null,
        value: undefined,
      });
    } else {
      return new Promise((resolve) => {
        this.#resolveNext = resolve;
      });
    }
  };

  [Symbol.asyncIterator]() {
    return this;
  }
}
