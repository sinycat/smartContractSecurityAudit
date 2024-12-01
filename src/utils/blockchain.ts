import { ethers } from "ethers";
import { CHAINS, KNOWN_CONTRACTS } from "./constants";
import { withRetry } from "./rpc";
import { getRpcUrl, getExplorerUrl } from "@/utils/chainServices";
import type { ContractBasicInfo, ContractFile } from "@/types/blockchain";
import * as cheerio from "cheerio";

export async function checkContractOnChains(
  address: string
): Promise<{ [key: string]: ContractBasicInfo | undefined }> {
  const result: { [key: string]: ContractBasicInfo | undefined } = {};

  // Get contract label information
  const contractInfo = KNOWN_CONTRACTS[address.toLowerCase()] || {};

  Object.keys(CHAINS).forEach((chainName) => {
    result[chainName] = { exists: false };
  });

  await Promise.all(
    Object.entries(CHAINS).map(async ([chainName, chainInfo]) => {
      try {
        const provider = new ethers.JsonRpcProvider(getRpcUrl(chainName));

        // 1. First check if the contract exists using RPC
        const code = await provider.getCode(address);
        if (code === "0x") {
          result[chainName] = { exists: false };
          return;
        }

        // 2. Get basic network information, balance, and labels
        const [network, balance, labels] = await Promise.all([
          provider.getNetwork(),
          provider.getBalance(address),
          fetchContractLabels(address, chainName),
        ]);

        result[chainName] = {
          exists: true,
          chainId: network.chainId,
          balance: balance.toString(),
          ...labels, // Add label information
        };

        // 3. Check contract type and get information
        try {
          const contract = new ethers.Contract(
            address,
            [
              // ERC165
              "function supportsInterface(bytes4) view returns (bool)",
              // General interface
              "function name() view returns (string)",
              "function symbol() view returns (string)",
              "function decimals() view returns (uint8)",
              "function totalSupply() view returns (uint256)",
              "function owner() view returns (address)",
              "function getOwner() view returns (address)", // Some contracts use getOwner
              // NFT specific interface
              "function balanceOf(address) view returns (uint256)",
              "function ownerOf(uint256) view returns (address)",
              "function uri(uint256) view returns (string)",
            ],
            provider
          );

          // Try to get basic information first
          const [name, symbol, decimals, totalSupply, owner] =
            await Promise.all([
              contract.name().catch(() => null),
              contract.symbol().catch(() => null),
              contract.decimals().catch(() => null),
              contract.totalSupply().catch(() => null),
              contract
                .owner()
                .catch(() => contract.getOwner().catch(() => null)),
            ]);

          // Check if the contract supports NFT interfaces
          let isERC721 = false;
          let isERC1155 = false;

          try {
            [isERC721, isERC1155] = await Promise.all([
              contract.supportsInterface("0x80ac58cd").catch(() => false), // ERC721
              contract.supportsInterface("0xd9b67a26").catch(() => false), // ERC1155
            ]);
          } catch (e) {
            console.log("Failed to check NFT interfaces");
          }

          // Set contract type, but only display if there is no project name or label
          if (isERC721 || isERC1155) {
            result[chainName]!.contractType = isERC721 ? "ERC721" : "ERC1155";
          } else if (name || symbol || decimals !== null || totalSupply) {
            result[chainName]!.contractType = "ERC20";
          }

          // Save the retrieved information
          if (name) result[chainName]!.name = name;
          if (symbol) result[chainName]!.symbol = symbol;
          if (decimals !== null) result[chainName]!.decimals = decimals;
          if (totalSupply)
            result[chainName]!.totalSupply = totalSupply.toString();
          if (owner) result[chainName]!.owner = owner;
        } catch (e) {
          console.log("Failed to get contract info:", e);
        }

        // Check if this is a proxy contract
        try {
          const implementationResult = await getImplementationAddress(
            address,
            chainName
          );
          if (implementationResult.address) {
            result[chainName] = {
              ...result[chainName],
              implementation: implementationResult.address,
              isProxy: true,
              proxyType: implementationResult.type || "Proxy Contract",
            } as ContractBasicInfo;

            // If the implementation contract address is retrieved, try to get more information from the implementation contract
            const implContract = new ethers.Contract(
              implementationResult.address,
              [
                "function name() view returns (string)",
                "function symbol() view returns (string)",
                "function decimals() view returns (uint8)",
                "function totalSupply() view returns (uint256)",
              ],
              provider
            );

            try {
              const [name, symbol, decimals, totalSupply] = await Promise.all([
                implContract.name().catch(() => null),
                implContract.symbol().catch(() => null),
                implContract.decimals().catch(() => null),
                implContract.totalSupply().catch(() => null),
              ]);

              if (name) result[chainName]!.name = name;
              if (symbol) result[chainName]!.symbol = symbol;
              if (decimals !== null) result[chainName]!.decimals = decimals;
              if (totalSupply)
                result[chainName]!.totalSupply = totalSupply.toString();
            } catch (e) {
              console.log("Failed to get implementation contract info");
            }
          }
        } catch (e) {
          console.log("Failed to check proxy status");
        }
      } catch (error) {
        console.error(`Failed to check ${chainName}:`, error);
        result[chainName] = { exists: false };
      }
    })
  );

  return result;
}

