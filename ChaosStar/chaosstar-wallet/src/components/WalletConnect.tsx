import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Plus,
  Import,
  Key,
  Shield,
  ChevronRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { generateWallet, importWallet, type Wallet as WalletType } from '../lib/crypto';
import { useWalletStore } from '../lib/store';

interface WalletConnectProps {
  onConnect: (wallet: WalletType) => void;
}

type Step = 'choose' | 'create' | 'import' | 'backup';

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const [step, setStep] = useState<Step>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newWallet, setNewWallet] = useState<WalletType | null>(null);
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const { setWallet } = useWalletStore();

  const handleCreateWallet = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Creating wallet...');
      const wallet = await generateWallet();
      console.log('Wallet created:', wallet.address);
      setNewWallet(wallet);
      setStep('backup');
    } catch (err) {
      console.error('Failed to create wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    }
    setLoading(false);
  };

  const handleImportWallet = async () => {
    if (!privateKeyInput.trim()) {
      setError('Please enter a private key');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const wallet = await importWallet(privateKeyInput.trim());
      setWallet(wallet);
      onConnect(wallet);
    } catch (err) {
      setError('Invalid private key format');
    }
    setLoading(false);
  };

  const handleConfirmBackup = () => {
    if (newWallet && confirmed) {
      setWallet(newWallet);
      onConnect(newWallet);
    }
  };

  return (
    <div className="wallet-connect">
      <AnimatePresence mode="wait">
        {step === 'choose' && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="connect-panel glass"
          >
            <div className="panel-header">
              <div className="icon-circle">
                <Shield size={48} />
              </div>
              <h1>Connect to ChaosStar</h1>
              <p>Create a new wallet or import an existing one</p>
            </div>

            <div className="connect-options">
              <button
                className="connect-option"
                onClick={handleCreateWallet}
                disabled={loading}
                type="button"
              >
                <div className="option-icon create">
                  {loading ? <Loader2 size={24} className="spinning" /> : <Plus size={24} />}
                </div>
                <div className="option-info">
                  <span className="option-title">
                    {loading ? 'Creating...' : 'Create New Wallet'}
                  </span>
                  <span className="option-desc">Generate a new ED25519 keypair</span>
                </div>
                {!loading && <ChevronRight size={20} />}
              </button>

              <button
                className="connect-option"
                onClick={() => setStep('import')}
              >
                <div className="option-icon import">
                  <Import size={24} />
                </div>
                <div className="option-info">
                  <span className="option-title">Import Wallet</span>
                  <span className="option-desc">Use an existing private key</span>
                </div>
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="connect-info">
              <div className="info-item">
                <Key size={16} />
                <span>Your keys never leave your device</span>
              </div>
              <div className="info-item">
                <Shield size={16} />
                <span>Secure ED25519 cryptography</span>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'import' && (
          <motion.div
            key="import"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="connect-panel glass"
          >
            <div className="panel-header">
              <div className="icon-circle import">
                <Import size={48} />
              </div>
              <h1>Import Wallet</h1>
              <p>Enter your private key to restore your wallet</p>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="import-form">
              <label>
                <span>Private Key</span>
                <div className="input-wrapper">
                  <input
                    type={showPrivateKey ? 'text' : 'password'}
                    placeholder="Enter your private key..."
                    value={privateKeyInput}
                    onChange={(e) => setPrivateKeyInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    {showPrivateKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <div className="warning-box">
                <AlertCircle size={16} />
                <span>Never share your private key with anyone</span>
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn btn-secondary" onClick={() => setStep('choose')}>
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleImportWallet}
                disabled={loading || !privateKeyInput.trim()}
              >
                {loading ? <Loader2 className="spinning" size={18} /> : null}
                Import Wallet
              </button>
            </div>
          </motion.div>
        )}

        {step === 'backup' && newWallet && (
          <motion.div
            key="backup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="connect-panel glass"
          >
            <div className="panel-header">
              <div className="icon-circle warning">
                <Key size={48} />
              </div>
              <h1>Backup Your Keys</h1>
              <p>Save these keys in a secure location</p>
            </div>

            <div className="backup-keys">
              <div className="key-display">
                <label>Public Key</label>
                <code>{newWallet.publicKey}</code>
              </div>

              <div className="key-display warning">
                <label>
                  Private Key
                  <span className="warning-badge">Keep Secret!</span>
                </label>
                <div className="secret-key">
                  <code>
                    {showPrivateKey
                      ? newWallet.privateKey
                      : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    {showPrivateKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="key-display">
                <label>Wallet Address</label>
                <code className="address">{newWallet.address}</code>
              </div>
            </div>

            <div className="backup-confirm">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span>I have securely backed up my private key</span>
              </label>
            </div>

            <div className="panel-actions">
              <button className="btn btn-secondary" onClick={() => setStep('choose')}>
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmBackup}
                disabled={!confirmed}
              >
                <Wallet size={18} />
                Access Wallet
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

