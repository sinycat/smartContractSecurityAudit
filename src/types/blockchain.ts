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

export interface Analysis {
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
  contractInfo: any;
  analysis: string;
  recommendations: string[];
}

export interface AnalysisResult {
  filteredFiles: ContractFile[];
  vulnerabilities: any[];
  optimizations: any[];
  report: {
    analysis: string;
    [key: string]: any;
  };
} 