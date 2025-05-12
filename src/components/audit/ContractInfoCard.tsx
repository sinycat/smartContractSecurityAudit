import { formatEtherBalance, formatSupply } from '@/utils/format';
import { useRouter } from 'next/navigation';
import { getExplorerUrl } from '@/utils/chainServices';

interface ContractBasicInfo {
  exists: boolean;
  chainId?: bigint;
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: string;
  implementation?: string;
  isProxy?: boolean;
  proxyType?: string;
  contractType?: 'ERC20' | 'ERC721' | 'ERC1155' | 'Program' | 'Account' | 'Unknown';
  balance?: string;
  owner?: string;
  labels?: string[];
  projectName?: string;
}

interface ContractInfoCardProps {
  chainInfo: ContractBasicInfo;
  chain?: string;
  address?: string;
}

export default function ContractInfoCard({ chainInfo, chain, address }: ContractInfoCardProps) {
  const router = useRouter();

  const handleViewSource = () => {
    const params = new URLSearchParams({
      address: address || '',
      chain: chain || '',
      ...(chainInfo.implementation && { implementation: chainInfo.implementation }),
      ...(chainInfo.name && { tokenName: chainInfo.name })
    });
    window.open(`/audit/source?${params.toString()}`, '_blank');
  };

  const isSolanaChain = chain && chain.toLowerCase() === 'solana';

  return (
    <div className="bg-[#1E1E1E] rounded-lg overflow-hidden mb-6 
                   border border-[#333333] hover:border-[#2DD4BF]/30 
                   transition-colors relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-[#2DD4BF]/0 via-[#2DD4BF]/5 to-[#2DD4BF]/0 
                     opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center justify-between px-6 py-4 bg-[#1E1E1E] border-b border-[#333333]">
          <div className="flex items-center gap-3">
            <span className="text-[#E5E5E5] font-medium text-lg capitalize">{chain}</span>
            <span className="text-sm text-gray-400">
              Chain ID: {chainInfo.chainId?.toString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {chainInfo.projectName && (
              <span className="px-2 py-1 text-xs font-medium text-[#2DD4BF] bg-[#2DD4BF]/10 rounded">
                {chainInfo.projectName}
              </span>
            )}
            {chainInfo.labels?.map((label, index) => (
              <span key={index} className="px-2 py-1 text-xs font-medium text-[#4EC9B0] bg-[#4EC9B0]/10 rounded">
                {label}
              </span>
            ))}
            {!chainInfo.projectName && (!chainInfo.labels?.length) && chainInfo.contractType && (
              <span className="px-2 py-1 text-xs font-medium text-[#2DD4BF] bg-[#2DD4BF]/10 rounded">
                {chainInfo.contractType}
              </span>
            )}
            {chainInfo.isProxy && chain && address && (
              <a
                href={`${getExplorerUrl(chain, chainInfo.implementation!)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#2DD4BF] bg-[#2DD4BF]/10 rounded hover:bg-[#2DD4BF]/20 transition-colors"
              >
                <span>Proxy Contract</span>
                <span className="text-[#2DD4BF]/60 font-mono">
                  ({chainInfo.implementation?.slice(0, 6)}...{chainInfo.implementation?.slice(-4)})
                </span>
                <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 gap-6">
          {chainInfo.name && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Name</label>
              <div className="text-[#E5E5E5] font-medium">{chainInfo.name}</div>
            </div>
          )}
          {chainInfo.symbol && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Symbol</label>
              <div className="text-[#E5E5E5] font-medium">{chainInfo.symbol}</div>
            </div>
          )}
          {chainInfo.decimals !== undefined && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Decimals</label>
              <div className="text-[#E5E5E5] font-medium">{chainInfo.decimals}</div>
            </div>
          )}
          {chainInfo.totalSupply && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Total Supply</label>
              <div className="text-[#E5E5E5] font-medium font-mono">
                {formatSupply(chainInfo.totalSupply, chainInfo.decimals)} {chainInfo.symbol}
              </div>
            </div>
          )}
          {chainInfo.balance && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Contract Balance</label>
              <div className="text-[#E5E5E5] font-medium font-mono">
                {formatEtherBalance(chainInfo.balance)} {isSolanaChain ? 'SOL' : 'ETH'}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#333333] flex items-center justify-end gap-3">
          {chain && address && (
            <a
              href={getExplorerUrl(chain, address)}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 inline-flex items-center gap-2 px-5
                       bg-[#1E1E1E] text-[#CCCCCC] text-base
                       border border-[#333333] rounded-lg
                       transition-all duration-300
                       hover:bg-[#252525]"
            >
              View on Explorer
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}

          <button
            onClick={handleViewSource}
            className="h-11 inline-flex items-center gap-2 px-5
                     bg-[#1E1E1E] text-[#2DD4BF] text-base
                     border border-[#333333] rounded-lg
                     transition-all duration-300
                     hover:bg-[#2DD4BF]/10 hover:border-[#2DD4BF]/50
                     cursor-pointer"
          >
            View Source →
          </button>
        </div>
      </div>
    </div>
  );
} 