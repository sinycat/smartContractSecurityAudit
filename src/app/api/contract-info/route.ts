import { NextRequest, NextResponse } from "next/server";
import { getApiScanConfig, getExplorerUrl } from "@/utils/chainServices";
import { Connection, PublicKey } from '@solana/web3.js';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address");
  const chain = searchParams.get("chain");

  if (!address || !chain) {
    return NextResponse.json(
      { error: "Missing address or chain" },
      { status: 400 }
    );
  }

  try {
    // Solana chain
    if (chain.toLowerCase() === "solana") {
      console.log(`Fetching Solana contract info for: ${address}`);
      
      try {
        // 使用多个RPC尝试获取SOL程序信息
        const rpcUrls = [
          "https://solana.publicnode.com",
          "https://api.mainnet-beta.solana.com",
          "https://solana-api.projectserum.com",
          "https://rpc.ankr.com/solana"
        ];
        
        let accountInfo = null;
        let connection = null;
        
        for (const rpcUrl of rpcUrls) {
          try {
            connection = new Connection(rpcUrl, { commitment: 'confirmed' });
            const publicKey = new PublicKey(address);
            accountInfo = await connection.getAccountInfo(publicKey);
            
            if (accountInfo) {
              console.log(`Successfully connected to Solana via ${rpcUrl}`);
              break;
            }
          } catch (e) {
            console.warn(`Failed with RPC ${rpcUrl}:`, e);
            // 继续尝试下一个RPC
          }
        }
        
        if (accountInfo) {
          const isExecutable = accountInfo.executable;
          const owner = accountInfo.owner.toBase58();
          const solBalance = accountInfo.lamports / 1e9;
          
          return NextResponse.json({
            contractName: `Solana_${address.slice(0, 8)}`,
            compiler: "Solana BPF",
            optimization: true,
            runs: 200,
            evmVersion: "none",
            creationCode: `0x${Buffer.from(accountInfo.data).toString('hex').slice(0, 1000)}...`,
            deployedBytecode: `0x${Buffer.from(accountInfo.data).toString('hex').slice(0, 1000)}...`,
            creator: owner,
            creationTxHash: "",
            implementation: null,
            isExecutable,
            lamports: accountInfo.lamports,
            solBalance
          });
        } else {
          return NextResponse.json({
            contractName: `Solana_${address.slice(0, 8)}`,
            compiler: "Unknown",
            optimization: false,
            runs: 0,
            evmVersion: "none",
            creationCode: "",
            deployedBytecode: "",
            creator: "",
            creationTxHash: "",
            implementation: null
          });
        }
      } catch (error) {
        console.error(`Error fetching Solana program: ${error}`);
        return NextResponse.json({
          contractName: `Solana_${address.slice(0, 8)}`,
          compiler: "Unknown",
          optimization: false,
          runs: 0,
          evmVersion: "none",
          creationCode: "",
          deployedBytecode: "",
          creator: "",
          creationTxHash: "",
          implementation: null,
          error: `${error}`
        });
      }
    }
    // Aurora chain
    else if (chain === "aurora") {
      const auroraUrl = `https://explorer.mainnet.aurora.dev/api/v2/smart-contracts/${address}`;
      const response = await fetch(auroraUrl);
      const data = await response.json();

      const { url: apiUrl, apiKey } = getApiScanConfig(chain);
      const creationUrl = `${apiUrl}?module=contract&action=getcontractcreation&contractaddresses=${address}&apikey=${apiKey}`;
      const creationResponse = await fetch(creationUrl);
      const creationData = await creationResponse.json();

      let creator = "";
      let creationTxHash = "";

      // Get creation info
      if (creationData.status === "1" && creationData.result?.[0]) {
        creator = creationData.result[0].contractCreator;
        creationTxHash = creationData.result[0].txHash;
      }

      return NextResponse.json({
        contractName: data.name || "",
        compiler: data.compiler_version || "",
        optimization: data.optimization_enabled || false,
        runs: data.optimization_runs || 200,
        evmVersion: data.evm_version || "default",
        creationCode: data.creation_bytecode || "",
        deployedBytecode: data.deployed_bytecode || "",
        implementation: data.proxy_type ? data.implementations[0] : null,
        creator: creator,
        creationTxHash: creationTxHash,
      });
    } else {
      // other chains
      try {
        const { url: apiUrl, apiKey } = getApiScanConfig(chain);
        console.log(`Fetching contract info for ${chain} address: ${address}`);

        // 1. Get contract bytecode
        const bytecodeUrl = `${apiUrl}?module=proxy&action=eth_getCode&address=${address}&tag=latest&apikey=${apiKey}`;
        const bytecodeResponse = await fetch(bytecodeUrl);
        
        if (!bytecodeResponse.ok) {
          console.error(`Bytecode API call failed with status: ${bytecodeResponse.status}`);
        }
        
        const bytecodeData = await bytecodeResponse.json();

        // 2. Get contract creation code and creator info
        const creationUrl = `${apiUrl}?module=contract&action=getcontractcreation&contractaddresses=${address}&apikey=${apiKey}`;
        const creationResponse = await fetch(creationUrl);
        
        if (!creationResponse.ok) {
          console.error(`Creation API call failed with status: ${creationResponse.status}`);
        }
        
        const creationData = await creationResponse.json();

        let creationCode = "";
        let creator = "";
        let creationTxHash = "";

        // Get creation info
        if (creationData.status === "1" && creationData.result?.[0]) {
          creationCode = creationData.result[0].creationBytecode;
          creator = creationData.result[0].contractCreator;
          creationTxHash = creationData.result[0].txHash;
        }

        // not found
        if (creationCode === "" || creationCode === undefined) {
          creationCode = "";
        }

        // Get contract source code information
        const sourceUrl = `${apiUrl}?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
        const sourceResponse = await fetch(sourceUrl);
        
        if (!sourceResponse.ok) {
          console.error(`Source API call failed with status: ${sourceResponse.status}`);
        }
        
        const sourceData = await sourceResponse.json();

        // Get deployed bytecode
        let deployedBytecode = bytecodeData.result || "";
        // not found
        if (deployedBytecode === "" || deployedBytecode === undefined) {
          deployedBytecode = "";
        }

        // 确保我们有一个有效的结构返回，即使合约不存在
        const result = sourceData.result && sourceData.result[0] ? sourceData.result[0] : {};
        
        return NextResponse.json({
          contractName: result.ContractName || "",
          compiler: result.CompilerVersion || "",
          optimization: result.OptimizationUsed === "1",
          runs: parseInt(result.Runs) || 200,
          evmVersion: result.EVMVersion || "default",
          creationCode,
          deployedBytecode: deployedBytecode,
          implementation: result.Implementation,
          creator,
          creationTxHash,
        });
      } catch (error) {
        console.error(`Error in EVM contract info API: ${error instanceof Error ? error.message : String(error)}`);
        return NextResponse.json(
          { 
            error: `Failed to fetch contract info: ${error instanceof Error ? error.message : String(error)}`,
            contractName: "",
            compiler: "",
            optimization: false,
            runs: 200,
            evmVersion: "default",
            creationCode: "",
            deployedBytecode: "",
            implementation: null,
            creator: "",
            creationTxHash: "",
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json(
      { error: `Failed to fetch contract info: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
