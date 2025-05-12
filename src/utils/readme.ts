import { CHAINS } from "./constants";

// Get chain display name
function getChainDisplayName(chainId: string): string {
  const chain = Object.values(CHAINS).find((c) => c.id === chainId);
  return chain?.displayName || chainId;
}

interface ContractInfo {
  contractName: string;
  compiler: string;
  optimization: boolean;
  runs: number;
  evmVersion?: string;
  address?: string;
  chainId?: string;
  creationCode?: string;
  deployedBytecode?: string;
  creator?: string;
  creationTxHash?: string;
}

interface ImplementationInfo {
  contractName: string;
  compiler: string;
  optimization: boolean;
  runs: number;
  evmVersion: string;
  creationCode?: string;
  deployedBytecode?: string;
  creator?: string;
  creationTxHash?: string;
}

// Format file tree structure - new format matching image 2 style
export const formatFileTree = (files: string[]): string => {
  // Filter out .md files
  const filteredFiles = files.filter((file) => !file.endsWith(".md"));

  // Sort files to ensure consistent order
  filteredFiles.sort();

  // Build tree structure
  const tree: { [key: string]: any } = {};

  // Build tree structure
  filteredFiles.forEach((path) => {
    const parts = path.split("/");
    let current = tree;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        current[part] = null;
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    });
  });

  // Recursively generate tree string in the style from image 1
  const printTree = (node: any, prefix = "", isRoot = true, rootName = ""): string => {
    let result = "";
    const entries = Object.entries(node);
    
    if (isRoot && entries.length > 0 && rootName) {
      result += rootName + "\n";
    }
    
    entries.forEach(([key, value], index) => {
      const isLast = index === entries.length - 1;
      
      if (!isRoot || !rootName) {
        if (isRoot) {
          result += key + "\n";
        } else {
          result += prefix + (isLast ? "└── " : "├── ") + key + "\n";
        }
      }
      
      if (value !== null) {
        const newPrefix = prefix + (isLast ? "    " : "│   ");
        result += printTree(value, newPrefix, false, "");
      }
    });

    return result;
  };

  // 处理根目录特殊情况
  let result = "";
  const rootEntries = Object.entries(tree);
  
  // 如果有contracts目录，特殊处理
  if (tree.contracts) {
    result += "contracts\n";
    result += printTree(tree.contracts, "│   ", false, "");
    
    // 移除已处理的contracts目录
    delete tree.contracts;
    
    // 处理其他根目录文件
    Object.entries(tree).forEach(([key, value]) => {
      if (value === null) {
        result += key + "\n";
      } else {
        result += key + "\n";
        result += printTree(value, "│   ", false, "");
      }
    });
  } else {
    // 常规处理
    result = printTree(tree, "", true, "");
  }

  return result;
};

export const generateReadme = ({
  files,
  tokenName,
  proxyInfo,
  implementationInfo,
  implementationAddress,
}: {
  files: { path: string }[];
  tokenName?: string;
  proxyInfo: ContractInfo;
  implementationInfo?: ImplementationInfo;
  implementationAddress?: string;
}): string => {
  // Check if it's a proxy contract
  const isProxy =
    files.some((f) => f.path.startsWith("proxy/")) &&
    files.some((f) => f.path.startsWith("implementation/"));

  // Check if it's a Solana program
  const isSolana = proxyInfo.compiler && proxyInfo.compiler.toLowerCase().includes("solana");
  
  let readme = "";

  if (isProxy) {
    readme = `# ${
      tokenName || implementationInfo?.contractName || proxyInfo.contractName
    }

## Proxy Contract Information
- **Contract Name:** ${proxyInfo.contractName}
- **Compiler Version:** ${proxyInfo.compiler}
- **Optimization Enabled:** ${
      proxyInfo.optimization ? `Yes with ${proxyInfo.runs} runs` : "No"
    }
- **Contract Address:** ${proxyInfo.address || "Unknown"}
- **EVM Version:** ${proxyInfo.evmVersion || "default"}
${
  proxyInfo.chainId
    ? `- **Chain:** ${getChainDisplayName(proxyInfo.chainId)}`
    : ""
}
${proxyInfo.creator ? `- **Creator:** ${proxyInfo.creator}` : ""}
${
  proxyInfo.creationTxHash
    ? `- **Creation Transaction:** ${proxyInfo.creationTxHash}`
    : ""
}

## Implementation Contract Information
- **Contract Name:** ${implementationInfo?.contractName || "Unknown"}
- **Compiler Version:** ${implementationInfo?.compiler || "Unknown"}
- **Optimization Enabled:** ${
      implementationInfo?.optimization
        ? `Yes with ${implementationInfo.runs} runs`
        : "No"
    }
- **Contract Address:** ${implementationAddress || "Unknown"}
- **EVM Version:** ${implementationInfo?.evmVersion || "default"}
${
  proxyInfo.chainId
    ? `- **Chain:** ${getChainDisplayName(proxyInfo.chainId)}`
    : ""
}
${
  implementationInfo?.creator
    ? `- **Creator:** ${implementationInfo.creator}`
    : ""
}
${
  implementationInfo?.creationTxHash
    ? `- **Creation Transaction:** ${implementationInfo.creationTxHash}`
    : ""
}`;
  } else if (isSolana) {
    // For Solana programs
    readme = `# ${tokenName || proxyInfo.contractName} - Verified Program

## Verification Information
- **Program Address:** ${proxyInfo.address || "Unknown"}
- **Repository:** ${proxyInfo.chainId ? `https://github.com/${proxyInfo.chainId}` : "Unknown"}
- **Path:** programs/${proxyInfo.contractName}/src
- **Branch:** main

This program's source code has been verified and fetched from GitHub.

## Contract Information
- **Contract Name:** ${proxyInfo.contractName}
- **Compiler Environment:** ${proxyInfo.compiler}
- **Optimization Enabled:** ${proxyInfo.optimization ? "Yes" : "No"}
${proxyInfo.creator ? `- **Creator:** ${proxyInfo.creator}` : ""}
${proxyInfo.creationTxHash ? `- **Creation Transaction:** ${proxyInfo.creationTxHash}` : ""}`;
  } else {
    // For other contracts (EVM)
    readme = `# ${tokenName || proxyInfo.contractName}

## Contract Information
- **Contract Name:** ${proxyInfo.contractName}
- **Compiler Version:** ${proxyInfo.compiler}
- **Optimization Enabled:** ${
      proxyInfo.optimization ? `Yes with ${proxyInfo.runs} runs` : "No"
    }
- **Contract Address:** ${proxyInfo.address || "Unknown"}
- **EVM Version:** ${proxyInfo.evmVersion || "default"}
${
  proxyInfo.chainId
    ? `- **Chain:** ${getChainDisplayName(proxyInfo.chainId)}`
    : ""
}
${proxyInfo.creator ? `- **Creator:** ${proxyInfo.creator}` : ""}
${
  proxyInfo.creationTxHash
    ? `- **Creation Transaction:** ${proxyInfo.creationTxHash}`
    : ""
}`;
  }

  // Add Source Code Structure section for all contract types
  readme += `

## Source Code Structure
\`\`\`
${formatFileTree(files.map((f) => f.path))}
\`\`\``;

  return readme;
};