async function fetchContractLabels(
  address: string,
  chain: string
): Promise<{ labels?: string[]; projectName?: string }> {
  return KNOWN_CONTRACTS[address.toLowerCase()] || {};
}

export async function getImplementationAddress(
  proxyAddress: string,
  chain: string
): Promise<{ address: string | null; type: string | null }> {
  try {
    const provider = new ethers.JsonRpcProvider(getRpcUrl(chain), undefined, {
      staticNetwork: true,
    });

    // 1. Check EIP-1967 proxy
    const EIP1967_IMPLEMENTATION_SLOT =
      "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    let implementation = await provider.getStorage(
      proxyAddress,
      EIP1967_IMPLEMENTATION_SLOT
    );
    if (
      implementation &&
      implementation !== "0x" &&
      implementation !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      return {
        address: ethers.getAddress("0x" + implementation.slice(-40)),
        type: "EIP-1967 Proxy",
      };
    }

    // 2. Check UUPS proxy
    const UUPS_BEACON_SLOT =
      "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3";
    implementation = await provider.getStorage(proxyAddress, UUPS_BEACON_SLOT);
    if (
      implementation &&
      implementation !== "0x" &&
      implementation !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      return {
        address: ethers.getAddress("0x" + implementation.slice(-40)),
        type: "UUPS Proxy",
      };
    }

    // 3. Check transparent proxy
    const TRANSPARENT_PROXY_SLOT =
      "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
    implementation = await provider.getStorage(
      proxyAddress,
      TRANSPARENT_PROXY_SLOT
    );
    if (
      implementation &&
      implementation !== "0x" &&
      implementation !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      return {
        address: ethers.getAddress("0x" + implementation.slice(-40)),
        type: "Transparent Proxy",
      };
    }

    // 4. Check beacon proxy
    const BEACON_IMPLEMENTATION_SLOT =
      "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50";
    const beaconAddress = await provider.getStorage(
      proxyAddress,
      BEACON_IMPLEMENTATION_SLOT
    );
    if (
      beaconAddress &&
      beaconAddress !== "0x" &&
      beaconAddress !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      const beacon = new ethers.Contract(
        ethers.getAddress("0x" + beaconAddress.slice(-40)),
        ["function implementation() view returns (address)"],
        provider
      );
      try {
        const beaconImpl = await beacon.implementation();
        if (
          beaconImpl &&
          beaconImpl !== "0x0000000000000000000000000000000000000000"
        ) {
          return {
            address: beaconImpl,
            type: "Beacon Proxy",
          };
        }
      } catch (e) {
        console.log("Failed to get beacon implementation");
      }
    }

    // 5. Try to call contract methods directly
    const proxyContract = new ethers.Contract(
      proxyAddress,
      [
        "function implementation() view returns (address)",
        "function getImplementation() view returns (address)",
        "function masterCopy() view returns (address)",
        "function getProxyImplementation() view returns (address)",
      ],
      provider
    );

    for (const method of [
      "implementation",
      "getImplementation",
      "masterCopy",
      "getProxyImplementation",
    ]) {
      try {
        const impl = await proxyContract[method]();
        if (impl && impl !== "0x0000000000000000000000000000000000000000") {
          return {
            address: impl,
            type: "Generic Proxy",
          };
        }
      } catch (e) {
        continue;
      }
    }

    return { address: null, type: null };
  } catch (error) {
    return { address: null, type: null };
  }
}

export async function fetchCreationCodeFromExplorer(
  chain: string,
  address: string
): Promise<string> {
  try {
    const explorerUrl = getExplorerUrl(chain, address);

    // Try different CORS proxies
    const corsProxies = [
      "https://api.allorigins.win/raw?url=",
      "https://corsproxy.io/?",
      "https://cors-proxy.fringe.zone/",
      "https://cors.streamlit.app/",
      "https://crossorigin.me/",
      "https://thingproxy.freeboard.io/fetch/",
    ];

    let html = "";
    let proxySuccess = false;

    // Try each proxy until one works
    for (const proxy of corsProxies) {
      try {
        const response = await fetch(proxy + encodeURIComponent(explorerUrl), {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        });

        if (response.ok) {
          html = await response.text();
          proxySuccess = true;
          break;
        }
      } catch (proxyError) {
        continue;
      }
    }

    if (!proxySuccess) {
      return "";
    }

    const $ = cheerio.load(html);
    let creationCode = "";

    // Only use the verified bytecode selector
    const text = $("#verifiedbytecode2").text().trim();
    if (text && text.match(/^[0-9a-fA-F]+$/)) {
      creationCode = text;
    }

    if (creationCode && !creationCode.startsWith("0x")) {
      creationCode = "0x" + creationCode;
    }

    return creationCode;
  } catch (error) {
    console.error("Error fetching creation code:", error);
    return "";
  }
}
