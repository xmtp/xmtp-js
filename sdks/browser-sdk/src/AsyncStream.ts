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
  #isDone = false;
  #resolveNext: ResolveNext<T> | undefined;
  #rejectNext: ((error: Error) => void) | undefined;
  #queue: (T | undefined)[];
  #error: Error | undefined;
  onReturn: (() => void) | undefined;
  onError: ((error: Error) => void) | undefined;

  constructor() {
    this.#queue = [];
    this.#isDone = false;
  }

  #done() {
    this.#queue = [];
    this.#resolveNext = undefined;
    this.#rejectNext = undefined;
    this.#isDone = true;
  }

  get error() {
    return this.#error;
  }

  get isDone() {
    return this.#isDone;
  }

  callback: StreamCallback<T> = (error, value) => {
    if (this.#isDone) {
      return;
    }

    if (error) {
      this.#error = error;
      if (this.#rejectNext) {
        this.#rejectNext(error);
        this.#done();
        this.onError?.(error);
      }
      return;
    }

    if (this.#resolveNext) {
      this.#resolveNext({
        done: false,
        value,
      });
      this.#resolveNext = undefined;
      this.#rejectNext = undefined;
    } else {
      this.#queue.push(value);
    }
  };

  next = (): Promise<ResolveValue<T>> => {
    if (this.#error) {
      this.#done();
      this.onError?.(this.#error);
      return Promise.reject(this.#error);
    }

    if (this.#queue.length > 0) {
      return Promise.resolve({
        done: false,
        value: this.#queue.shift(),
      });
    }

    return new Promise((resolve, reject) => {
      this.#resolveNext = resolve;
      this.#rejectNext = reject;
    });
  };

  return = (value?: T) => {
    this.#resolveNext?.({
      done: true,
      value,
    });
    this.onReturn?.();
    this.#done();
    return {
      done: true,
      value,
    };
  };

  end = () => this.return();

  [Symbol.asyncIterator]() {
    return this;
  }
}
