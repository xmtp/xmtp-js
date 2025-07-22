type ResolveValue<T> = {
  value: T | undefined;
  done: boolean;
};

type ResolveNext<T> = (resolveValue: ResolveValue<T>) => void;

export class AsyncStream<T> {
  isDone = false;
  #pendingResolves: ResolveNext<T>[] = [];
  #queue: T[];
  onDone: (() => void) | undefined;
  onReturn: (() => void) | undefined;

  constructor() {
    this.#queue = [];
    this.isDone = false;
  }

  flush(value?: T) {
    while (this.#pendingResolves.length > 0) {
      const nextResolve = this.#pendingResolves.shift();
      if (nextResolve) {
        nextResolve({ done: true, value });
      }
    }
  }

  done(value?: T) {
    this.flush(value);
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

  next = (): Promise<ResolveValue<T>> => {
    if (this.isDone) {
      return Promise.resolve({
        done: true,
        value: undefined,
      });
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

  return = (value?: T): Promise<ResolveValue<T>> => {
    this.onReturn?.();
    this.done(value);

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
