import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Check, QrCode } from 'lucide-react';

interface ReceiveModalProps {
  address: string;
  onClose: () => void;
}

export function ReceiveModal({ address, onClose }: ReceiveModalProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal glass receive-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="modal-header">
          <h2>Receive</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body receive-body">
          <div className="qr-container">
            <div className="qr-placeholder">
              <QrCode size={120} />
              <span>QR Code</span>
            </div>
          </div>

          <div className="address-display">
            <label>Your Wallet Address</label>
            <div className="address-box">
              <code>{address}</code>
            </div>
          </div>

          <button className="btn btn-primary full-width" onClick={copyAddress}>
            {copied ? (
              <>
                <Check size={18} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={18} />
                Copy Address
              </>
            )}
          </button>

          <p className="receive-info">
            Send only <strong>xBGL</strong>, <strong>CHAOS</strong>, or <strong>XEN</strong> tokens to this address.
            Sending other tokens may result in permanent loss.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

