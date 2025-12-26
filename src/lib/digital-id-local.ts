// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Local-First Digital ID System
// Stores personal data locally on user devices and generates unique identifier

import { ethers } from "ethers";
import CryptoJS from "crypto-js";

// Storage keys
const DIGITAL_ID_STORAGE_KEY = "chaosstar_digital_id";
const DIGITAL_ID_WALLETS_KEY = "chaosstar_digital_id_wallets";
const DIGITAL_ID_VAULT_KEY = "chaosstar_digital_id_vault";
const DIGITAL_ID_SYNC_ENABLED_KEY = "chaosstar_digital_id_sync_enabled";

// Digital ID data structure
export interface LocalDigitalID {
  uniqueId: string; // Unique number that connects to the app
  createdAt: number;
  lastUpdated: number;
  syncEnabled: boolean; // Toggle for blockchain sync (off by default)
  syncAddress?: string; // Blockchain address when synced
  
  // Personal data (stored locally only)
  personalData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    avatarURI?: string;
    bio?: string;
    location?: string;
    timezone?: string;
  };
  
  // Additional metadata
  metadata: {
    version: string;
    deviceId: string;
    encrypted: boolean;
  };
}

// Wallet associated with Digital ID
export interface DigitalIDWallet {
  id: string;
  name: string;
  address: string;
  encryptedPrivateKey: string;
  createdAt: number;
  isPrimary: boolean;
}

// Vault item (encrypted data)
export interface VaultItem {
  id: string;
  type: "note" | "credential" | "document" | "key" | "other";
  title: string;
  encryptedData: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

// Generate unique ID (combines timestamp, random, and device fingerprint)
export function generateUniqueID(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  const deviceFingerprint = getDeviceFingerprint();
  const hash = CryptoJS.SHA256(`${timestamp}-${random}-${deviceFingerprint}`).toString();
  
  // Return a readable unique number (first 16 chars of hash as hex)
  return `CS${hash.substring(0, 14).toUpperCase()}`;
}

// Get device fingerprint
function getDeviceFingerprint(): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("ChaosStar Digital ID", 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset().toString(),
    canvas.toDataURL(),
  ].join("|");
  
  return CryptoJS.SHA256(fingerprint).toString();
}

// Encrypt data with password
export function encryptData(data: string, password: string): string {
  return CryptoJS.AES.encrypt(data, password).toString();
}

// Decrypt data with password
export function decryptData(encryptedData: string, password: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, password);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Create new Digital ID
export function createDigitalID(password: string, personalData: Partial<LocalDigitalID["personalData"]>): LocalDigitalID {
  const uniqueId = generateUniqueID();
  const now = Date.now();
  
  const digitalID: LocalDigitalID = {
    uniqueId,
    createdAt: now,
    lastUpdated: now,
    syncEnabled: false,
    personalData: {
      ...personalData,
    },
    metadata: {
      version: "1.0.0",
      deviceId: getDeviceFingerprint(),
      encrypted: true,
    },
  };
  
  // Encrypt and store
  const encrypted = encryptData(JSON.stringify(digitalID), password);
  localStorage.setItem(DIGITAL_ID_STORAGE_KEY, encrypted);
  
  return digitalID;
}

// Get Digital ID (requires password)
export function getDigitalID(password: string): LocalDigitalID | null {
  try {
    const encrypted = localStorage.getItem(DIGITAL_ID_STORAGE_KEY);
    if (!encrypted) {
      return null;
    }
    
    const decrypted = decryptData(encrypted, password);
    return JSON.parse(decrypted) as LocalDigitalID;
  } catch (error) {
    console.error("Failed to get Digital ID:", error);
    return null;
  }
}

// Update Digital ID
export function updateDigitalID(password: string, updates: Partial<LocalDigitalID>): LocalDigitalID | null {
  const current = getDigitalID(password);
  if (!current) {
    return null;
  }
  
  const updated: LocalDigitalID = {
    ...current,
    ...updates,
    lastUpdated: Date.now(),
  };
  
  const encrypted = encryptData(JSON.stringify(updated), password);
  localStorage.setItem(DIGITAL_ID_STORAGE_KEY, encrypted);
  
  return updated;
}

// Check if Digital ID exists
export function hasDigitalID(): boolean {
  return localStorage.getItem(DIGITAL_ID_STORAGE_KEY) !== null;
}

// Create wallet for Digital ID
export function createDigitalIDWallet(password: string, name: string): DigitalIDWallet | null {
  const digitalID = getDigitalID(password);
  if (!digitalID) {
    return null;
  }
  
  // Generate new wallet
  const wallet = ethers.Wallet.createRandom();
  const walletAddress = wallet.address;
  const privateKey = wallet.privateKey;
  
  // Encrypt private key with Digital ID password
  const encryptedPrivateKey = encryptData(privateKey, password);
  
  const newWallet: DigitalIDWallet = {
    id: `wallet_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    name: name || `Wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
    address: walletAddress,
    encryptedPrivateKey,
    createdAt: Date.now(),
    isPrimary: false,
  };
  
  // Get existing wallets
  const wallets = getDigitalIDWallets(password);
  wallets.push(newWallet);
  
  // If this is the first wallet, make it primary
  if (wallets.length === 1) {
    newWallet.isPrimary = true;
  }
  
  // Save wallets
  const encryptedWallets = encryptData(JSON.stringify(wallets), password);
  localStorage.setItem(DIGITAL_ID_WALLETS_KEY, encryptedWallets);
  
  return newWallet;
}

