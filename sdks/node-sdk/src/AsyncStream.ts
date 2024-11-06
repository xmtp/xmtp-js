type ResolveValue<T> = {
  value: T | undefined;
  done: boolean;
};

type ResolveNext<T> = (resolveValue: ResolveValue<T>) => void;

export type StreamCallback<T> = (
  err: Error | null,
  value: T | undefined,
) => void;

export class AsyncStream<T> {
  #done = false;
  #resolveNext: ResolveNext<T> | null;
  #queue: (T | undefined)[];

  onReturn: (() => void) | undefined = undefined;

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
      throw error;
    }

    if (this.#done) {
      return;
    }

    if (this.#resolveNext) {
      this.#resolveNext({
        done: false,
        value,
      });
      this.#resolveNext = null;
    } else {
      this.#queue.push(value);
    }
  };

  next = (): Promise<ResolveValue<T>> => {
    if (this.#queue.length > 0) {
      return Promise.resolve({
        done: false,
        value: this.#queue.shift(),
      });
    } else if (this.#done) {
      return Promise.resolve({
        done: true,
        value: undefined,
      });
    } else {
      return new Promise((resolve) => {
        this.#resolveNext = resolve;
      });
    }
  };

  return = (value: T | undefined) => {
    this.#done = true;
    this.onReturn?.();
    return Promise.resolve({
      done: true,
      value,
    });
  };

  [Symbol.asyncIterator]() {
    return this;
  }
}
