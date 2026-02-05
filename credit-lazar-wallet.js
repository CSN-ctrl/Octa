/**
 * Script to check and credit Lazar Bundev's wallet
 * Wallet: 0x32ee1293cdd2a5ef97504ef4b97d988e83856542
 */

import { getAllChainTransactions } from './src/lib/alchemy-service.ts';
import { convertWithDetails } from './src/lib/currency-converter.ts';
import { updateRatesFromAPI } from './src/lib/currency-converter.ts';

const LAZAR_WALLET = '0x32ee1293cdd2a5ef97504ef4b97d988e83856542';
const TREASURY_WALLET = '0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33';

async function checkAndCreditLazarWallet() {
  console.log(`Checking transactions for Lazar Bundev's wallet: ${LAZAR_WALLET}`);
  
  // Update exchange rates
  await updateRatesFromAPI();
  
  // Fetch all transactions for this wallet
  const transactions = await getAllChainTransactions(LAZAR_WALLET, {
    maxCount: 100,
    category: ['external', 'erc20', 'erc721', 'erc1155'],
  });
  
  console.log(`Found ${transactions.length} total transactions`);
  
  // Filter for incoming transactions to treasury
  const incomingToTreasury = transactions.filter(tx => 
    tx.to?.toLowerCase() === TREASURY_WALLET.toLowerCase()
  );
  
  console.log(`Found ${incomingToTreasury.length} incoming transactions to treasury`);
  
  if (incomingToTreasury.length === 0) {
    console.log('No deposits found to treasury from this wallet');
    return;
  }
  
  // Process each deposit
  for (const tx of incomingToTreasury) {
    console.log(`\nProcessing transaction: ${tx.hash}`);
    console.log(`  From: ${tx.from}`);
    console.log(`  To: ${tx.to}`);
    console.log(`  Value: ${tx.value}`);
    console.log(`  Asset: ${tx.asset || 'Native'}`);
    
    // Determine token type
    let tokenType = 'ETH';
    if (tx.asset) {
      const assetLower = tx.asset.toLowerCase();
      if (assetLower.includes('usdc') || assetLower.includes('usd coin')) {
        tokenType = 'USDC';
      } else if (assetLower.includes('usdt')) {
        tokenType = 'USDT';
      } else {
        tokenType = tx.asset;
      }
    }
    
    const amount = parseFloat(tx.value || '0');
    if (amount > 0) {
      const conversion = convertWithDetails(amount, tokenType);
      console.log(`  Conversion: ${amount} ${tokenType} → ${conversion.eurAmount.toFixed(2)} EUR → ${conversion.xbglAmount.toFixed(6)} xBGL`);
    }
  }
}

checkAndCreditLazarWallet().catch(console.error);
