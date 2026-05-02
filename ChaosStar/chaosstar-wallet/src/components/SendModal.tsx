import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  ChevronDown,
  AlertCircle,
  Loader2,
  ArrowRight,
  Check,
} from 'lucide-react';
import { TokenType, TOKEN_INFO, type Wallet, formatAddress } from '../lib/crypto';
import { useWalletStore } from '../lib/store';
// import { createRPCClient } from '../lib/rpc';

interface SendModalProps {
  wallet: Wallet;
  balances: Record<TokenType, bigint>;
  onClose: () => void;
}

type Step = 'form' | 'confirm' | 'sending' | 'success' | 'error';

export function SendModal({ wallet, balances, onClose }: SendModalProps) {
  const { addTransaction } = useWalletStore();
  
  const [step, setStep] = useState<Step>('form');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenType, setTokenType] = useState<TokenType>(TokenType.XBGL);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const formatBalance = (balance: bigint): string => {
    return (Number(balance) / 1e9).toFixed(4);
  };

  const validateForm = (): boolean => {
    if (!recipient.trim()) {
      setError('Please enter a recipient address');
      return false;
    }
    if (!recipient.startsWith('0x')) {
      setError('Invalid address format');
      return false;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1e9));
    if (amountBigInt > balances[tokenType]) {
      setError('Insufficient balance');
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    setError(null);
    if (validateForm()) {
      setStep('confirm');
    }
  };

  const handleSend = async () => {
    setStep('sending');
    
    try {
      // Create transaction record
      const txId = `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      
      // Add pending transaction
      addTransaction({
        id: txId,
        type: 'send',
        tokenType,
        amount,
        from: wallet.address,
        to: recipient,
        timestamp: Date.now(),
        status: 'pending',
      });

      // Simulate sending (replace with actual HyperSDK transaction)
      // In a real implementation, you would use:
      // const rpc = createRPCClient(currentNetwork.rpcUrl);
      // In a real implementation, you would:
      // 1. Build the transaction
      // 2. Sign it with the private key
      // 3. Submit it via RPC
      
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Simulate success
      const hash = `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      setTxHash(hash);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
      setStep('error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal glass send-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="modal-header">
          <h2>
            {step === 'form' && 'Send'}
            {step === 'confirm' && 'Confirm Transaction'}
            {step === 'sending' && 'Sending...'}
            {step === 'success' && 'Success!'}
            {step === 'error' && 'Failed'}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {step === 'form' && (
            <>
              {error && (
                <div className="modal-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label>Recipient Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="full-width"
                />
              </div>

              <div className="form-group">
                <label>Token</label>
                <div className="token-selector" onClick={() => setShowTokenDropdown(!showTokenDropdown)}>
                  <div
                    className="selected-token"
                    style={{ '--token-color': TOKEN_INFO[tokenType].color } as React.CSSProperties}
                  >
                    <div className="token-icon small">
                      <span>{TOKEN_INFO[tokenType].symbol.charAt(0)}</span>
                    </div>
                    <span>{TOKEN_INFO[tokenType].name}</span>
                    <ChevronDown size={16} />
                  </div>
                  {showTokenDropdown && (
                    <div className="token-dropdown">
                      {Object.values(TokenType)
                        .filter((v): v is TokenType => typeof v === 'number')
                        .map((type) => (
                          <div
                            key={type}
                            className="token-option"
                            onClick={() => {
                              setTokenType(type);
                              setShowTokenDropdown(false);
                            }}
                            style={{ '--token-color': TOKEN_INFO[type].color } as React.CSSProperties}
                          >
                            <div className="token-icon small">
                              <span>{TOKEN_INFO[type].symbol.charAt(0)}</span>
                            </div>
                            <span>{TOKEN_INFO[type].name}</span>
                            <span className="token-balance-small">
                              {formatBalance(balances[type])}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>
                  Amount
                  <span className="balance-label">
                    Balance: {formatBalance(balances[tokenType])} {TOKEN_INFO[tokenType].symbol}
                  </span>
                </label>
                <div className="amount-input">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.0001"
                    min="0"
                  />
                  <button
                    className="max-btn"
                    onClick={() => setAmount(formatBalance(balances[tokenType]))}
                  >
                    MAX
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <div className="confirm-details">
              <div className="confirm-row">
                <span>From</span>
                <span className="address">{formatAddress(wallet.address, 8)}</span>
              </div>
              <div className="confirm-arrow">
                <ArrowRight size={20} />
              </div>
              <div className="confirm-row">
                <span>To</span>
                <span className="address">{formatAddress(recipient, 8)}</span>
              </div>
              <div className="confirm-amount">
                <span className="amount">{amount}</span>
                <span className="symbol">{TOKEN_INFO[tokenType].symbol}</span>
              </div>
              <div className="confirm-fee">
                <span>Network Fee</span>
                <span>~0.001 xBGL</span>
              </div>
            </div>
          )}

          {step === 'sending' && (
            <div className="sending-state">
              <Loader2 size={48} className="spinning" />
              <p>Sending transaction...</p>
              <span>Please wait while we process your transaction</span>
            </div>
          )}

          {step === 'success' && (
            <div className="success-state">
              <div className="success-icon">
                <Check size={32} />
              </div>
              <p>Transaction Sent!</p>
              <span>Your transaction has been submitted to the network</span>
              {txHash && (
                <div className="tx-hash">
                  <span>Transaction Hash</span>
                  <code>{formatAddress(txHash, 12)}</code>
                </div>
              )}
            </div>
          )}

          {step === 'error' && (
            <div className="error-state">
              <div className="error-icon">
                <AlertCircle size={32} />
              </div>
              <p>Transaction Failed</p>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 'form' && (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleContinue}>
                Continue
              </button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <button className="btn btn-secondary" onClick={() => setStep('form')}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleSend}>
                Confirm & Send
              </button>
            </>
          )}

          {(step === 'success' || step === 'error') && (
            <button className="btn btn-primary full-width" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

