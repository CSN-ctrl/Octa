/**
 * Script to fetch and display transactions using Alchemy
 */

import { getAllChainTransactions, SUPPORTED_CHAINS } from './src/lib/alchemy-service.ts';

// Use a well-known address for demonstration (Vitalik's address)
const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

console.log('Fetching transactions for address:', address);
console.log('Supported chains:', Object.keys(SUPPORTED_CHAINS).join(', '));
console.log('---\n');

try {
  const transactions = await getAllChainTransactions(address, {
    maxCount: 20, // Limit to 20 per chain
  });

  console.log(`\nTotal transactions found: ${transactions.length}\n`);

  if (transactions.length === 0) {
    console.log('No transactions found. This might be because:');
    console.log('1. The address has no transactions on supported chains');
    console.log('2. The Alchemy API key needs to be configured');
    console.log('3. Rate limits have been exceeded');
  } else {
    // Group by chain
    const byChain = transactions.reduce((acc, tx) => {
      if (!acc[tx.chain]) acc[tx.chain] = [];
      acc[tx.chain].push(tx);
      return acc;
    }, {});

    // Display transactions grouped by chain
    Object.entries(byChain).forEach(([chain, txs]) => {
      const chainConfig = SUPPORTED_CHAINS[chain];
      console.log(`\n${chainConfig?.displayName || chain} (${txs.length} transactions):`);
      console.log('─'.repeat(80));
      
      txs.slice(0, 10).forEach((tx, idx) => {
        const date = new Date(tx.timestamp);
        const direction = tx.direction === 'out' ? '→' : '←';
        const value = parseFloat(tx.value);
        const formattedValue = value > 0 ? value.toFixed(6) : '0';
        
        console.log(`${idx + 1}. [${tx.category.toUpperCase()}] ${direction} ${formattedValue} ${tx.asset || chainConfig?.nativeCurrency.symbol || 'ETH'}`);
        console.log(`   Hash: ${tx.hash}`);
        console.log(`   From: ${tx.from.slice(0, 10)}...${tx.from.slice(-8)}`);
        console.log(`   To: ${tx.to ? tx.to.slice(0, 10) + '...' + tx.to.slice(-8) : 'Contract Creation'}`);
        console.log(`   Block: ${tx.blockNumber} | ${date.toLocaleString()}`);
        console.log(`   Explorer: ${tx.explorerUrl}`);
        console.log('');
      });
      
      if (txs.length > 10) {
        console.log(`   ... and ${txs.length - 10} more transactions`);
      }
    });

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY:');
    console.log('='.repeat(80));
    Object.entries(byChain).forEach(([chain, txs]) => {
      const chainConfig = SUPPORTED_CHAINS[chain];
      const incoming = txs.filter(t => t.direction === 'in').length;
      const outgoing = txs.filter(t => t.direction === 'out').length;
      console.log(`${chainConfig?.displayName || chain}: ${txs.length} total (${incoming} in, ${outgoing} out)`);
    });
  }
} catch (error) {
  console.error('Error fetching transactions:', error.message);
  console.error('\nMake sure:');
  console.error('1. VITE_ALCHEMY_API_KEY is set in .env file');
  console.error('2. The API key is valid');
  console.error('3. You have internet connection');
}
