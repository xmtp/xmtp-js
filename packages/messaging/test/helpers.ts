export const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export async function waitFor<T>(
  callback: () => Promise<T>,
  timeoutMs: number,
  delayMs: number
): Promise<T> {
  const started = Date.now();
  try {
    return await callback();
  } catch (err) {
    if (delayMs) {
      await sleep(delayMs);
    }
    const elapsedMs = Date.now() - started;
    const remainingTimeoutMs = timeoutMs - elapsedMs;
    if (remainingTimeoutMs <= 0) {
      throw new Error('timeout exceeded');
    }
    return await waitFor(callback, remainingTimeoutMs, delayMs);
  }
}
