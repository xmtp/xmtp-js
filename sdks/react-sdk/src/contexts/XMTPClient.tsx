import { Client, type ClientOptions, type Signer } from "@xmtp/browser-sdk";
import { createContext, useCallback, useMemo, useRef, useState } from "react";

export type InitializeClient = (
  signer: Signer,
  options?: ClientOptions,
) => Promise<Client>;

export type XMTPClientContextValue =
  | undefined
  | {
      client?: Client;
      setClient: React.Dispatch<React.SetStateAction<Client | undefined>>;
      initialize: InitializeClient;
      initializing: boolean;
      setInitializing: React.Dispatch<React.SetStateAction<boolean>>;
      error: Error | null;
      setError: React.Dispatch<React.SetStateAction<Error | null>>;
      disconnect: () => void;
    };

export const XMTPClientContext =
  createContext<XMTPClientContextValue>(undefined);

export const XMTPClientProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const clientPromiseRef = useRef<Promise<Client> | undefined>(undefined);

  /**
   * Initialize an XMTP client
   */
  const initialize = useCallback<InitializeClient>(
    async (signer, options) => {
      // initialize a client if it doesn't already exist
      if (!client) {
        // if the client is already initializing, return the client init promise
        if (clientPromiseRef.current) {
          return clientPromiseRef.current;
        }

        // start initializing the client
        clientPromiseRef.current = Client.create(signer, options);

        // reset initializing and error state
        setInitializing(true);
        setError(null);

        let xmtpClient: Client;

        try {
          // wait for the client to be initialized
          xmtpClient = await clientPromiseRef.current;
          setClient(xmtpClient);
        } catch (e) {
          setClient(undefined);
          setError(e as Error);
          // re-throw error for upstream consumption
          throw e;
        } finally {
          clientPromiseRef.current = undefined;
          setInitializing(false);
        }

        return xmtpClient;
      }

      // return the existing client
      return client;
    },
    [client],
  );

  const disconnect = useCallback(() => {
    if (client) {
      client.close();
      setClient(undefined);
    }
  }, [client, setClient]);

  // memo-ize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      client,
      setClient,
      initialize,
      initializing,
      setInitializing,
      setError,
      error,
      disconnect,
    }),
    [
      client,
      initialize,
      initializing,
      error,
      disconnect,
      setInitializing,
      setError,
    ],
  );

  return (
    <XMTPClientContext.Provider value={value}>
      {children}
    </XMTPClientContext.Provider>
  );
};
