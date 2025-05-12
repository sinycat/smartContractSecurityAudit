import { NextRequest, NextResponse } from 'next/server';
import type { ContractFile } from '@/types/blockchain';
import { getApiScanConfig } from '@/utils/chainServices';
import { getSolanaContractInfo, fetchContractSourceCode, fetchProgramSourceFromMultipleSources, fetchEthereumContractABI, fetchSolanaProgramIDL } from '@/utils/blockchain';
import { CHAINS } from '@/utils/constants';

// 添加新的路由处理函数，专门获取Solana程序IDL
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  const chain = searchParams.get('chain') || 'ethereum';
  const action = searchParams.get('action'); // 新增: 用于区分是获取源码还是获取IDL

  if (!address) {
    return NextResponse.json(
      { error: 'Address parameter is required' },
      { status: 400 }
    );
  }

  console.log(`API请求: ${action || 'source'} for ${chain}:${address}`);

  // 根据action参数决定执行什么操作
  if (action === 'get_idl' && chain.toLowerCase() === 'solana') {
    try {
      // 尝试获取Solana程序的IDL
      console.log(`后端API: 正在获取Solana程序 ${address} 的IDL...`);
      
      // 直接使用更新后的fetchSolanaProgramIDL函数获取IDL
      const idlData = await fetchSolanaProgramIDL(address);
      
      if (idlData && Array.isArray(idlData) && idlData.length > 0) {
        console.log(`后端API: 成功获取IDL数据`);
        return NextResponse.json({ success: true, idl: idlData });
      } else {
        // 如果未能获取到IDL数据，返回错误信息
        console.log(`后端API: 未能获取有效的IDL数据`);
        return NextResponse.json({ 
          success: false, 
          idl: [], 
          message: "无法获取程序IDL" 
        });
      }
    } catch (error: any) {
      console.error('后端API: 获取IDL时出错:', error?.message || String(error));
      return NextResponse.json(
        { error: 'Error fetching Solana program IDL', details: error?.message || String(error) },
        { status: 500 }
      );
    }
  } else {
    try {
      // 原有的获取源码逻辑
      if (chain.toLowerCase() === 'solana') {
        // 使用多源获取函数，尝试从多个来源获取Solana程序源码
        const solanaContract = await fetchProgramSourceFromMultipleSources(address, chain);
        
        if (solanaContract) {
          // 成功获取Solana源码
          const idlData = await fetchSolanaProgramIDL(address);
          return NextResponse.json({
            files: solanaContract,
            contractName: address.substring(0, 8) + '...',
            language: 'rust',
            chain: 'solana',
            address,
            isProxy: false,
            idl: idlData,
          });
        } else {
          return NextResponse.json(
            { error: 'Source code not found for Solana program' },
            { status: 404 }
          );
        }
      } else {
        // 使用EVM链的源码获取逻辑
        const contractInfo = await getApiScanConfig(chain);
        
        if (!contractInfo) {
          return NextResponse.json(
            { error: 'Chain not supported' },
            { status: 400 }
          );
        }
        
        // 获取合约源码
        const files = await fetchContractSourceCode(chain, address);
        
        if (files.length === 0) {
          return NextResponse.json(
            { error: 'Source code not found or contract not verified' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          files,
          contractName: chain.toUpperCase(),
          language: 'solidity',
          chain,
          address,
          isProxy: false,
          abi: await fetchEthereumContractABI(address, chain),
        });
      }
    } catch (error) {
      console.error('Error fetching contract source:', error);
      return NextResponse.json(
        { error: 'Error fetching contract source' },
        { status: 500 }
      );
    }
  }
} 