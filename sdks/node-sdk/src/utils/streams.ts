import { isPromise } from "node:util/types";
import type { StreamCloser } from "@xmtp/node-bindings";
import { AsyncStream, createAsyncStreamProxy } from "@/AsyncStream";
import { StreamFailedError, StreamInvalidRetryAttemptsError } from "./errors";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const DEFAULT_RETRY_DELAY = 10000; // milliseconds
export const DEFAULT_RETRY_ATTEMPTS = 6;

export type StreamOptions<T = unknown, V = T> = {
  /**
   * Called when the stream ends
   */
  onEnd?: () => void;
  /**
   * Called when a stream error occurs
   */
  onError?: (error: Error) => void;
  /**
   * Called when the stream fails
   */
  onFail?: () => void;
  /**
   * Called when the stream is restarted
   */
  onRestart?: () => void;
  /**
   * Called when the stream is retried
   */
  onRetry?: (attempts: number, maxAttempts: number) => void;
  /**
   * Called when a value is emitted from the stream
   */
  onValue?: (value: V) => void;
  /**
   * The number of times to retry the stream
   * (default: 6)
   */
  retryAttempts?: number;
  /**
   * The delay between retries (in milliseconds)
   * (default: 10000)
   */
  retryDelay?: number;
  /**
   * Whether to retry the stream if it fails
   * (default: true)
   */
  retryOnFail?: boolean;
};

export type StreamCallback<T = unknown> = (
  error: Error | null,
  value: T | undefined,
) => void;

export type StreamFunction<T = unknown> = (
  callback: StreamCallback<T>,
  onFail: () => void,
) => Promise<StreamCloser>;

export type StreamValueMutator<T = unknown, V = T> = (
  value: T,
) => V | Promise<V>;

/**
 * Creates a stream from a stream function
 *
 * If the stream fails, an attempt will be made to restart it.
 *
 * This function is not intended to be used directly.
 *
 * @param streamFunction - The stream function to create a stream from
 * @param streamValueMutator - An optional function to mutate the value emitted from the stream
 * @param options - The options for the stream
 * @param args - Additional arguments to pass to the stream function
 * @returns An async iterable stream proxy
 * @throws {StreamInvalidRetryAttemptsError} if the retryAttempts option is less than 0 and retryOnFail is true
 * @throws {StreamFailedError} if the stream fails and can't be restarted
 */
export const createStream = async <T = unknown, V = T>(
  streamFunction: StreamFunction<T>,
  streamValueMutator?: StreamValueMutator<T, V>,
  options?: StreamOptions<T, V>,
) => {
  const {
    onError,
    onFail,
    onRestart,
    onRetry,
    onValue,
    retryAttempts = DEFAULT_RETRY_ATTEMPTS,
    retryDelay = DEFAULT_RETRY_DELAY,
    retryOnFail = true,
  } = options ?? {};
  // retry attempts must be greater than 0
  if (retryOnFail && retryAttempts < 0) {
    throw new StreamInvalidRetryAttemptsError();
  }

  const asyncStream = new AsyncStream<V>();
  const streamCallback: StreamCallback<T> = (error, value) => {
    // if a stream error occurs, call the onError callback
    if (error) {
      onError?.(error);
      return;
    }
    // ensure the value is not undefined
    if (value !== undefined) {
      try {
        // if a streamValueMutator is provided, mutate the value
        if (streamValueMutator) {
          const mutatedValue = streamValueMutator(value);
          if (isPromise(mutatedValue)) {
            void mutatedValue
              .then((mutatedValue) => {
                asyncStream.push(mutatedValue);
                onValue?.(mutatedValue);
              })
              .catch((error: unknown) => {
                onError?.(error as Error);
              });
          } else {
            asyncStream.push(mutatedValue);
            onValue?.(mutatedValue);
          }
        } else {
          asyncStream.push(value as unknown as V);
          onValue?.(value as unknown as V);
        }
      } catch (error) {
        onError?.(error as Error);
      }
    }
  };
  const retry = async (retries: number = retryAttempts) => {
    // if the stream has been retried the maximum number of times without
    // success, call onError
    if (retries === 0) {
      void asyncStream.end();
      onError?.(new StreamFailedError(retryAttempts));
      return;
    }

    // wait for the retry delay before attempting to restart the stream
    await wait(retryDelay);
    // call the onRetry callback
    onRetry?.(retryAttempts - retries + 1, retryAttempts);
    try {
      // attempt to restart the stream
      const streamCloser = await streamFunction(streamCallback, () => {
        // call the onFail callback
        onFail?.();
        void retry();
      });
      await streamCloser.waitForReady();
      // when the async stream is done, end the stream
      asyncStream.onDone = () => {
        streamCloser.end();
      };
      // stream restarted, call the onRestart callback
      onRestart?.();
    } catch (error) {
      onError?.(error as Error);
      // retry
      void retry(retries - 1);
    }
  };
  const startRetry = () => {
    // if the stream should be retried, start the process
    if (retryOnFail) {
      void retry();
    } else {
      void asyncStream.end();
      // stream failed and should not be retried, throw an error
      onError?.(new StreamFailedError(0));
    }
  };

  try {
    // create the stream
    const streamCloser = await streamFunction(streamCallback, () => {
      // call the onFail callback
      onFail?.();
      startRetry();
    });
    await streamCloser.waitForReady();
    // when the async stream is done, end the stream
    asyncStream.onDone = () => {
      streamCloser.end();
    };
  } catch (error) {
    onError?.(error as Error);
    startRetry();
  }

  // return a proxy for the async stream
  return createAsyncStreamProxy(asyncStream);
};
