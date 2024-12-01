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

export default function AuditPage() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [chainInfo, setChainInfo] = useState<ChainContractInfo | null>(null);

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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-[#E5E5E5] mb-4">
            Smart Contract <span className="text-[#FF8B3E]">Security</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Powered by AI, securing your blockchain future with real-time analysis
          </p>
        </div>

        <div className="bg-[#1E1E1E] rounded-lg p-6 mb-8 
                    border border-[#333333] shadow-lg
                    relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-mush-orange/0 via-mush-orange/50 to-mush-orange/0" />
          <div className="flex items-center gap-3">
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
        </div>

        {chainInfo && Object.entries(chainInfo).map(([chain, info]) => (
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

      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-mush-orange/0 via-mush-orange/50 to-mush-orange/0" />
    </div>
  );
} 