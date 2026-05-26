import React, { memo } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { displayTokenSymbol } from "@/lib/game-currency";

interface TransactionItemProps {
  transaction: {
    id?: string;
    type?: string;
    transaction_type?: string;
    from_address?: string;
    to_address?: string;
    amount?: string | number;
    token_type?: string;
    plot_id?: number;
    tx_hash?: string;
    created_at?: string;
    metadata?: Record<string, unknown>;
  };
}

export const TransactionItem = memo(function TransactionItem({ transaction }: TransactionItemProps) {
  const txType = transaction.type || transaction.transaction_type || 'transaction';
  const metadata = transaction.metadata as Record<string, unknown> | undefined;
  const fromAddress = (transaction.from_address || '').toLowerCase();
  const treasuryAddress = '0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33';
  const isFromTreasury = fromAddress === treasuryAddress ||
                        fromAddress === treasuryAddress.toLowerCase() ||
                        metadata?.source === 'treasury' ||
                        metadata?.direction === 'from_treasury';
  
  const isOutgoing = txType === 'plot_purchase' || 
                    txType === 'purchase' || 
                    (txType === 'transfer' && !isFromTreasury);
  const isIncoming = (txType === 'deposit' && isFromTreasury) ||
                   txType === 'mint' || 
                   (txType === 'transfer' && isFromTreasury);
  
  let displayType = 'Transaction';
  if (txType === 'plot_purchase') {
    displayType = 'Plot Purchase';
  } else if (txType === 'purchase') {
    displayType = 'Purchase';
  } else if (isFromTreasury) {
    displayType = 'Treasury Transfer';
  } else if (txType === 'transfer') {
    displayType = 'Transfer';
  } else if (txType === 'deposit') {
    displayType = 'Deposit';
  } else {
    displayType = txType || 'Transaction';
  }
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3">
        {isIncoming ? (
          <ArrowDownRight className="h-4 w-4 text-green-500" aria-hidden="true" />
        ) : (
          <ArrowUpRight className="h-4 w-4 text-red-500" aria-hidden="true" />
        )}
        <div>
          <div className="font-medium">{displayType}</div>
          <div className="text-xs text-muted-foreground">
            {transaction.plot_id ? `Plot #${transaction.plot_id} • ` : ''}
            {transaction.tx_hash ? `${transaction.tx_hash.slice(0, 10)}...${transaction.tx_hash.slice(-8)}` : 'No hash'}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`font-semibold ${isIncoming ? 'text-green-500' : 'text-red-500'}`}>
          {transaction.amount
            ? `${isOutgoing ? "-" : isIncoming ? "+" : ""}${Number(transaction.amount).toFixed(2)} ${displayTokenSymbol(transaction.token_type)}`
            : "-"}
        </div>
        <div className="text-xs text-muted-foreground">
          {transaction.created_at
            ? new Date(transaction.created_at).toLocaleDateString()
            : ''}
        </div>
      </div>
    </div>
  );
});


