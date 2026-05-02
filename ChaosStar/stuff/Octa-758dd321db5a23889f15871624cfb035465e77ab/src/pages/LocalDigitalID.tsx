// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Local Digital ID Page - Personal Vault with Local Storage

import { useState } from "react";
import { useLocalDigitalID } from "@/hooks/useLocalDigitalID";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Plus, Trash2, Key, Shield, Download, Upload, Eye, EyeOff, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function LocalDigitalID() {
  const {
    digitalID,
    wallets,
    vaultItems,
    loading,
    error,
    isAuthenticated,
    hasDigitalID,
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
  } = useLocalDigitalID();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "create">(hasDigitalID ? "login" : "create");
  
  // Create ID form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  
  // Wallet creation
  const [newWalletName, setNewWalletName] = useState("");
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  
  // Vault item creation
  const [newItemType, setNewItemType] = useState<"note" | "credential" | "document" | "key" | "other">("note");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemData, setNewItemData] = useState("");
  const [showVaultDialog, setShowVaultDialog] = useState(false);

  const handleAuthenticate = () => {
    if (authMode === "create") {
      if (!password || password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      createID(password, { firstName, lastName, email });
    } else {
      if (!password) {
        toast.error("Password required");
        return;
      }
      const success = authenticate(password);
      if (!success) {
        toast.error("Invalid password");
      }
    }
  };

  const handleCreateWallet = () => {
    if (!newWalletName.trim()) {
      toast.error("Wallet name required");
      return;
    }
    createWallet(newWalletName);
    setNewWalletName("");
    setShowWalletDialog(false);
  };

  const handleAddVaultItem = () => {
    if (!newItemTitle.trim() || !newItemData.trim()) {
      toast.error("Title and data required");
      return;
    }
    addItem({
      type: newItemType,
      title: newItemTitle,
      encryptedData: newItemData,
      tags: [],
    });
    setNewItemTitle("");
    setNewItemData("");
    setShowVaultDialog(false);
  };

  const handleExport = () => {
    const data = exportData();
    if (data) {
      const blob = new Blob([data], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chaosstar-digital-id-backup-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup exported");
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = importData(content);
      if (success) {
        event.target.value = ""; // Reset input
      }
    };
    reader.readAsText(file);
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {authMode === "create" ? "Create Digital ID" : "Access Digital ID"}
            </CardTitle>
            <CardDescription>
              {authMode === "create"
                ? "Create your local Digital ID. All data is stored securely on your device."
                : "Enter your password to access your Digital ID vault."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authMode === "create" && (
              <>
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  onKeyPress={(e) => e.key === "Enter" && handleAuthenticate()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button
              onClick={handleAuthenticate}
              disabled={loading || !password}
              className="w-full"
            >
              {authMode === "create" ? "Create Digital ID" : "Access Vault"}
            </Button>
            {hasDigitalID && (
              <Button
                variant="outline"
                onClick={() => setAuthMode(authMode === "create" ? "login" : "create")}
                className="w-full"
              >
                {authMode === "create" ? "Already have an ID? Login" : "Create New ID"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">Digital ID Vault</h1>
        <p className="text-muted-foreground">
          Unique ID: <code className="bg-muted px-2 py-1 rounded">{digitalID?.uniqueId}</code>
        </p>
        {digitalID?.syncEnabled && (
          <Badge variant="secondary" className="mt-2">
            Blockchain Sync: {digitalID.syncAddress?.slice(0, 10)}...
          </Badge>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Backup
        </Button>
        <label>
          <Button variant="outline" asChild>
            <span>
              <Upload className="h-4 w-4 mr-2" />
              Import Backup
            </span>
          </Button>
          <input
            type="file"
            accept=".txt"
            onChange={handleImport}
            className="hidden"
          />
        </label>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="wallets">Wallets ({wallets.length})</TabsTrigger>
          <TabsTrigger value="vault">Vault ({vaultItems.length})</TabsTrigger>
          <TabsTrigger value="sync">Blockchain Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your personal data stored locally</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>First Name</Label>
                <Input
                  value={digitalID?.personalData.firstName || ""}
                  onChange={(e) =>
                    updateID({
                      personalData: { ...digitalID?.personalData, firstName: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={digitalID?.personalData.lastName || ""}
                  onChange={(e) =>
                    updateID({
                      personalData: { ...digitalID?.personalData, lastName: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={digitalID?.personalData.email || ""}
                  onChange={(e) =>
                    updateID({
                      personalData: { ...digitalID?.personalData, email: e.target.value },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallets" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Personal Wallets</CardTitle>
                <CardDescription>Wallets created with your Digital ID</CardDescription>
              </div>
              <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Wallet
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Wallet</DialogTitle>
                    <DialogDescription>Create a new wallet associated with your Digital ID</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Wallet Name</Label>
                      <Input
                        value={newWalletName}
                        onChange={(e) => setNewWalletName(e.target.value)}
                        placeholder="My Wallet"
                      />
                    </div>
                    <Button onClick={handleCreateWallet} className="w-full">
                      Create Wallet
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {wallets.map((wallet) => (
                  <Card key={wallet.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          <span className="font-medium">{wallet.name}</span>
                          {wallet.isPrimary && <Badge>Primary</Badge>}
                        </div>
                        <code className="text-sm text-muted-foreground">{wallet.address}</code>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const key = getPrivateKey(wallet.id);
                            if (key) {
                              navigator.clipboard.writeText(key);
                              toast.success("Private key copied");
                            }
                          }}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        {!wallet.isPrimary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPrimary(wallet.id)}
                          >
                            Set Primary
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => deleteWallet(wallet.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vault" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Personal Vault</CardTitle>
                <CardDescription>Encrypted storage for your sensitive data</CardDescription>
              </div>
              <Dialog open={showVaultDialog} onOpenChange={setShowVaultDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Vault Item</DialogTitle>
                    <DialogDescription>Store encrypted data in your personal vault</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={newItemType}
                        onValueChange={(value: any) => setNewItemType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="note">Note</SelectItem>
                          <SelectItem value="credential">Credential</SelectItem>
                          <SelectItem value="document">Document</SelectItem>
                          <SelectItem value="key">Key</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        placeholder="Item title"
                      />
                    </div>
                    <div>
                      <Label>Data</Label>
                      <Textarea
                        value={newItemData}
                        onChange={(e) => setNewItemData(e.target.value)}
                        placeholder="Enter data to encrypt and store"
                        rows={5}
                      />
                    </div>
                    <Button onClick={handleAddVaultItem} className="w-full">
                      Add to Vault
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {vaultItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.type}</Badge>
                          <span className="font-medium">{item.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.encryptedData.substring(0, 50)}...
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Sync</CardTitle>
              <CardDescription>
                Toggle blockchain sync to link your local Digital ID with on-chain identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {digitalID?.syncEnabled ? (
                <>
                  <p className="text-sm">
                    Sync is enabled. Your Digital ID is linked to:{" "}
                    <code className="bg-muted px-2 py-1 rounded">
                      {digitalID.syncAddress}
                    </code>
                  </p>
                  <Button variant="destructive" onClick={disableSync}>
                    Disable Sync
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Blockchain sync is disabled. Your data remains local only.
                  </p>
                  <Button onClick={() => enableSync()}>
                    Enable Blockchain Sync
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

