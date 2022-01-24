import { Web3Provider, JsonRpcSigner } from '@ethersproject/providers';
declare const METAMASK = "METAMASK";
declare const WALLET_CONNECT = "WALLET_CONNECT";
declare const WALLET_LINK = "WALLET_LINK";
declare type WalletConnector = typeof METAMASK | typeof WALLET_CONNECT | typeof WALLET_LINK;
declare function getWeb3Provider(): InstanceType<typeof Web3Provider> | undefined;
declare function getWeb3Signer(): InstanceType<typeof JsonRpcSigner>;
declare function getAccountAddress(): string | undefined;
/**
 * [connectWallet: connect a wallet via one of the supported connectors]
 * @param {union} connectorType [currently, one of 'metamask', 'walletConnect', 'walletLink']
 * @return {string} user account address
 */
declare function connectWallet(connectorType: WalletConnector): Promise<string>;
declare function changeAccount(): Promise<void>;
declare function changeChain(): Promise<void>;
declare function generateIdentitySignature(): void;
declare function disconnectWallet(): void;
export declare const XMTPAuth: {
    changeAccount: typeof changeAccount;
    changeChain: typeof changeChain;
    connectWallet: typeof connectWallet;
    disconnectWallet: typeof disconnectWallet;
    generateIdentitySignature: typeof generateIdentitySignature;
    getAccountAddress: typeof getAccountAddress;
    getWeb3Provider: typeof getWeb3Provider;
    getWeb3Signer: typeof getWeb3Signer;
};
export {};
//# sourceMappingURL=index.d.ts.map