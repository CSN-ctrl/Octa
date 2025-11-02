import { ethers } from "ethers";

const RPC_URL = import.meta.env.VITE_AVALANCHE_RPC || "http://127.0.0.1:9650/ext/bc/ChaosStarNetwork/rpc";
export const provider = new ethers.JsonRpcProvider(RPC_URL);

export async function connectWallet() {
  const { ethereum } = window as any;
  if (!ethereum) throw new Error("No wallet found. Install MetaMask or compatible wallet.");

  await ethereum.request({ method: "eth_requestAccounts" });

  const web3Provider = new ethers.BrowserProvider(ethereum);
  const signer = await web3Provider.getSigner();
  const address = await signer.getAddress();

  return { signer, address };
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
