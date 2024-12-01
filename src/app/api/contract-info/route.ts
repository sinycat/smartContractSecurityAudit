import { NextRequest, NextResponse } from "next/server";
import { getApiScanConfig, getExplorerUrl } from "@/utils/chainServices";

export const runtime = 'nodejs'

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
    const { url: apiUrl, apiKey } = getApiScanConfig(chain);

    // 1. Get contract bytecode
    const bytecodeUrl = `${apiUrl}?module=proxy&action=eth_getCode&address=${address}&tag=latest&apikey=${apiKey}`;
    const bytecodeResponse = await fetch(bytecodeUrl);
    const bytecodeData = await bytecodeResponse.json();

    // 2. Get contract creation code
    const creationUrl = `${apiUrl}?module=contract&action=getcontractcreation&contractaddresses=${address}&apikey=${apiKey}`;
    const creationResponse = await fetch(creationUrl);
    const creationData = await creationResponse.json();

    let creationCode = "";

    // First try to get from creation transaction
    if (creationData.status === "1" && creationData.result?.[0]?.txHash) {
      creationCode = creationData.result[0].creationBytecode;
    }

    // not found 
    if (creationCode === "" || creationCode === undefined) {
        creationCode = "";
    }

    // Get contract source code information
    const sourceUrl = `${apiUrl}?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
    const sourceResponse = await fetch(sourceUrl);
    const sourceData = await sourceResponse.json();

    return NextResponse.json({
      contractName: sourceData.result[0]?.ContractName || "",
      compiler: sourceData.result[0]?.CompilerVersion || "",
      optimization: sourceData.result[0]?.OptimizationUsed === "1",
      runs: parseInt(sourceData.result[0]?.Runs) || 200,
      evmVersion: sourceData.result[0]?.EVMVersion || "default",
      creationCode,
      deployedBytecode: bytecodeData.result || "",
      implementation: sourceData.result[0]?.Implementation,
    });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json(
      { error: "Failed to fetch contract info" },
      { status: 500 }
    );
  }
}
