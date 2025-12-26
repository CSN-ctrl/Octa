// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// React hook for Local Digital ID system

import { useState, useEffect, useCallback } from "react";
import {
  LocalDigitalID,
  DigitalIDWallet,
  VaultItem,
  createDigitalID,
  getDigitalID,
  updateDigitalID,
  hasDigitalID,
  createDigitalIDWallet,
  getDigitalIDWallets,
  getWalletPrivateKey,
  deleteDigitalIDWallet,
  setPrimaryWallet,
  addVaultItem,
  getVaultItems,
  updateVaultItem,
  deleteVaultItem,
  setSyncEnabled,
  exportDigitalIDData,
  importDigitalIDData,
} from "@/lib/digital-id-local";
import { toast } from "sonner";

export function useLocalDigitalID() {
  const [digitalID, setDigitalID] = useState<LocalDigitalID | null>(null);
  const [wallets, setWallets] = useState<DigitalIDWallet[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState<string | null>(null);

  // Check if Digital ID exists
  const checkDigitalID = useCallback(() => {
    return hasDigitalID();
  }, []);

  // Authenticate with password
  const authenticate = useCallback((userPassword: string) => {
    try {
      const id = getDigitalID(userPassword);
      if (id) {
        setDigitalID(id);
        setPassword(userPassword);
        setIsAuthenticated(true);
        
        // Load wallets and vault
        const userWallets = getDigitalIDWallets(userPassword);
        const userVaultItems = getVaultItems(userPassword);
        setWallets(userWallets);
        setVaultItems(userVaultItems);
        
        return true;
      }
      return false;
    } catch (error: any) {
      setError(error.message);
      return false;
    }
  }, []);

  // Create new Digital ID
  const createID = useCallback(
    (userPassword: string, personalData: Partial<LocalDigitalID["personalData"]>) => {
      setLoading(true);
      setError(null);
      try {
        const newID = createDigitalID(userPassword, personalData);
        setDigitalID(newID);
        setPassword(userPassword);
        setIsAuthenticated(true);
        setWallets([]);
        setVaultItems([]);
        toast.success("Digital ID created successfully!");
        return newID;
      } catch (error: any) {
        setError(error.message);
        toast.error(error.message || "Failed to create Digital ID");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Update Digital ID
  const updateID = useCallback(
    (updates: Partial<LocalDigitalID>) => {
      if (!password || !digitalID) {
        setError("Not authenticated");
        return false;
      }
      
      setLoading(true);
      setError(null);
      try {
        const updated = updateDigitalID(password, updates);
        if (updated) {
          setDigitalID(updated);
          toast.success("Digital ID updated");
          return true;
        }
        return false;
      } catch (error: any) {
        setError(error.message);
        toast.error(error.message || "Failed to update Digital ID");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [password, digitalID]
  );

  // Create wallet
  const createWallet = useCallback(
    (name: string) => {
      if (!password) {
        setError("Not authenticated");
        return null;
      }
      
      setLoading(true);
      setError(null);
      try {
        const wallet = createDigitalIDWallet(password, name);
        if (wallet) {
          const updatedWallets = getDigitalIDWallets(password);
          setWallets(updatedWallets);
          toast.success(`Wallet ${wallet.name} created`);
          return wallet;
        }
        return null;
      } catch (error: any) {
        setError(error.message);
        toast.error(error.message || "Failed to create wallet");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [password]
  );

  // Get wallet private key
  const getPrivateKey = useCallback(
    (walletId: string) => {
      if (!password) {
        return null;
      }
      return getWalletPrivateKey(password, walletId);
    },
    [password]
  );

  // Delete wallet
  const deleteWallet = useCallback(
    (walletId: string) => {
      if (!password) {
        setError("Not authenticated");
        return false;
      }
      
      try {
        const success = deleteDigitalIDWallet(password, walletId);
        if (success) {
          const updatedWallets = getDigitalIDWallets(password);
          setWallets(updatedWallets);
          toast.success("Wallet deleted");
          return true;
        }
        return false;
      } catch (error: any) {
        setError(error.message);
        toast.error(error.message || "Failed to delete wallet");
        return false;
      }
    },
    [password]
  );

  // Set primary wallet
  const setPrimary = useCallback(
    (walletId: string) => {
      if (!password) {
        return false;
      }
      
      try {
        const success = setPrimaryWallet(password, walletId);
        if (success) {
          const updatedWallets = getDigitalIDWallets(password);
          setWallets(updatedWallets);
          toast.success("Primary wallet updated");
          return true;
        }
        return false;
      } catch (error: any) {
        setError(error.message);
        return false;
      }
    },
    [password]
  );

  // Vault operations
  const addItem = useCallback(
    (item: Omit<VaultItem, "id" | "createdAt" | "updatedAt">) => {
      if (!password) {
        setError("Not authenticated");
        return null;
      }
      
      try {
        const newItem = addVaultItem(password, item);
        const updatedItems = getVaultItems(password);
        setVaultItems(updatedItems);
        toast.success("Item added to vault");
        return newItem;
      } catch (error: any) {
        setError(error.message);
        toast.error(error.message || "Failed to add item");
        return null;
      }
    },
    [password]
  );

  const updateItem = useCallback(
    (itemId: string, updates: Partial<VaultItem>) => {
      if (!password) {
        setError("Not authenticated");
        return false;
      }
      
      try {
        const success = updateVaultItem(password, itemId, updates);
        if (success) {
          const updatedItems = getVaultItems(password);
          setVaultItems(updatedItems);
          toast.success("Vault item updated");
          return true;
        }
        return false;
      } catch (error: any) {
        setError(error.message);
        return false;
      }
    },
    [password]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      if (!password) {
        setError("Not authenticated");
        return false;
      }
      
      try {
        const success = deleteVaultItem(password, itemId);
        if (success) {
          const updatedItems = getVaultItems(password);
          setVaultItems(updatedItems);
          toast.success("Item removed from vault");
          return true;
        }
        return false;
      } catch (error: any) {
        setError(error.message);
        return false;
      }
    },
    [password]
  );

  // Sync operations
  const enableSync = useCallback(
    (syncAddress?: string) => {
      if (!password) {
        return false;
      }
      
      try {
        const success = setSyncEnabled(password, true, syncAddress);
        if (success) {
          const updated = getDigitalID(password);
          if (updated) {
            setDigitalID(updated);
            toast.success("Blockchain sync enabled");
          }
          return success;
        }
        return false;
      } catch (error: any) {
        setError(error.message);
        return false;
      }
    },
    [password]
  );

  const disableSync = useCallback(() => {
    if (!password) {
      return false;
    }
    
    try {
      const success = setSyncEnabled(password, false);
      if (success) {
        const updated = getDigitalID(password);
        if (updated) {
          setDigitalID(updated);
          toast.success("Blockchain sync disabled");
        }
        return success;
      }
      return false;
    } catch (error: any) {
      setError(error.message);
      return false;
    }
  }, [password]);

  // Export/Import
  const exportData = useCallback(() => {
    if (!password) {
      return null;
    }
    
    try {
      return exportDigitalIDData(password);
    } catch (error: any) {
      setError(error.message);
      return null;
    }
  }, [password]);

  const importData = useCallback(
    (encryptedData: string) => {
      if (!password) {
        return false;
      }
      
      try {
        const success = importDigitalIDData(password, encryptedData);
        if (success) {
          // Reload data
          const id = getDigitalID(password);
          const userWallets = getDigitalIDWallets(password);
          const userVaultItems = getVaultItems(password);
          setDigitalID(id);
          setWallets(userWallets);
          setVaultItems(userVaultItems);
          toast.success("Digital ID data imported successfully");
        }
        return success;
      } catch (error: any) {
        setError(error.message);
        toast.error(error.message || "Failed to import data");
        return false;
      }
    },
    [password]
  );

  // Logout
  const logout = useCallback(() => {
    setDigitalID(null);
    setWallets([]);
    setVaultItems([]);
    setPassword(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  return {
    digitalID,
    wallets,
    vaultItems,
    loading,
    error,
    isAuthenticated,
    hasDigitalID: checkDigitalID(),
    authenticate,
    createID,
    updateID,
    createWallet,
    getPrivateKey,
    deleteWallet,
    setPrimary,
    addItem,
    updateItem,
    removeItem,
    enableSync,
    disableSync,
    exportData,
    importData,
    logout,
  };
}

