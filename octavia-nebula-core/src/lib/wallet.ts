import { ethers } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";

const DEFAULT_FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc"; // public Fuji endpoint
const RPC_URL = import.meta.env.VITE_AVALANCHE_RPC || DEFAULT_FUJI_RPC;

export function getRpcProvider(): ethers.JsonRpcProvider | null {
	try {
		return new ethers.JsonRpcProvider(RPC_URL);
	} catch {
		return null;
	}
}

let walletConnectProvider: any = null;

export async function connectWallet(useWalletConnect = false) {
  if (useWalletConnect) {
    // WalletConnect for mobile wallets
    walletConnectProvider = await EthereumProvider.init({
      projectId: "4c6f927e5c0e8a7d8f3b2e1a6d9c4f8b", // Public WalletConnect project ID
      chains: [43113], // Avalanche Fuji testnet
      showQrModal: true,
      rpcMap: {
        43113: RPC_URL,
      },
    });

    await walletConnectProvider.enable();
    const web3Provider = new ethers.BrowserProvider(walletConnectProvider);
    const signer = await web3Provider.getSigner();
    const address = await signer.getAddress();

    return { signer, address, provider: walletConnectProvider };
  }

  // Browser extension wallet (MetaMask)
  const { ethereum } = window as any;
  if (!ethereum) throw new Error("No wallet found. Install MetaMask or use WalletConnect for mobile.");

  await ethereum.request({ method: "eth_requestAccounts" });

  const web3Provider = new ethers.BrowserProvider(ethereum);
  const signer = await web3Provider.getSigner();
  const address = await signer.getAddress();

  return { signer, address, provider: ethereum };
}

export async function disconnectWalletConnect() {
  if (walletConnectProvider) {
    await walletConnectProvider.disconnect();
    walletConnectProvider = null;
  }
}

export async function getConnectedAddress(): Promise<string | null> {
  const { ethereum } = window as any;
  if (!ethereum) return null;

  const accounts = await ethereum.request({ method: "eth_accounts" });
  return accounts.length ? accounts[0] : null;
}

// Legacy function - use getLandContract from @/lib/contracts instead
export function getContract(signer: ethers.Signer) {
  const { getLandContract } = require("./contracts");
  return getLandContract(signer);
}
