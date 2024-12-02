"use client";

import { useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { checkContractOnChains } from '@/utils/blockchain';
import { getRpcUrl } from '@/utils/chainServices';
import type { ChainContractInfo } from '@/types/blockchain';
import ContractInfoCard from '@/components/audit/ContractInfoCard';
import Image from 'next/image';
import Link from 'next/link';
import { 
  FileIcon, 
  FilesIcon, 
  WalletIcon, 
  SecurityIcon,
  SecurityAnalysisIcon,
  MultiChainIcon,
  CodeIcon,
  AIIcon
} from '@/components/Icons';

type TabType = 'address' | 'single-file' | 'multi-files';

export default function AuditPage() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [chainInfo, setChainInfo] = useState<ChainContractInfo | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('address');

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.trim();
    
    if (value && !value.startsWith('0x')) {
      value = '0x' + value;
    }
    
    setAddress(value);
  };

  const handleCheck = async () => {
    let formattedAddress = address.trim();
    if (formattedAddress && !formattedAddress.startsWith('0x')) {
      formattedAddress = '0x' + formattedAddress;
    }

    if (!ethers.isAddress(formattedAddress)) {
      toast.error('Invalid contract address');
      return;
    }

    try {
      setLoading(true);
      setChainInfo(null);
      const info = await checkContractOnChains(formattedAddress);
      setChainInfo(info);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch contract information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="absolute top-4 right-4 text-gray-400">
        The ticker is ETH
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-bold text-[#E5E5E5] mb-4">
            Smart Contract <span className="text-[#FF8B3E]">Security</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Powered by AI, securing your blockchain future with real-time analysis
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <p className="text-gray-400 text-center mb-6">
            Choose your preferred method to analyze smart contracts
          </p>

          <div className="bg-gradient-to-r from-[#1E1E1E] via-[#252526] to-[#1E1E1E] p-1 rounded-xl">
            <div className="bg-[#1A1A1A]/60 rounded-lg p-1 flex gap-1">
              {[
                { id: 'address', label: 'Address', icon: WalletIcon, desc: 'Analyze deployed contracts' },
                { id: 'single-file', label: 'Single File', icon: FileIcon, desc: 'Audit a single contract file' },
                { id: 'multi-files', label: 'Multi Files', icon: FilesIcon, desc: 'Analyze multiple contract files' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`
                    flex-1 py-3 px-4 rounded-lg
                    transition-all duration-300 ease-out
                    group hover:bg-[#252526]
                    ${activeTab === tab.id 
                      ? 'bg-[#252526] shadow-lg' 
                      : 'hover:bg-[#252526]/50'}
                  `}
                >
                  <div className="flex flex-col items-center gap-2">
                    <tab.icon 
                      className={`w-6 h-6 transition-colors duration-300
                        ${activeTab === tab.id 
                          ? 'text-[#FF8B3E]' 
                          : 'text-gray-400 group-hover:text-gray-300'}`} 
                    />
                    <span className={`font-medium transition-colors duration-300
                      ${activeTab === tab.id 
                        ? 'text-[#FF8B3E]' 
                        : 'text-gray-400 group-hover:text-gray-300'}`}>
                      {tab.label}
                    </span>
                    <span className="text-xs text-gray-500 group-hover:text-gray-400">
                      {tab.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>


        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252526] rounded-xl p-8 mb-8 border border-[#333333]/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-mush-orange/0 via-mush-orange/30 to-mush-orange/0" />
          
          <div className="mb-6">
            <h2 className="text-2xl font-medium text-white mb-2">
              {activeTab === 'address' && 'Enter Contract Address'}
              {activeTab === 'single-file' && 'Upload Contract File'}
              {activeTab === 'multi-files' && 'Upload Contract Files'}
            </h2>
            <p className="text-gray-400">
              {activeTab === 'address' && 'Enter the deployed contract address to start analysis'}
              {activeTab === 'single-file' && 'Upload a single Solidity contract file (.sol)'}
              {activeTab === 'multi-files' && 'Upload multiple related contract files'}
            </p>
          </div>
          
          {activeTab === 'address' && (
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={address}
                onChange={handleAddressChange}
                placeholder="Enter contract address (0x...)"
                className="flex-1 h-11 bg-[#1A1A1A] border border-[#333333] rounded-lg px-4
                         text-[#E5E5E5] placeholder-gray-500 
                         focus:outline-none focus:border-[#505050]
                         hover:border-[#404040]
                         focus:ring-1 focus:ring-[#505050]
                         transition-[border,box-shadow]
                         duration-200 ease-in-out text-base"
              />
              <button
                onClick={handleCheck}
                disabled={loading}
                className="h-11 inline-flex items-center gap-2 px-5
                         bg-[#1E1E1E] text-mush-orange text-base font-normal
                         border border-[#333333] rounded-lg
                         transition-all duration-300
                         hover:bg-mush-orange/10 hover:border-mush-orange/50
                         whitespace-nowrap
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <span>Check Contract</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'single-file' && (
            <div className="flex flex-col gap-3">
              <textarea
                placeholder="// Paste your Solidity contract code here..."
                className="w-full h-64 bg-[#1A1A1A] border border-[#333333] rounded-lg px-4 py-3
                         text-[#E5E5E5] placeholder-gray-500 
                         focus:outline-none focus:border-[#505050]
                         hover:border-[#404040]
                         focus:ring-1 focus:ring-[#505050]
                         transition-[border,box-shadow]
                         duration-200 ease-in-out
                         font-mono text-sm
                         resize-y"
              />
              <button
                className="self-end h-11 inline-flex items-center gap-2 px-5
                         bg-[#1E1E1E] text-mush-orange text-base font-normal
                         border border-[#333333] rounded-lg
                         transition-all duration-300
                         hover:bg-mush-orange/10 hover:border-mush-orange/50
                         whitespace-nowrap"
              >
                <span>Analyze Contract</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {activeTab === 'multi-files' && (
            <div className="flex flex-col gap-4">
              <div className="border border-dashed border-[#333333] rounded-lg p-8 bg-[#1A1A1A] hover:border-[#505050] transition-colors duration-200">
                <div className="flex flex-col items-center gap-3">
                  <FilesIcon className="w-12 h-12 text-gray-500" />
                  <div className="text-center">
                    <p className="text-gray-300 mb-1">Drag and drop your contract files here</p>
                    <p className="text-gray-500 text-sm">or</p>
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept=".sol"
                      className="hidden"
                    />
                    <span className="h-9 inline-flex items-center gap-2 px-4
                                  bg-[#1E1E1E] text-mush-orange text-sm font-normal
                                  border border-[#333333] rounded-lg
                                  transition-all duration-300
                                  hover:bg-mush-orange/10 hover:border-mush-orange/50
                                  cursor-pointer">
                      Browse Files
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="text-sm text-gray-400">Selected files:</div>
                <div className="space-y-2">
                  {/* 这里可以添加已选文件列表的状态和渲染 */}
                  <div className="flex items-center justify-between p-3 bg-[#1A1A1A] border border-[#333333] rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">Token.sol</span>
                    </div>
                    <button className="text-gray-500 hover:text-gray-300">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <button
                className="self-end h-11 inline-flex items-center gap-2 px-5
                         bg-[#1E1E1E] text-mush-orange text-base font-normal
                         border border-[#333333] rounded-lg
                         transition-all duration-300
                         hover:bg-mush-orange/10 hover:border-mush-orange/50
                         whitespace-nowrap"
              >
                <span>Analyze Contracts</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {activeTab === 'address' && chainInfo && Object.entries(chainInfo).map(([chain, info]) => (
          info?.exists && (
            <ContractInfoCard 
              key={chain} 
              chainInfo={info} 
              chain={chain} 
              address={address}
            />
          )
        ))}
      </main>

      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-mush-orange/0 via-mush-orange/30 to-mush-orange/0" />
    </div>
  );
} 