"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import SourcePreview from "@/components/audit/SourcePreview";
import type { ContractFile } from "@/types/blockchain";
import Image from "next/image";
import { getChainId } from "@/utils/chainServices";
import { fetchCreationCodeFromExplorer } from "@/utils/blockchain";

interface ContractSource {
  files: ContractFile[];
  settings: any;
  contractName: string;
  compiler: string;
  optimization: boolean;
  runs: number;
  implementationAddress?: string;
  implementationInfo?: {
    contractName: string;
    compiler: string;
    optimization: boolean;
    runs: number;
    evmVersion: string;
    creator?: string;
    creationTxHash?: string;
  };
  creationCode?: string;
  deployedBytecode?: string;
  creator?: string;
  creationTxHash?: string;
  abi?: any[];
  implementationAbi?: any[];
}

function SourceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sourceData, setSourceData] = useState<ContractSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const address = searchParams.get("address");
  const chain = searchParams.get("chain");
  const implementation = searchParams.get("implementation");
  const tokenName = searchParams.get("tokenName");

  const chainId = chain ? getChainId(chain) : undefined;

  const handleAnalyze = async () => {
    if (!sourceData || !sourceData.files || sourceData.files.length === 0) {
      toast.error("No source code available to analyze");
      return;
    }
    
    // 检查是否为测试/模拟合约
    const isTestContract = sourceData.files.some(
      file => file.name === 'TestContract.sol' || file.path === 'TestContract.sol'
    );
    
    if (isTestContract) {
      toast.error("Cannot analyze test contract. This is a mock contract created for display purposes.");
      return;
    }
    
    setAnalyzing(true);
    try {
      // 处理合约代码分析的逻辑
    } catch (error) {
      console.error("Error analyzing source code:", error);
      toast.error("Failed to analyze source code");
    } finally {
      setAnalyzing(false);
    }
  };

  // 使用handleAnalyze替换原有的handleStartAnalysis
  const handleStartAnalysis = handleAnalyze;

  useEffect(() => {
    const fetchSource = async () => {
      if (!address || !chain) {
        toast.error("Missing address or chain");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/source?address=${address}&chain=${chain}`
        );
        
        if (!response.ok) {
          console.error(`API response status: ${response.status}`);
          toast.error("Failed to fetch contract source code");
          setLoading(false);
          setSourceData(null);
          return;
        }
        
        const data = await response.json();

        if (data.error) {
          toast.error(data.error);
          setLoading(false);
          setSourceData(null);
          return;
        }
        
        // 如果没有文件，或文件数组为空，显示错误
        if (!data.files || data.files.length === 0) {
          console.error("No files returned from API");
          toast.error("No contract files found");
          setLoading(false);
          setSourceData(null);
          return;
        }

        const contractResponse = await fetch(
          `/api/contract-info?address=${address}&chain=${chain}`
        );
        const contractData = await contractResponse.json();
        // // console.log("creation code:", contractData.creationCode);
        if (contractData && contractData.creationCode == "") {
          // console.log("11\n");
          // console.log("chain:", chain);
          // console.log("address:", address);
          contractData.creationCode = await fetchCreationCodeFromExplorer(
            chain,
            address
          );
          //console.log("creation code2:", contractData.creationCode);
          if (contractData.creationCode === "") {
            contractData.creationCode =
              "api not found, you need to view the contract on the blockchain explorer manually";
          }
        }

        let implementationInfo;
        if (implementation) {
          try {
            const implResponse = await fetch(
              `/api/contract-info?address=${implementation}&chain=${chain}`
            );
            if (implResponse.ok) {
              implementationInfo = await implResponse.json();
              if (implementationInfo && implementationInfo.creationCode == "") {
                implementationInfo.creationCode =
                  await fetchCreationCodeFromExplorer(chain, implementation);
                //console.log("imp creation code2:", implementationInfo.creationCode);
                if (implementationInfo.creationCode === "") {
                  implementationInfo.creationCode =
                    "api not found, you need to view the contract on the blockchain explorer manually";
                }
              }
            } else {
              const errorData = await implResponse.json();
              console.error(
                "Failed to fetch implementation contract info:",
                errorData
              );
            }
          } catch (error) {
            console.error("Error fetching implementation info:", error);
          }
        }

        let filteredFiles = [...data.files];

        // 检测是否为Solana合约
        const isSolanaChain = chain && chain.toLowerCase() === 'solana';

        // 使用正确的字段（abi用于以太坊合约，idl用于Solana合约）
        setSourceData({
          files: filteredFiles,
          settings: data.settings,
          contractName: data.contractName,
          compiler: data.compiler || (isSolanaChain ? "Solana BPF" : ""),
          optimization: data.optimization,
          runs: data.runs,
          abi: isSolanaChain ? data.idl : data.abi,  // 根据链类型选择正确的字段
          implementationAbi: data.implementationAbi,
          implementationAddress: implementation || undefined,
          implementationInfo: implementationInfo || undefined,
          creationCode: contractData.creationCode,
          deployedBytecode: contractData.deployedBytecode,
          creator: contractData.creator,
          creationTxHash: contractData.creationTxHash,
        });
      } catch (error) {
        console.error("Error:", error);
        if (!(error instanceof Response && error.status === 404)) {
          toast.error("Failed to fetch source code");
        }
        setSourceData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSource();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 border-4 border-t-[#2DD4BF] border-r-[#2DD4BF]/50 border-b-[#2DD4BF]/30 border-l-[#2DD4BF]/10 
                          rounded-full animate-spin duration-1500" />
            
            {/* Middle rotating ring - opposite direction */}
            <div className="absolute inset-4 border-4 border-r-[#2DD4BF] border-t-[#2DD4BF]/30 border-l-[#2DD4BF]/50 border-b-[#2DD4BF]/10 
                          rounded-full animate-spin duration-2000 animate-reverse" />
            
            {/* Inner glowing circle */}
            <div className="absolute inset-8 bg-[#2DD4BF]/10 rounded-full flex items-center justify-center
                          shadow-[0_0_20px_2px_rgba(45,212,191,0.3)] animate-pulse">
              {/* Code symbol */}
              <svg className="w-10 h-10 text-[#2DD4BF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            
            {/* Particles effect */}
            <div className="absolute -top-2 -left-2 w-3 h-3 bg-[#2DD4BF] rounded-full animate-particle1"></div>
            <div className="absolute top-1/2 -right-4 w-2 h-2 bg-[#2DD4BF]/70 rounded-full animate-particle2"></div>
            <div className="absolute -bottom-3 left-1/2 w-2 h-2 bg-[#2DD4BF]/60 rounded-full animate-particle3"></div>
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl font-medium text-white">
              Loading Source Code
            </h3>
            <p className="text-sm text-gray-400">
              Fetching contract files from blockchain...
            </p>
            <div className="flex justify-center gap-1.5 mt-2">
              <span className="w-2 h-2 bg-[#2DD4BF]/30 rounded-full animate-pulse"></span>
              <span className="w-2 h-2 bg-[#2DD4BF]/60 rounded-full animate-pulse delay-100"></span>
              <span className="w-2 h-2 bg-[#2DD4BF]/90 rounded-full animate-pulse delay-200"></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sourceData) {
    return (
      <div className="fixed inset-0 bg-[#1E1E1E] flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-lg mb-2">No source code found</p>
          <p className="text-sm text-gray-400">
            This contract may not exist on {chain} or its source code is not
            verified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SourcePreview
      files={sourceData.files}
      onAnalyze={handleStartAnalysis}
      contractName={sourceData.contractName}
      compiler={sourceData.compiler}
      optimization={sourceData.optimization}
      runs={sourceData.runs}
      chainId={chainId || undefined}
      address={address || undefined}
      implementationAddress={implementation || undefined}
      implementationInfo={sourceData.implementationInfo}
      evmVersion={sourceData.settings?.evmVersion}
      tokenName={tokenName || undefined}
      creationCode={sourceData.creationCode}
      deployedBytecode={sourceData.deployedBytecode}
      abi={sourceData.abi}
      implementationAbi={sourceData.implementationAbi}
      creator={sourceData.creator}
      creationTxHash={sourceData.creationTxHash}
    />
  );
}

export default function SourcePage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-[#1A1A1A] flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-8">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 border-4 border-t-[#2DD4BF] border-r-[#2DD4BF]/50 border-b-[#2DD4BF]/30 border-l-[#2DD4BF]/10 
                            rounded-full animate-spin duration-1500" />
              
              {/* Middle rotating ring - opposite direction */}
              <div className="absolute inset-4 border-4 border-r-[#2DD4BF] border-t-[#2DD4BF]/30 border-l-[#2DD4BF]/50 border-b-[#2DD4BF]/10 
                            rounded-full animate-spin duration-2000 animate-reverse" />
              
              {/* Inner glowing circle */}
              <div className="absolute inset-8 bg-[#2DD4BF]/10 rounded-full flex items-center justify-center
                            shadow-[0_0_20px_2px_rgba(45,212,191,0.3)] animate-pulse">
                {/* Code symbol */}
                <svg className="w-10 h-10 text-[#2DD4BF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              
              {/* Particles effect */}
              <div className="absolute -top-2 -left-2 w-3 h-3 bg-[#2DD4BF] rounded-full animate-particle1"></div>
              <div className="absolute top-1/2 -right-4 w-2 h-2 bg-[#2DD4BF]/70 rounded-full animate-particle2"></div>
              <div className="absolute -bottom-3 left-1/2 w-2 h-2 bg-[#2DD4BF]/60 rounded-full animate-particle3"></div>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-medium text-white">
                Loading Source Code
              </h3>
              <p className="text-sm text-gray-400">
                Fetching contract files from blockchain...
              </p>
              <div className="flex justify-center gap-1.5 mt-2">
                <span className="w-2 h-2 bg-[#2DD4BF]/30 rounded-full animate-pulse"></span>
                <span className="w-2 h-2 bg-[#2DD4BF]/60 rounded-full animate-pulse delay-100"></span>
                <span className="w-2 h-2 bg-[#2DD4BF]/90 rounded-full animate-pulse delay-200"></span>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <SourceContent />
    </Suspense>
  );
}
