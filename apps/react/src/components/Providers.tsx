import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { base, mainnet } from "wagmi/chains";
import { NavigateProvider, type NavigateContextValue } from "./NavigateContext";
import { XMTPProvider } from "./XMTPContext";

const queryClient = new QueryClient();

export const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
  },
});

export type ProvidersProps = React.PropsWithChildren & {
  navigate: NavigateContextValue["navigate"];
};

export const Providers: React.FC<ProvidersProps> = ({ children, navigate }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider defaultColorScheme="auto">
          <XMTPProvider>
            <NavigateProvider navigate={navigate}>{children}</NavigateProvider>
          </XMTPProvider>
        </MantineProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
