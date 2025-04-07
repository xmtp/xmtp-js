import { Client, type ClientOptions, type Signer } from "@xmtp/browser-sdk";
import { ReactionCodec } from "@xmtp/content-type-reaction";
import { RemoteAttachmentCodec } from "@xmtp/content-type-remote-attachment";
import { ReplyCodec } from "@xmtp/content-type-reply";
import { TransactionReferenceCodec } from "@xmtp/content-type-transaction-reference";
import { WalletSendCallsCodec } from "@xmtp/content-type-wallet-send-calls";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

export type InitializeClientOptions = {
  dbEncryptionKey?: Uint8Array;
  env?: ClientOptions["env"];
  loggingLevel?: ClientOptions["loggingLevel"];
  signer: Signer;
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
};

export const XMTPContext = createContext<XMTPContextValue>({
  setClient: () => {},
  initialize: () => Promise.reject(new Error("XMTPProvider not available")),
  initializing: false,
  error: null,
  disconnect: () => {},
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
  const [client, setClient] = useState<Client | undefined>(initialClient);

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
    }: InitializeClientOptions) => {
      // only initialize a client if one doesn't already exist
      if (!client) {
        // if the client is already initializing, don't do anything
        if (initializingRef.current) {
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
            codecs: [
              new ReactionCodec(),
              new ReplyCodec(),
              new RemoteAttachmentCodec(),
              new TransactionReferenceCodec(),
              new WalletSendCallsCodec(),
            ],
          });
          setClient(xmtpClient);
        } catch (e) {
          setClient(undefined);
          setError(e as Error);
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
      error,
      disconnect,
    }),
    [client, initialize, initializing, error, disconnect],
  );

  return <XMTPContext.Provider value={value}>{children}</XMTPContext.Provider>;
};

export const useXMTP = () => {
  return useContext(XMTPContext);
};
