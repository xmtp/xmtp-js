/**
 * Wraps an async command handler to automatically exit the process on completion or error.
 * Commands no longer need to manually call process.exit().
 */
export function withAutoExit<T extends unknown[]>(
  handler: (...args: T) => Promise<void>,
): (...args: T) => Promise<void> {
  return async (...args: T) => {
    try {
      await handler(...args);
      process.exit(0);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`[ERROR] ${errorMessage}`);
      process.exit(1);
    }
  };
}
