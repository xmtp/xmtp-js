import {
  Client,
  type ClientOptions,
  type ExtractCodecContentTypes,
  type Signer,
} from "@xmtp/browser-sdk";
import { MarkdownCodec } from "@xmtp/content-type-markdown";
import { ReactionCodec } from "@xmtp/content-type-reaction";
import { ReadReceiptCodec } from "@xmtp/content-type-read-receipt";
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
import { ActionsCodec } from "@/content-types/Actions";
import { IntentCodec } from "@/content-types/Intent";
import { useActions } from "@/stores/inbox/hooks";

export type ContentTypes = ExtractCodecContentTypes<
  [
    ReactionCodec,
    ReplyCodec,
    RemoteAttachmentCodec,
    TransactionReferenceCodec,
    WalletSendCallsCodec,
    ReadReceiptCodec,
    ActionsCodec,
    IntentCodec,
    MarkdownCodec,
  ]
>;

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
  client?: Client<ContentTypes>;
  /**
   * Set the XMTP client instance
   */
  setClient: React.Dispatch<
    React.SetStateAction<Client<ContentTypes> | undefined>
  >;
  initialize: (
    options: InitializeClientOptions,
  ) => Promise<Client<ContentTypes> | undefined>;
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
  client?: Client<ContentTypes>;
};

export const XMTPProvider: React.FC<XMTPProviderProps> = ({
  children,
  client: initialClient,
}) => {
  const { reset } = useActions();
  const [client, setClient] = useState<Client<ContentTypes> | undefined>(
    initialClient,
  );

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

        let xmtpClient: Client<ContentTypes>;

        try {
          // create a new XMTP client
          xmtpClient = await Client.create(signer, {
            env,
            loggingLevel,
            dbEncryptionKey,
            appVersion: "xmtp.chat/0",
            codecs: [
              new ReactionCodec(),
              new ReplyCodec(),
              new RemoteAttachmentCodec(),
              new TransactionReferenceCodec(),
              new WalletSendCallsCodec(),
              new ReadReceiptCodec(),
              new ActionsCodec(),
              new IntentCodec(),
              new MarkdownCodec(),
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
      reset();
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

export const useClient = () => {
  const { client } = useXMTP();
  if (!client) {
    throw new Error("useClient: XMTP client not initialized");
  }
  return client;
};
