import "@mantine/core/styles.css";
import { createTheme, MantineProvider } from "@mantine/core";
import { QueryClientProvider } from "@tanstack/react-query";
import pkg from "@xmtp/browser-sdk/package.json";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { createConfig, http, WagmiProvider } from "wagmi";
import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  lens,
  lensTestnet,
  linea,
  lineaSepolia,
  mainnet,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  sepolia,
  worldchain,
  worldchainSepolia,
  zksync,
  zksyncSepoliaTestnet,
} from "wagmi/chains";
import {
  coinbaseWallet,
  injected,
  metaMask,
  walletConnect,
} from "wagmi/connectors";
import { App } from "@/components/App/App";
import { XMTPProvider } from "@/contexts/XMTPContext";
import { queryClient } from "@/helpers/queries";

export const config = createConfig({
  connectors: [
    injected(),
    coinbaseWallet({
      appName: "xmtp.chat",
    }),
    metaMask(),
    walletConnect({ projectId: import.meta.env.VITE_PROJECT_ID }),
  ],
  chains: [
    arbitrum,
    arbitrumSepolia,
    base,
    baseSepolia,
    linea,
    lineaSepolia,
    mainnet,
    optimism,
    optimismSepolia,
    polygon,
    polygonAmoy,
    sepolia,
    worldchain,
    worldchainSepolia,
    zksync,
    zksyncSepoliaTestnet,
    lens,
    lensTestnet,
  ],
  transports: {
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [linea.id]: http(),
    [lineaSepolia.id]: http(),
    [mainnet.id]: http(),
    [optimism.id]: http(),
    [optimismSepolia.id]: http(),
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
    [sepolia.id]: http(),
    [worldchain.id]: http(),
    [worldchainSepolia.id]: http(),
    [zksync.id]: http(),
    [zksyncSepoliaTestnet.id]: http(),
    [lens.id]: http(),
    [lensTestnet.id]: http(),
  },
});

const theme = createTheme({
  fontSizes: {
    xxs: "calc(0.6875rem * var(--mantine-scale))",
  },
  lineHeights: {
    xxs: "1.2",
  },
  spacing: {
    xxs: "calc(0.5rem * var(--mantine-scale))",
    xxxs: "calc(0.25rem * var(--mantine-scale))",
  },
});

createRoot(document.getElementById("root") as HTMLElement).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <MantineProvider defaultColorScheme="auto" theme={theme}>
        <XMTPProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </XMTPProvider>
      </MantineProvider>
    </QueryClientProvider>
  </WagmiProvider>,
);

console.log("[xmtp.chat] XMTP Browser SDK version:", pkg.version);
