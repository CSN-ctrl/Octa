import { ethers } from "ethers";
import { getRpcProvider } from "./wallet";

// Contract addresses - load from deployments or env
const getContractAddresses = () => {
  // Try to load from deployments/addresses.json (will be populated after deployment)
  const addresses = {
    land: import.meta.env.VITE_CONTRACT_ADDRESS || "",
    digitalID: import.meta.env.VITE_DIGITAL_ID_ADDRESS || "",
    treasury: import.meta.env.VITE_TREASURY_ADDRESS || "",
    dummyToken: import.meta.env.VITE_DUMMY_TOKEN_ADDRESS || "",
    plotRegistry: import.meta.env.VITE_PLOT_REGISTRY_ADDRESS || "",
  };

  // Try to fetch from deployments file if available
  try {
    // In production, this could fetch from a config endpoint
    const stored = localStorage.getItem("contract_addresses");
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.assign(addresses, parsed);
    }
  } catch (e) {
    console.warn("Could not load contract addresses from storage");
  }

  return addresses;
};

export const CONTRACT_ADDRESSES = getContractAddresses();

// Contract ABIs - simplified interfaces for the contracts we need
export const LAND_CONTRACT_ABI = [
  "function buyPlot(uint256 plotId) payable",
  "function buyPlotsBatch(uint256[] calldata plotIds) payable",
  // Phase 1 additions
  "function buyPlotWithAVAX(uint256 plotId) payable",
  "function buyPlotWithUSDC(uint256 plotId, uint256 amount)",
  "function setPhase1Prices(uint256 avaxWei, uint256 usdcAmount)",
  "function setTreasuryRouting(address reserveAddr, address operationalAddr)",
  "function setUSDC(address token)",
  "function setRequireDigitalID(bool requireID)",
  "function pendingBuyer(uint256 plotId) view returns (address)",
  "function phase1PriceAVAX() view returns (uint256)",
  "function phase1PriceUSDC() view returns (uint256)",
  "function reserveTreasury() view returns (address)",
  "function operationalTreasury() view returns (address)",
  "function plotsSold() view returns (uint256)",
  "function TOTAL_PLOTS() view returns (uint256)",
  "function priceInAVAX() view returns (uint256)",
  "function salesActive() view returns (bool)",
  "function plotMinted(uint256) view returns (bool)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) view returns (uint256[])",
  "event LandMinted(uint256 indexed plotId, address indexed owner, uint256 pricePaid, bool coldWallet, uint256 timestamp)",
];

export const PLOT_REGISTRY_ABI = [
  // core reads
  "function ownerOfPlot(uint256 plotId) view returns (address)",
  "function activated(uint256 plotId) view returns (bool)",
  "function pendingTransfer(uint256 plotId) view returns (address)",
  "function uri(uint256 id) view returns (string)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  // owner action
  "function requestTransfer(uint256 plotId, address newOwner)",
  // admin actions (not used on FE, but kept for completeness)
  "function adminApproveTransfer(uint256 plotId)",
  "function activate(uint256 plotId, address to, string metadataURI)",
];

export const DIGITAL_ID_ABI = [
  "function registerID(string firstName, string lastName, string email, string avatarURI)",
  "function ids(address user) view returns (string firstName, string lastName, string email, string avatarURI, uint256 registeredAt, bool active)",
  "function deactivateID()",
  "function getID(address user) view returns ((string firstName, string lastName, string email, string avatarURI, uint256 registeredAt, bool active))",
  "event IDRegistered(address indexed user, string firstName, string lastName, uint256 timestamp)",
];

export const TREASURY_ABI = [
  "function balanceAVAX() view returns (uint256)",
  "function balanceERC20(address token) view returns (uint256)",
  "function supportedTokens(address) view returns (bool)",
  "event DepositAVAX(address indexed from, uint256 amount)",
  "event DepositERC20(address indexed from, address indexed token, uint256 amount)",
];

export const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

// Contract instances
export function getLandContract(signer?: ethers.Signer) {
  if (!CONTRACT_ADDRESSES.land) {
    throw new Error("Land contract address not set");
  }
  return new ethers.Contract(
    CONTRACT_ADDRESSES.land,
    LAND_CONTRACT_ABI,
    signer || (getRpcProvider() as any)
  );
}

export function getDigitalIDContract(signer?: ethers.Signer) {
  if (!CONTRACT_ADDRESSES.digitalID) {
    throw new Error("Digital ID contract address not set");
  }
  return new ethers.Contract(
    CONTRACT_ADDRESSES.digitalID,
    DIGITAL_ID_ABI,
    signer || (getRpcProvider() as any)
  );
}

export function getTreasuryContract(signer?: ethers.Signer) {
  if (!CONTRACT_ADDRESSES.treasury) {
    throw new Error("Treasury contract address not set");
  }
  return new ethers.Contract(
    CONTRACT_ADDRESSES.treasury,
    TREASURY_ABI,
    signer || (getRpcProvider() as any)
  );
}

export function getERC20Contract(address: string, signer?: ethers.Signer) {
  return new ethers.Contract(address, ERC20_ABI, signer || (getRpcProvider() as any));
}

export function getPlotRegistryContract(signer?: ethers.Signer) {
  if (!CONTRACT_ADDRESSES.plotRegistry) {
    throw new Error("Plot registry address not set");
  }
  return new ethers.Contract(
    CONTRACT_ADDRESSES.plotRegistry,
    PLOT_REGISTRY_ABI,
    signer || (getRpcProvider() as any)
  );
}

// Helper to load contract addresses from backend
export async function loadContractAddresses(): Promise<void> {
  try {
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
    const response = await fetch(`${backendUrl}/contracts/addresses`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.addresses) {
        Object.assign(CONTRACT_ADDRESSES, data.addresses);
        localStorage.setItem("contract_addresses", JSON.stringify(data.addresses));
      }
    }
  } catch (error) {
    console.warn("Could not load contract addresses from backend:", error);
  }
}

// Initialize on module load - import the loader
import "./contractAddressLoader";


