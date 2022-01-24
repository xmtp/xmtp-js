import { Web3Provider } from '@ethersproject/providers';

declare let window: any;
let web3Provider: InstanceType<typeof Web3Provider> | undefined;

async function getWeb3Provider(): Promise<Web3Provider | undefined> {
  if (window && window.ethereum) {
    web3Provider = await new Web3Provider(window.ethereum);
  }

  return web3Provider;
}

export const xmtpAuthentication = {
  getWeb3Provider
};
// import { Web3Provider, JsonRpcSigner } from '@ethersproject/providers';
// import WalletConnectProvider from '@walletconnect/web3-provider';
// import WalletLink, { WalletLinkProvider } from 'walletlink';

// declare let window: any;
// let web3Provider: InstanceType<typeof Web3Provider> | undefined;
// let selectedAddress: string | undefined;

// const infuraId = process.env.INFURA_ID;
// const infuraRpcUrl = `${process.env.INFURA_RPC_URL}${infuraId}`;

// const METAMASK = 'METAMASK';
// const WALLET_CONNECT = 'WALLET_CONNECT';
// const WALLET_LINK = 'WALLET_LINK';

// type WalletConnector = typeof METAMASK | typeof WALLET_CONNECT | typeof WALLET_LINK;

// //
// async function setWeb3Provider(connectorProvider: typeof window.ethereum | InstanceType<typeof WalletConnectProvider> | InstanceType<typeof WalletLinkProvider>): Promise<void> {
//   if (!connectorProvider) {
//     throw new Error("You must provide a connector provider");
//   }

//   try {
//     web3Provider = await new Web3Provider(connectorProvider);
//   } catch(err) {
//     throw new Error("Unable to set web3 provider.");
//   }
// }

// async function setSelectedAddress(provider: InstanceType<typeof Web3Provider> | undefined): Promise<void> {
//   if (!provider) {
//     throw new Error("You must pass a provider to get a list of accounts");
//   }

//   try {
//     const accounts = await provider.send('eth_requestAccounts', []);
//     selectedAddress = accounts[0];
//   } catch (err: any) {
//     // If user denies request, will return 4001 error
//     throw new Error(`We were unable to retrieve your account(s). \n Reason: ${err.message}`);
//   }
// }

// function getWeb3Provider(): InstanceType<typeof Web3Provider> | undefined {
//   return web3Provider;
// }

// function getWeb3Signer(): InstanceType<typeof JsonRpcSigner> {
//   if (!web3Provider) {
//     throw new Error("You must connect a wallet first");
//   }
//   return web3Provider.getSigner();
//   // @TODO(fw): do we need to call "unlock" for locked accounts here?
//   // https://github.com/ethers-io/ethers.js/blob/master/packages/providers/src.ts/json-rpc-provider.ts#L277
// }

// function getAccountAddress(): string | undefined {
//   return selectedAddress;
// }

// // @TODO(fw): following convo with Martin, we probably just need to check
// // for existence of the ID key, then otherwise listen to wallet events for
// // connection status
// //
// // //type GetSignerType = () => ??
// // //function getSigner() {}
// // /**
// //  * [checkAuthStatus check whether wallet is connected]
// //  * @param {object} Web3Provider - ethersjs-wrappped Ethereum provider
// //  */
// // type CheckConnectionStatus = (provider: Web3Provider) => boolean;
// // function checkConnectionStatus(fn: CheckConnectionStatus) {
// //   if (!provider) {
// //     throw new Error("You must pass a provider to check connection status");
// //   }
// // }
// //

// /**
//  * [addConnectorProviderEvents ethers providers do not implement or expose the underlying
//  * EIP-1193 events :/, so in order to listen for accountChange, disconnect, etc, we need to
//  * attach event listeners on the underlying wallet connector provider]
//  * @param {[type]} provider [wallet connector provider]
//  */
// function addConnectorProviderEvents(provider: typeof window.ethereum | InstanceType<typeof WalletConnectProvider> | InstanceType<typeof WalletLinkProvider>) {
//   // Subscribe to accounts change
//   provider.on("accountsChanged", (accounts: string[]) => {
//     // @TODO(fw): given the API, what's our response here?
//     console.log(accounts);
//   });

//   // Subscribe to chainId change
//   provider.on("chainChanged", (chainId: number) => {
//     // @TODO(fw): given the API, what's our response here?
//     console.log(chainId);
//   });

//   // Subscribe to session disconnection
//   provider.on("disconnect", (code: number, reason: string) => {
//     // @TODO(fw): given the API, what's our response here?
//     console.log(code, reason);
//   });
// }

// /**
//  * [connectWallet: connect a wallet via one of the supported connectors]
//  * @param {union} connectorType [currently, one of 'metamask', 'walletConnect', 'walletLink']
//  * @return {string} user account address
//  */
// async function connectWallet(connectorType: WalletConnector): Promise<string> {
//   if (selectedAddress) {
//     return selectedAddress;
//   }

//   let connectorProvider;
//   switch(connectorType) {
//     case METAMASK:
//       connectorProvider = window.ethereum;
//       break;
//     case WALLET_CONNECT:
//       connectorProvider = new WalletConnectProvider({ infuraId });
//       break;
//     case WALLET_LINK:
//       const walletLink = new WalletLink({
//         appName: process.env.APP_NAME || '',
//         appLogoUrl: process.env.APP_LOGO_URL || '',
//         darkMode: false
//       });
//       connectorProvider = walletLink.makeWeb3Provider(infuraRpcUrl, parseInt((process.env.ETH_CHAIN_ID || ''), 10));
//       break;
//     default:
//       // technically, we don't need a default case w/TS union types, but
//       // leaving in for runtime error handling.
//       throw new Error("Please provide a wallet connector type");
//   }

//   addConnectorProviderEvents(connectorProvider);

//   await setWeb3Provider(connectorProvider);
//   await setSelectedAddress(getWeb3Provider());

//   if (!selectedAddress) {
//     throw new Error("There was an unknown error connecting wallet. Please try again.");
//   }

//   return selectedAddress;
// }

// async function changeAccount() {
//   console.log("user requesting to change selected account");
//   // @TODO
// }

// async function changeChain() {
//   console.log("user requesting to change selected chain");
//   // @TODO
// }

// // @TODO(fw) - sync w/Martin
// function generateIdentitySignature() {
//   if (!web3Provider) {
//     return;
//   }
//   const signer = getWeb3Signer();
//   console.log(signer);
// }

// function disconnectWallet() {
//   // "disconnect" just means revoking a signer/signatures, so we just need
//   // to clear whatever storage we're using to hold those...assuming we want
//   // to provide this functionality at the dapp-level (people can disconnect
//   // from their wallet UIs directly in most cases).
//   console.log("disconnect");
//   selectedAddress = undefined;
//   web3Provider = undefined;
// }


// export const xmtpAuthentication = {
//   changeAccount,
//   changeChain,
//   connectWallet,
//   disconnectWallet,
//   generateIdentitySignature,
//   getAccountAddress,
//   getWeb3Provider,
//   getWeb3Signer
// };
