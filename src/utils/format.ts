// Client formatting tool
import { ethers } from 'ethers';

export function formatEtherBalance(balance: string): string {
  try {
    // 检查是否已经是小数格式（Solana余额可能已经是小数形式）
    if (balance.includes('.')) {
      // 已经是小数，直接格式化
      const num = parseFloat(balance);
      return num.toFixed(num < 0.0001 ? 8 : 4);
    }
    
    // 否则作为以太坊/EVM余额处理
    const num = ethers.formatEther(balance);
    const value = parseFloat(num);
    return value.toFixed(value < 0.0001 ? 8 : 4);
  } catch (e) {
    console.error('Error formatting ether balance:', e);
    return balance;
  }
}

export function formatSupply(supply: string, decimals: number = 18): string {
  try {
    const formatted = ethers.formatUnits(supply, decimals);
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(parseFloat(formatted));
  } catch (error) {
    console.error('Error formatting supply:', error);
    return '0';
  }
} 