import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Check,
  RefreshCw,
  Send,
  ArrowDownLeft,
  Clock,
  Zap,
  Globe,
  ChevronDown,
  ExternalLink,
  MoreVertical,
} from 'lucide-react';
import { useWalletStore, type Transaction } from '../lib/store';
import { formatAddress, TokenType, TOKEN_INFO, type Wallet } from '../lib/crypto';
import { createRPCClient } from '../lib/rpc';
import { SendModal } from './SendModal';
import { ReceiveModal } from './ReceiveModal';

interface DashboardProps {
  wallet: Wallet;
}

export function Dashboard({ wallet }: DashboardProps) {
  const {
    balances,
    setBalances,
    currentNetwork,
    isConnected,
    setConnected,
    transactions,
    isLoading,
    setLoading,
  } = useWalletStore();

  const [copied, setCopied] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [activeTab, setActiveTab] = useState<'tokens' | 'activity' | 'nfts'>('tokens');

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const refreshBalances = useCallback(async () => {
    setLoading(true);
    try {
      const rpc = createRPCClient(currentNetwork.rpcUrl);
      const isUp = await rpc.ping();
      setConnected(isUp);
      
      if (isUp) {
        const newBalances = await rpc.getAllBalances(wallet.address);
        setBalances(newBalances);
      }
    } catch {
      setConnected(false);
    }
    setLoading(false);
  }, [wallet.address, currentNetwork.rpcUrl, setBalances, setConnected, setLoading]);

  useEffect(() => {
    refreshBalances();
    const interval = setInterval(refreshBalances, 15000);
    return () => clearInterval(interval);
  }, [refreshBalances]);

  const formatBalance = (balance: bigint, decimals = 9): string => {
    const num = Number(balance) / Math.pow(10, decimals);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  const totalValueUSD = 0; // Placeholder - would integrate price feeds

  return (
    <div className="dashboard">
      {/* Account Card */}
      <motion.div
        className="account-card glass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="account-header">
          <div className="account-avatar">
            <div className="avatar-gradient" />
          </div>
          <div className="account-info">
            <span className="account-label">Account 1</span>
            <button className="address-btn" onClick={copyAddress}>
              <span>{formatAddress(wallet.address, 8)}</span>
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <div className="account-actions">
            <button className="icon-btn" onClick={refreshBalances} disabled={isLoading}>
              <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
            </button>
            <button className="icon-btn">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        <div className="account-balance">
          <span className="balance-label">Total Balance</span>
          <div className="balance-value">
            <span className="balance-main">
              {formatBalance(balances[TokenType.XBGL])}
            </span>
            <span className="balance-symbol">xBGL</span>
          </div>
          {totalValueUSD > 0 && (
            <span className="balance-usd">${totalValueUSD.toFixed(2)} USD</span>
          )}
        </div>

        <div className="quick-actions">
          <button className="action-btn send" onClick={() => setShowSend(true)}>
            <Send size={20} />
            <span>Send</span>
          </button>
          <button className="action-btn receive" onClick={() => setShowReceive(true)}>
            <ArrowDownLeft size={20} />
            <span>Receive</span>
          </button>
          <button className="action-btn swap">
            <Zap size={20} />
            <span>Swap</span>
          </button>
        </div>
      </motion.div>

      {/* Network Status */}
      <motion.div
        className="network-status glass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          <Globe size={14} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div className="network-name">
          <span>{currentNetwork.name}</span>
          <ChevronDown size={14} />
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="tab-nav">
        {(['tokens', 'activity', 'nfts'] as const).map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'tokens' && (
          <motion.div
            key="tokens"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="token-list"
          >
            {Object.values(TokenType)
              .filter((v): v is TokenType => typeof v === 'number')
              .map((tokenType, index) => (
                <motion.div
                  key={tokenType}
                  className="token-item glass"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{ '--token-color': TOKEN_INFO[tokenType].color } as React.CSSProperties}
                >
                  <div className="token-icon">
                    <span>{TOKEN_INFO[tokenType].symbol.charAt(0)}</span>
                  </div>
                  <div className="token-details">
                    <span className="token-name">{TOKEN_INFO[tokenType].name}</span>
                    <span className="token-network">ChaosStar Network</span>
                  </div>
                  <div className="token-balance">
                    <span className="balance-amount">
                      {formatBalance(balances[tokenType])}
                    </span>
                    <span className="balance-symbol">{TOKEN_INFO[tokenType].symbol}</span>
                  </div>
                </motion.div>
              ))}
          </motion.div>
        )}

        {activeTab === 'activity' && (
          <motion.div
            key="activity"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="activity-list"
          >
            {transactions.length === 0 ? (
              <div className="empty-state">
                <Clock size={48} />
                <p>No transactions yet</p>
                <span>Your transaction history will appear here</span>
              </div>
            ) : (
              transactions.map((tx, index) => (
                <TransactionItem key={tx.id} tx={tx} index={index} />
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'nfts' && (
          <motion.div
            key="nfts"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="nft-grid"
          >
            <div className="empty-state">
              <span className="nft-emoji">🖼️</span>
              <p>No NFTs yet</p>
              <span>Your collectibles will appear here</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {showSend && (
        <SendModal
          wallet={wallet}
          balances={balances}
          onClose={() => setShowSend(false)}
        />
      )}

      {showReceive && (
        <ReceiveModal
          address={wallet.address}
          onClose={() => setShowReceive(false)}
        />
      )}
    </div>
  );
}

function TransactionItem({ tx, index }: { tx: Transaction; index: number }) {
  const isSend = tx.type === 'send';
  const tokenInfo = TOKEN_INFO[tx.tokenType];

  return (
    <motion.div
      className="tx-item glass"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div className={`tx-icon ${tx.type}`}>
        {isSend ? <Send size={16} /> : <ArrowDownLeft size={16} />}
      </div>
      <div className="tx-details">
        <span className="tx-type">{isSend ? 'Sent' : 'Received'}</span>
        <span className="tx-address">
          {isSend ? `To: ${formatAddress(tx.to, 6)}` : `From: ${formatAddress(tx.from, 6)}`}
        </span>
      </div>
      <div className="tx-amount">
        <span className={isSend ? 'negative' : 'positive'}>
          {isSend ? '-' : '+'}{tx.amount}
        </span>
        <span className="tx-symbol">{tokenInfo.symbol}</span>
      </div>
      <div className={`tx-status ${tx.status}`}>
        {tx.status === 'pending' && <Clock size={12} />}
        {tx.status === 'confirmed' && <Check size={12} />}
        <span>{tx.status}</span>
      </div>
      {tx.hash && (
        <a className="tx-link" href="#" target="_blank" rel="noopener noreferrer">
          <ExternalLink size={14} />
        </a>
      )}
    </motion.div>
  );
}

