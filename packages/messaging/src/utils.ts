export const buildContentTopic = (name: string) => `/xmtp/0/${name}/proto`;

export const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const promiseWithTimeout = <T>(
  timeoutMs: number,
  promise: () => Promise<T>,
  failureMessage?: string
) => {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutHandle = setTimeout(
      () => reject(new Error(failureMessage)),
      timeoutMs
    );
  });

  return Promise.race([promise(), timeoutPromise]).then(result => {
    clearTimeout(timeoutHandle);
    return result;
  });
};
