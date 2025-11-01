import { ethers } from "ethers";
import contractABI from "@/abi/YourContractABI.json";

const RPC_URL = import.meta.env.VITE_AVALANCHE_RPC;
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
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

export function getContract(signer: ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);
}
