export interface ContractBasicInfo {
  exists: boolean;
  chainId?: bigint;
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: string;
  implementation?: string;
  isProxy?: boolean;
  proxyType?: string;
  contractType?: 'ERC20' | 'ERC721' | 'ERC1155' | 'Unknown';
  
  // Add missing fields
  balance?: string;
  owner?: string;
  labels?: string[];
  projectName?: string;
}

export interface ChainContractInfo {
  ethereum?: ContractBasicInfo;
  arbitrum?: ContractBasicInfo;
  bsc?: ContractBasicInfo;
}

export interface ContractFile {
  name: string;
  content: string;
  path: string;
} 