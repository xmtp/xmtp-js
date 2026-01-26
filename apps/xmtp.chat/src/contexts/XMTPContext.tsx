import {
  Client,
  type BuiltInContentTypes,
  type ClientOptions,
  type Signer,
} from "@xmtp/browser-sdk";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAppLock, type AppLockState } from "@/hooks/useAppLock";
import { useActions } from "@/stores/inbox/hooks";

export type ContentTypes = BuiltInContentTypes;

export type InitializeClientOptions = {
  dbEncryptionKey?: Uint8Array;
  env?: ClientOptions["env"];
  loggingLevel?: ClientOptions["loggingLevel"];
  signer: Signer;
  gatewayHost?: string;
};

export type XMTPContextValue = {
  /**
   * The XMTP client instance
   */
  client?: Client;
  /**
   * Set the XMTP client instance
   */
  setClient: React.Dispatch<React.SetStateAction<Client | undefined>>;
  initialize: (options: InitializeClientOptions) => Promise<Client | undefined>;
  initializing: boolean;
  error: Error | null;
  disconnect: () => void;
  lockState: AppLockState;
  acquireLock: () => void;
  releaseLock: () => void;
};

export const XMTPContext = createContext<XMTPContextValue>({
  setClient: () => {},
  initialize: () => Promise.reject(new Error("XMTPProvider not available")),
  initializing: false,
  error: null,
  disconnect: () => {},
  lockState: "available",
  acquireLock: () => false,
  releaseLock: () => {},
});

export type XMTPProviderProps = React.PropsWithChildren & {
  /**
   * Initial XMTP client instance
   */
  client?: Client;
};

export const XMTPProvider: React.FC<XMTPProviderProps> = ({
  children,
  client: initialClient,
}) => {
  const { reset } = useActions();
  const [client, setClient] = useState<Client | undefined>(initialClient);
  // when another session claims the lock, disconnect without releasing
  const handleLockLost = useCallback(() => {
    if (client) {
      client.close();
      setClient(undefined);
      reset();
    }
  }, [client, reset]);
  const { lockState, acquireLock, releaseLock } = useAppLock(handleLockLost);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // client is initializing
  const initializingRef = useRef(false);

  /**
   * Initialize an XMTP client
   */
  const initialize = useCallback(
    async ({
      dbEncryptionKey,
      env,
      loggingLevel,
      signer,
      gatewayHost,
    }: InitializeClientOptions) => {
      // only initialize a client if one doesn't already exist
      if (!client) {
        const lockAcquired = acquireLock();
        // if the client is already initializing or the lock can't be acquired,
        // don't do anything
        if (initializingRef.current || !lockAcquired) {
          return undefined;
        }

        // flag the client as initializing
        initializingRef.current = true;

        // reset error state
        setError(null);
        // reset initializing state
        setInitializing(true);

        let xmtpClient: Client;

        try {
          // create a new XMTP client
          xmtpClient = await Client.create(signer, {
            env,
            loggingLevel,
            dbEncryptionKey,
            appVersion: "xmtp.chat/0",
            gatewayHost,
          });
          setClient(xmtpClient);
        } catch (e) {
          setClient(undefined);
          setError(e as Error);
          // release lock on error
          releaseLock();
          // re-throw error for upstream consumption
          throw e;
        } finally {
          initializingRef.current = false;
          setInitializing(false);
        }

        return xmtpClient;
      }
      return client;
    },
    [client, acquireLock, releaseLock],
  );

  const disconnect = useCallback(() => {
    if (client) {
      client.close();
      setClient(undefined);
      reset();
      releaseLock();
    }
  }, [client, setClient, releaseLock, reset]);

  // memo-ize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      client,
      setClient,
      initialize,
      initializing,
      error,
      disconnect,
      lockState,
      acquireLock,
      releaseLock,
    }),
    [
      client,
      initialize,
      initializing,
      error,
      disconnect,
      lockState,
      acquireLock,
      releaseLock,
    ],
  );

  return <XMTPContext.Provider value={value}>{children}</XMTPContext.Provider>;
};

export const useXMTP = () => {
  return useContext(XMTPContext);
};

export const useClient = () => {
  const { client } = useXMTP();
  if (!client) {
    throw new Error("useClient: XMTP client not initialized");
  }
  return client;
};