// Get all wallets for Digital ID
export function getDigitalIDWallets(password: string): DigitalIDWallet[] {
  try {
    const encrypted = localStorage.getItem(DIGITAL_ID_WALLETS_KEY);
    if (!encrypted) {
      return [];
    }
    
    const decrypted = decryptData(encrypted, password);
    return JSON.parse(decrypted) as DigitalIDWallet[];
  } catch (error) {
    console.error("Failed to get Digital ID wallets:", error);
    return [];
  }
}

// Get wallet private key
export function getWalletPrivateKey(password: string, walletId: string): string | null {
  const wallets = getDigitalIDWallets(password);
  const wallet = wallets.find((w) => w.id === walletId);
  if (!wallet) {
    return null;
  }
  
  try {
    return decryptData(wallet.encryptedPrivateKey, password);
  } catch (error) {
    console.error("Failed to decrypt wallet private key:", error);
    return null;
  }
}

// Delete wallet
export function deleteDigitalIDWallet(password: string, walletId: string): boolean {
  const wallets = getDigitalIDWallets(password);
  const filtered = wallets.filter((w) => w.id !== walletId);
  
  if (filtered.length === wallets.length) {
    return false; // Wallet not found
  }
  
  const encrypted = encryptData(JSON.stringify(filtered), password);
  localStorage.setItem(DIGITAL_ID_WALLETS_KEY, encrypted);
  return true;
}

// Set primary wallet
export function setPrimaryWallet(password: string, walletId: string): boolean {
  const wallets = getDigitalIDWallets(password);
  const wallet = wallets.find((w) => w.id === walletId);
  if (!wallet) {
    return false;
  }
  
  // Set all to non-primary, then set selected to primary
  wallets.forEach((w) => {
    w.isPrimary = w.id === walletId;
  });
  
  const encrypted = encryptData(JSON.stringify(wallets), password);
  localStorage.setItem(DIGITAL_ID_WALLETS_KEY, encrypted);
  return true;
}

// Vault operations
export function addVaultItem(password: string, item: Omit<VaultItem, "id" | "createdAt" | "updatedAt">): VaultItem {
  const vaultItems = getVaultItems(password);
  
  const newItem: VaultItem = {
    ...item,
    id: `vault_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  vaultItems.push(newItem);
  
  const encrypted = encryptData(JSON.stringify(vaultItems), password);
  localStorage.setItem(DIGITAL_ID_VAULT_KEY, encrypted);
  
  return newItem;
}

export function getVaultItems(password: string): VaultItem[] {
  try {
    const encrypted = localStorage.getItem(DIGITAL_ID_VAULT_KEY);
    if (!encrypted) {
      return [];
    }
    
    const decrypted = decryptData(encrypted, password);
    return JSON.parse(decrypted) as VaultItem[];
  } catch (error) {
    console.error("Failed to get vault items:", error);
    return [];
  }
}

export function updateVaultItem(password: string, itemId: string, updates: Partial<VaultItem>): boolean {
  const items = getVaultItems(password);
  const index = items.findIndex((item) => item.id === itemId);
  
  if (index === -1) {
    return false;
  }
  
  items[index] = {
    ...items[index],
    ...updates,
    updatedAt: Date.now(),
  };
  
  const encrypted = encryptData(JSON.stringify(items), password);
  localStorage.setItem(DIGITAL_ID_VAULT_KEY, encrypted);
  return true;
}

export function deleteVaultItem(password: string, itemId: string): boolean {
  const items = getVaultItems(password);
  const filtered = items.filter((item) => item.id !== itemId);
  
  if (filtered.length === items.length) {
    return false;
  }
  
  const encrypted = encryptData(JSON.stringify(filtered), password);
  localStorage.setItem(DIGITAL_ID_VAULT_KEY, encrypted);
  return true;
}

// Enable/disable blockchain sync
export function setSyncEnabled(password: string, enabled: boolean, syncAddress?: string): boolean {
  const digitalID = getDigitalID(password);
  if (!digitalID) {
    return false;
  }
  
  const updated = updateDigitalID(password, {
    syncEnabled: enabled,
    syncAddress: enabled ? syncAddress : undefined,
  });
  
  return updated !== null;
}

// Export Digital ID data (for backup)
export function exportDigitalIDData(password: string): string | null {
  const digitalID = getDigitalID(password);
  const wallets = getDigitalIDWallets(password);
  const vaultItems = getVaultItems(password);
  
  if (!digitalID) {
    return null;
  }
  
  const exportData = {
    digitalID,
    wallets,
    vaultItems,
    exportedAt: Date.now(),
    version: "1.0.0",
  };
  
  // Encrypt export with password
  return encryptData(JSON.stringify(exportData), password);
}

// Import Digital ID data (for restore)
export function importDigitalIDData(password: string, encryptedData: string): boolean {
  try {
    const decrypted = decryptData(encryptedData, password);
    const importData = JSON.parse(decrypted);
    
    // Validate structure
    if (!importData.digitalID || !importData.wallets || !importData.vaultItems) {
      return false;
    }
    
    // Import Digital ID
    const encryptedID = encryptData(JSON.stringify(importData.digitalID), password);
    localStorage.setItem(DIGITAL_ID_STORAGE_KEY, encryptedID);
    
    // Import wallets
    const encryptedWallets = encryptData(JSON.stringify(importData.wallets), password);
    localStorage.setItem(DIGITAL_ID_WALLETS_KEY, encryptedWallets);
    
    // Import vault
    const encryptedVault = encryptData(JSON.stringify(importData.vaultItems), password);
    localStorage.setItem(DIGITAL_ID_VAULT_KEY, encryptedVault);
    
    return true;
  } catch (error) {
    console.error("Failed to import Digital ID data:", error);
    return false;
  }
}

