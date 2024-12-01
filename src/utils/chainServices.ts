import { CHAINS } from './constants';

// Get chainId function
export function getChainId(chain: string): string | undefined {
  const chainConfig = CHAINS[chain.toLowerCase()];
  if (!chainConfig) return undefined;
  return chainConfig.id;
}

// Get RPC URL
export function getRpcUrl(chain: string): string {
  const chainConfig = CHAINS[chain.toLowerCase()];
  if (!chainConfig) throw new Error(`Unsupported chain: ${chain}`);
  return chainConfig.rpcUrls.default;
}

// Get API Scan configuration
export function getApiScanConfig(chain: string): { url: string; apiKey: string } {
  const chainConfig = CHAINS[chain.toLowerCase()];
  if (!chainConfig) throw new Error(`Unsupported chain: ${chain}`);
  return {
    url: chainConfig.blockExplorers.default.apiUrl,
    apiKey: chainConfig.blockExplorers.default.apiKey || '',
  };
}

// Get block explorer URL
export function getExplorerUrl(chain: string, address: string): string {
  const chainConfig = CHAINS[chain.toLowerCase()];
  if (!chainConfig) return '#';
  return `${chainConfig.blockExplorers.default.url}/address/${address}`;
} 

// Get block explorer URL for tokens
export function getExplorerTokenUrl(chain: string, address: string): string {
  const chainConfig = CHAINS[chain.toLowerCase()];
  if (!chainConfig) return '#';
  return `${chainConfig.blockExplorers.default.url}/token/${address}`;
} 
