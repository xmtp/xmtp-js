import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { createConfig, http, WagmiProvider } from "wagmi";
import { base, mainnet } from "wagmi/chains";
import { App } from "./components/App";
import { RefManagerProvider } from "./components/RefManager";
import { XMTPProvider } from "./components/XMTPContext";

const queryClient = new QueryClient();

export const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
  },
});

createRoot(document.getElementById("root") as HTMLElement).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <MantineProvider defaultColorScheme="auto">
        <XMTPProvider>
          <BrowserRouter>
            <RefManagerProvider>
              <App />
            </RefManagerProvider>
          </BrowserRouter>
        </XMTPProvider>
      </MantineProvider>
    </QueryClientProvider>
  </WagmiProvider>,
);
