type ResolveValue<T> = {
  value: T;
  done: boolean;
};

type ResolveNext<T> = (resolveValue: ResolveValue<T>) => void;

/**
 * AsyncStream provides an async iterable interface for streaming data.
 *
 * This class implements a producer-consumer pattern where:
 * - Producers can push values using the `push()` method
 * - Consumers can iterate over values asynchronously using `for await` loops or `next()`
 * - Values are queued internally when no consumers are waiting
 * - Consumers are resolved immediately when values are available
 * - The stream can be terminated using `done()`, `return()`, or `end()`
 *
 * @example
 * ```typescript
 * const stream = new AsyncStream<string>();
 *
 * stream.push("hello");
 * stream.push("world");
 *
 * for await (const value of stream) {
 *   console.log(value); // "hello", "world"
 * }
 * ```
 */
export class AsyncStream<T> {
  isDone = false;
  #pendingResolves: ResolveNext<T | undefined>[] = [];
  #queue: T[];
  onDone: (() => void) | undefined;
  onReturn: (() => void) | undefined;

  constructor() {
    this.#queue = [];
    this.isDone = false;
  }

  flush() {
    while (this.#pendingResolves.length > 0) {
      const nextResolve = this.#pendingResolves.shift();
      if (nextResolve) {
        nextResolve({ done: true, value: undefined });
      }
    }
  }

  done() {
    this.flush();
    this.#queue = [];
    this.#pendingResolves = [];
    this.isDone = true;
    this.onDone?.();
  }

  push = (value: T) => {
    if (this.isDone) {
      return;
    }

    const nextResolve = this.#pendingResolves.shift();
    if (nextResolve) {
      nextResolve({
        done: false,
        value,
      });
    } else {
      this.#queue.push(value);
    }
  };

  next = (): Promise<ResolveValue<T | undefined>> => {
    if (this.isDone) {
      return Promise.resolve({ done: true, value: undefined });
    }

    if (this.#queue.length > 0) {
      return Promise.resolve({
        done: false,
        value: this.#queue.shift(),
      });
    }

    return new Promise((resolve) => {
      this.#pendingResolves.push(resolve);
    });
  };

  return = (): Promise<ResolveValue<T | undefined>> => {
    this.onReturn?.();
    this.done();

    return Promise.resolve({
      done: true,
      value: undefined,
    });
  };

  end = () => this.return();

  [Symbol.asyncIterator]() {
    return this;
  }
}

export interface AsyncStreamProxy<T> extends AsyncIterable<T> {
  next(): Promise<ResolveValue<T>>;
  return(): Promise<ResolveValue<undefined>>;
  end(): Promise<ResolveValue<undefined>>;
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
 * Creates a read-only proxy for AsyncStream instances that restricts access to consumer-only methods.
 *
 * This proxy only exposes the following properties and methods:
 * - `next()`: Get the next value from the stream
 * - `end()`: Terminate the stream and stop iteration
 * - `return()`: Same as end(), terminates the stream
 * - `isDone`: Boolean indicating if the stream has been terminated
 * - `Symbol.asyncIterator`: Enables `for await` loop iteration
 *
 * Producer methods like `push()`, `done()`, and `flush()` are hidden to prevent
 * consumers from accidentally modifying the stream state.
 *
 * @param stream - The AsyncStream instance to create a proxy for
 * @returns A read-only proxy that implements AsyncStreamProxy<T>
 *
 * @example
 * ```typescript
 * const stream = new AsyncStream<string>();
 * const proxy = createAsyncStreamProxy(stream);
 *
 * stream.push("hello");
 * stream.push("world");
 *
 * for await (const value of proxy) {
 *   console.log(value); // "hello", "world"
 * }
 * ```
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
