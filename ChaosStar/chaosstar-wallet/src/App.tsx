import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Star,
  Settings,
  Globe,
  X,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useWalletStore } from './lib/store';
import { createRPCClient } from './lib/rpc';
import { WalletConnect, Dashboard } from './components';
import { type Wallet } from './lib/crypto';
import './App.css';

function App() {
  const {
    wallet,
    setWallet,
    currentNetwork,
    setCurrentNetwork,
    isConnected,
    setConnected,
    clearWallet,
  } = useWalletStore();

  const [showSettings, setShowSettings] = useState(false);
  const [tempRpcUrl, setTempRpcUrl] = useState(currentNetwork.rpcUrl);

  // Check connection on mount and network change
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const rpc = createRPCClient(currentNetwork.rpcUrl);
        const connected = await rpc.ping();
        setConnected(connected);
      } catch {
        setConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [currentNetwork.rpcUrl, setConnected]);

  const handleConnect = (newWallet: Wallet) => {
    setWallet(newWallet);
  };

  const handleSaveSettings = () => {
    setCurrentNetwork({
      ...currentNetwork,
      rpcUrl: tempRpcUrl,
    });
    setShowSettings(false);
  };

  const handleLogout = () => {
    clearWallet();
    setShowSettings(false);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Star className="logo-icon" />
            <span className="logo-text">ChaosStar</span>
            <span className="logo-badge">Wallet</span>
          </div>

          <div className="header-right">
            <div className={`connection-badge ${isConnected ? 'connected' : 'disconnected'}`}>
              <Globe size={14} />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>

            <button
              className="settings-btn"
              onClick={() => setShowSettings(true)}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          {!wallet ? (
            <motion.div
              key="connect"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <WalletConnect onConnect={handleConnect} />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Dashboard wallet={wallet} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="modal-overlay" onClick={() => setShowSettings(false)}>
            <motion.div
              className="modal glass settings-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="modal-header">
                <h2>Settings</h2>
                <button className="close-btn" onClick={() => setShowSettings(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="settings-section">
                  <h3>Network</h3>
                  <div className="form-group">
                    <label>Network Name</label>
                    <input
                      type="text"
                      value={currentNetwork.name}
                      disabled
                      className="disabled"
                    />
                  </div>
                  <div className="form-group">
                    <label>RPC Endpoint</label>
                    <input
                      type="text"
                      value={tempRpcUrl}
                      onChange={(e) => setTempRpcUrl(e.target.value)}
                      placeholder="http://..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Chain ID</label>
                    <input
                      type="text"
                      value={currentNetwork.chainId}
                      disabled
                      className="disabled"
                    />
                  </div>
                </div>

                <div className="settings-section">
                  <h3>About</h3>
                  <div className="about-info">
                    <p>ChaosStar Wallet v1.0.0</p>
                    <p className="muted">Built for HyperSDK chains</p>
                    <a
                      href="https://github.com/ava-labs/hypersdk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="about-link"
                    >
                      <ExternalLink size={14} />
                      HyperSDK Documentation
                    </a>
                  </div>
                </div>

                {wallet && (
                  <div className="settings-section danger">
                    <h3>Danger Zone</h3>
                    <button className="btn btn-danger" onClick={handleLogout}>
                      <Trash2 size={16} />
                      Logout & Clear Wallet
                    </button>
                    <p className="warning-text">
                      This will remove your wallet from this device. Make sure you have backed up your private key.
                    </p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveSettings}>
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
