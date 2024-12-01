import { NextRequest, NextResponse } from "next/server";
import { getApiScanConfig, getExplorerUrl } from "@/utils/chainServices";
import * as cheerio from "cheerio";

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

    // If creation code is not found, try to fetch from explorer
    if (creationCode === "" || creationCode === undefined) {
      try {
        const explorerUrl = getExplorerUrl(chain, address);
        const response = await fetch(explorerUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        });

        if (response.ok) {
          const html = await response.text();
          const $ = cheerio.load(html);
          creationCode = $("#verifiedbytecode2").text().trim();
          // Add 0x prefix if missing
          if (!creationCode.startsWith("0x")) {
            creationCode = "0x" + creationCode;
          }
        }
      } catch (_error) {
        creationCode = "";
      }
    }

    // Get contract source code information
    const sourceResponse = await fetch(
      `${apiUrl}?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`
    );
    const sourceData = await sourceResponse.json();

    return NextResponse.json({
      contractName: sourceData.result[0]?.ContractName || "",
      compiler: sourceData.result[0]?.CompilerVersion || "",
      optimization: sourceData.result[0]?.OptimizationUsed === "1",
      runs: parseInt(sourceData.result[0]?.Runs) || 200,
      evmVersion: sourceData.result[0]?.EVMVersion || "default",
      creationCode, // Contract creation code
      deployedBytecode: bytecodeData.result || "", // Deployed bytecode
      implementation: sourceData.result[0]?.Implementation,
    });
  } catch (_error) {
    console.error("Error:", _error);
    return NextResponse.json(
      { error: "Failed to fetch contract info" },
      { status: 500 }
    );
  }
}
