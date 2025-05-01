type ResolveValue<T> = {
  value: T | undefined;
  done: boolean;
};

type ResolveNext<T> = (resolveValue: ResolveValue<T>) => void;

export type StreamCallback<T> = (
  err: Error | null,
  value: T | undefined,
) => void | Promise<void>;

export class AsyncStream<T> {
  #done = false;
  #resolveNext: ResolveNext<T> | null;
  #rejectNext: ((error: Error) => void) | null;
  #queue: (T | undefined)[];
  #error: Error | null;
  onReturn: (() => void) | undefined = undefined;
  onError: ((error: Error) => void) | undefined = undefined;

  constructor() {
    this.#queue = [];
    this.#resolveNext = null;
    this.#rejectNext = null;
    this.#error = null;
    this.#done = false;
  }

  #endStream() {
    this.#queue = [];
    this.#resolveNext = null;
    this.#rejectNext = null;
    this.#done = true;
  }

  get error() {
    return this.#error;
  }

  get isDone() {
    return this.#done;
  }

  callback: StreamCallback<T> = (error, value) => {
    if (error) {
      this.#error = error;
      if (this.#rejectNext) {
        this.#rejectNext(error);
        this.#endStream();
        this.onError?.(error);
      }
      return;
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
    if (this.#error) {
      this.#endStream();
      this.onError?.(this.#error);
      return Promise.reject(this.#error);
    }

    if (this.#queue.length > 0) {
      return Promise.resolve({
        done: false,
        value: this.#queue.shift(),
      });
    }

    if (this.#done) {
      return Promise.resolve({
        done: true,
        value: undefined,
      });
    }

    return new Promise((resolve, reject) => {
      this.#resolveNext = resolve;
      this.#rejectNext = reject;
    });
  };

  return = (value?: T) => {
    this.#endStream();
    this.onReturn?.();
    return Promise.resolve({
      done: true,
      value,
    });
  };

  end = () => this.return();

  [Symbol.asyncIterator]() {
    return this;
  }
}
