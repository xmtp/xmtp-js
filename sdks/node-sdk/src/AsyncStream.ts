type ResolveValue<T> = {
  value: T | undefined;
  done: boolean;
};

type ResolveNext<T> = (resolveValue: ResolveValue<T>) => void;

type PendingPromise<T> = {
  resolve: ResolveNext<T>;
  reject: (error: Error) => void;
};

export type StreamCallback<T> = (
  err: Error | null,
  value: T | undefined,
) => void;

export class AsyncStream<T> {
  isDone = false;
  #pendingPromises: PendingPromise<T>[] = [];
  #queue: (T | undefined | Error)[];
  #error: Error | undefined;
  #onDone: (() => void) | undefined;
  #onReturn: (() => void) | undefined;
  #onError: ((error: Error) => void) | undefined;

  constructor() {
    this.#queue = [];
    this.isDone = false;
  }

  #flush(value?: T) {
    while (this.#pendingPromises.length > 0) {
      const nextPendingPromise = this.#pendingPromises.shift();
      if (nextPendingPromise) {
        nextPendingPromise.resolve({ done: true, value });
      }
    }
  }

  #done(value?: T) {
    this.#flush(value);
    this.#queue = [];
    this.#pendingPromises = [];
    this.isDone = true;
    this.#onDone?.();
    if (this.#error) {
      this.#onError?.(this.#error);
    }
  }

  get error() {
    return this.#error;
  }

  set onReturn(callback: () => void) {
    this.#onReturn = callback;
  }

  set onError(callback: (error: Error) => void) {
    this.#onError = callback;
  }

  set onDone(callback: () => void) {
    this.#onDone = callback;
  }

  callback: StreamCallback<T> = (error, value) => {
    if (this.isDone) {
      return;
    }

    const nextPendingPromise = this.#pendingPromises.shift();
    if (nextPendingPromise) {
      const { resolve, reject } = nextPendingPromise;
      if (error) {
        this.#error = error;
        reject(error);
        this.#done();
      } else {
        resolve({
          done: false,
          value,
        });
      }
    } else {
      this.#queue.push(error ?? value);
    }
  };

  next = (): Promise<ResolveValue<T>> => {
    if (this.isDone) {
      return Promise.resolve({
        done: true,
        value: undefined,
      });
    }

    if (this.#queue.length > 0) {
      const value = this.#queue.shift();
      if (value instanceof Error) {
        this.#error = value;
        this.#done();
        return Promise.reject(value);
      }
      return Promise.resolve({
        done: false,
        value,
      });
    }

    return new Promise((resolve, reject) => {
      this.#pendingPromises.push({ resolve, reject });
    });
  };

  return = (value?: T): Promise<ResolveValue<T>> => {
    this.#onReturn?.();
    this.#done(value);

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

interface AsyncStreamProxy<T> extends AsyncIterable<T> {
  next(): Promise<ResolveValue<T>>;
  end(): Promise<ResolveValue<T>>;
  return(value?: T): Promise<ResolveValue<T>>;
  isDone: boolean;
}

const usableProperties = [
  "end",
  "isDone",
  "next",
  "return",
  Symbol.asyncIterator,
];
const isUsableProperty = <T>(
  prop: string | symbol,
): prop is keyof AsyncStreamProxy<T> => {
  return usableProperties.includes(prop);
};

/**
 * Creates a proxy for AsyncStream instances that only exposes the next, end,
 * and return methods, the isDone property, and the async iterator.
 */
export function createAsyncStreamProxy<T>(stream: AsyncStream<T>) {
  return new Proxy(stream, {
    get(target, prop, receiver) {
      if (isUsableProperty(prop)) {
        return Reflect.get(target, prop, receiver);
      }
    },

    set() {
      return true;
    },

    has(_target, prop) {
      return isUsableProperty(prop);
    },

    ownKeys() {
      return usableProperties;
    },

    getOwnPropertyDescriptor(target, prop) {
      if (isUsableProperty(prop)) {
        return {
          enumerable: true,
          configurable: true,
          value: Reflect.get(target, prop),
        };
      }
      return undefined;
    },
  }) as AsyncStreamProxy<T>;
}
