interface AbiGenerateParams {
  contractName: string;
  address?: string;
  chainId?: string;
  abi?: any[];
}

import { fetchEthereumContractABI, fetchSolanaProgramIDL } from "./blockchain";

export const generateABI = async ({ contractName, address, chainId, abi }: AbiGenerateParams) => {
  // 如果提供了ABI数据，直接使用
  if (abi && Array.isArray(abi) && abi.length > 0) {
    return JSON.stringify(abi, null, 2);
  }
  
  // 否则尝试从链上获取
  if (address && chainId) {
    try {
      const fetchedAbi = await fetchEthereumContractABI(address, chainId);
      if (fetchedAbi && fetchedAbi.length > 0) {
        return JSON.stringify(fetchedAbi, null, 2);
      }
    } catch (error) {
      console.error("获取ABI失败:", error);
    }
  }
  
  // 如果没有获取到，返回空数组
  return JSON.stringify([], null, 2);
};

export const generateIDL = async ({ contractName, address, chainId, abi }: AbiGenerateParams) => {
  console.log(`生成IDL: address=${address}, chainId=${chainId}`);
  
  // 如果提供了IDL数据，直接使用
  if (abi && Array.isArray(abi) && abi.length > 0) {
    console.log('使用传入的IDL数据');
    return JSON.stringify(abi, null, 2);
  }
  
  // 否则尝试获取IDL
  if (address) {
    try {
      // 1. 首先尝试在前端直接获取IDL
      console.log(`尝试在前端直接获取Solana程序 ${address} 的IDL数据`);
      const idlData = await fetchSolanaProgramIDL(address);
      
      if (idlData && Array.isArray(idlData) && idlData.length > 0) {
        console.log('成功在前端直接获取IDL数据', idlData);
        return JSON.stringify(idlData, null, 2);
      }
      
      // 2. 如果前端获取失败，通过后端API获取，避免前端浏览器可能的CORS限制
      console.log('前端获取失败，通过后端API获取Solana IDL数据');
      const backendApiUrl = `/api/source?address=${address}&chain=solana&action=get_idl`;
      const apiResponse = await fetch(backendApiUrl);
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        if (apiData.success && apiData.idl) {
          console.log('成功从后端API获取IDL数据');
          return JSON.stringify(apiData.idl, null, 2);
        } else {
          console.log('后端API返回错误:', apiData.message || '未知错误');
        }
      } else {
        console.log(`后端API请求失败，状态码: ${apiResponse.status}`);
      }
    } catch (error: any) {
      console.error("获取IDL失败:", error?.message || String(error));
    }
  }
  
  console.log('所有获取IDL的方法都失败了，返回空数组');
  // 如果没有获取到，返回空数组
  return JSON.stringify([], null, 2);
}; 