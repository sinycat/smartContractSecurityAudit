"use client";

import { useState, useRef, useEffect } from "react";
import type { ContractFile } from "@/types/blockchain";
import { generateReadme } from "@/utils/readme";
import { generateConfig, formatConfig } from "@/utils/config";
import { generateABI, generateIDL } from "@/utils/abi";

interface FileTreeNode {
  name: string;
  type: "file" | "directory";
  path: string;
  content?: string;
  children?: FileTreeNode[];
}

interface FileTreeViewProps {
  node: FileTreeNode;
  level?: number;
  onFileSelect: (file: ContractFile) => void;
  selectedPath?: string;
}

// Compress path nodes
function compressPath(node: FileTreeNode): FileTreeNode {
  if (node.type === "file") return node;

  if (
    node.children &&
    node.children.length === 1 &&
    node.children[0].type === "directory"
  ) {
    const child = node.children[0];
    const compressedChild = compressPath(child);
    return {
      ...node,
      name: `${node.name}/${compressedChild.name}`,
      path: compressedChild.path,
      children: compressedChild.children,
    };
  }

  return {
    ...node,
    children: node.children?.map(compressPath),
  };
}

function FileTreeView({
  node,
  level = 0,
  onFileSelect,
  selectedPath,
}: FileTreeViewProps) {
  // Only expand by default for the first level
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const paddingLeft = level * 12;

  if (node.type === "file") {
    return (
      <button
        onClick={() =>
          onFileSelect({
            name: node.name,
            path: node.path,
            content: node.content!,
          })
        }
        className={`w-full text-left px-2 py-1 text-sm hover:bg-[#37373D] flex items-center gap-2 group relative
          ${
            selectedPath === node.path
              ? "bg-[#37373D] text-white"
              : "text-[#CCCCCC]"
          }
          transition-colors duration-150 ease-in-out overflow-hidden`}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
      >
        <svg
          className="w-3.5 h-3.5 flex-shrink-0 text-[#2DD4BF] opacity-80"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left px-2 py-1 text-sm hover:bg-[#37373D] flex items-center gap-2
          text-[#CCCCCC] transition-colors duration-150 ease-in-out"
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
      >
        <svg
          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-150
            ${isExpanded ? "transform rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <svg
          className="w-3.5 h-3.5 flex-shrink-0 text-[#2DD4BF] opacity-80"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <span className="truncate">{node.name}</span>
      </button>
      {isExpanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeView
              key={child.path + index}
              node={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FileExplorerProps {
  files: ContractFile[];
  onFileSelect: (file: ContractFile) => void;
  selectedFile?: ContractFile;
  showImplementation?: boolean;
  contractType: "proxy" | "implementation" | "solana";
  onContractTypeChange: (type: "proxy" | "implementation" | "solana") => void;
  isWrapped: boolean;
  onWrapChange: (wrapped: boolean) => void;
  contractName: string;
  compiler: string;
  optimization: boolean;
  runs: number;
  chainId?: string;
  address?: string;
  implementationAddress?: string;
  implementationInfo?: {
    contractName: string;
    compiler: string;
    optimization: boolean;
    runs: number;
    evmVersion: string;
    creationCode?: string;
    deployedBytecode?: string;
    creator?: string;
    creationTxHash?: string;
  };
  evmVersion?: string;
  tokenName?: string;
  creationCode?: string;
  deployedBytecode?: string;
  abi?: any[];
  implementationAbi?: any[];
  creator?: string;
  creationTxHash?: string;
}

export default function FileExplorer({
  files: initialFiles,
  onFileSelect,
  selectedFile,
  showImplementation,
  contractType,
  onContractTypeChange,
  isWrapped,
  onWrapChange,
  contractName,
  compiler,
  optimization,
  runs,
  chainId,
  address,
  implementationAddress,
  implementationInfo,
  evmVersion,
  tokenName,
  creationCode,
  deployedBytecode,
  abi,
  implementationAbi,
  creator,
  creationTxHash,
}: FileExplorerProps) {
  const [width, setWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [abiFileContent, setAbiFileContent] = useState<string>("");
  const [loadingAbi, setLoadingAbi] = useState<boolean>(false);
  const [files, setFiles] = useState<ContractFile[]>(initialFiles);

  // Check if there are proxy and implementation contracts
  const hasProxyContract = files.some((f) => f.path.startsWith("proxy/"));
  const hasImplementationContract = files.some((f) =>
    f.path.startsWith("implementation/")
  );

  // Modify file filtering logic
  const filteredFiles = files.filter((file) => {
    // Always keep .md files
    if (file.path.endsWith(".md")) {
      return true;
    }

    // If it's a proxy contract scenario
    if (hasProxyContract && hasImplementationContract) {
      if (contractType === "proxy") {
        return file.path.startsWith("proxy/");
      } else {
        return file.path.startsWith("implementation/");
      }
    }
    // Non-proxy contract scenario, show all files
    return true;
  });

  const readmeContent = generateReadme({
    files,
    tokenName,
    proxyInfo: {
      contractName: contractName || '',
      compiler: compiler || '',
      optimization: optimization || false,
      runs: runs || 200,
      evmVersion,
      address,
      chainId,
      creationCode,
      deployedBytecode,
      creator,
      creationTxHash,
    },
    implementationInfo: implementationInfo
      ? {
          ...implementationInfo,
          contractName: implementationInfo.contractName || '',
          compiler: implementationInfo.compiler || '',
          optimization: implementationInfo.optimization || false,
          runs: implementationInfo.runs || 200,
          evmVersion: implementationInfo.evmVersion || '',
        }
      : undefined,
    implementationAddress,
  });

  // Add README.md to the file list
  const readmeFile: ContractFile = {
    name: "README.md",
    path: "README.md",
    content: readmeContent,
  };

  // Create the corresponding config.json file
  const configFile: ContractFile =
    contractType === "proxy"
      ? {
          name: "config.json",
          path: "proxy/config.json",
          content: formatConfig(
            generateConfig({
              contractName,
              compiler,
              optimization,
              runs,
              evmVersion,
              creationCode,
              deployedBytecode,
            })
          ),
        }
      : {
          name: "config.json",
          path: "implementation/config.json",
          content: formatConfig(
            generateConfig({
              contractName: implementationInfo?.contractName || "",
              compiler: implementationInfo?.compiler || "",
              optimization: implementationInfo?.optimization || false,
              runs: implementationInfo?.runs || 200,
              evmVersion: implementationInfo?.evmVersion,
              creationCode: implementationInfo?.creationCode,
              deployedBytecode: implementationInfo?.deployedBytecode,
            })
          ),
        };

  // 检测是否为Solana程序
  const isSolanaProgram = compiler && compiler.includes("Solana") || contractType === 'solana';

  // 根据是否为Solana程序决定文件名
  const interfaceFileName = isSolanaProgram ? "idl.json" : "abi.json";

  // 在组件加载时获取ABI/IDL
  useEffect(() => {
    const fetchInterfaceData = async () => {
      try {
        setLoadingAbi(true);
        let filename = '';
        let interfaceContent = '';

        // 根据合约类型决定获取ABI还是IDL
        if (contractType === 'solana' || isSolanaProgram) {
          // Solana合约 - 获取IDL
          filename = 'idl.json';
          interfaceContent = await generateIDL({
            contractName: contractName || '',
            address,
            chainId: chainId,
            abi,
          });
        } else {
          // 以太坊合约 - 获取ABI
          filename = 'abi.json';
          interfaceContent = await generateABI({
            contractName: contractName || '',
            address,
            chainId: chainId,
            abi,
          });
        }

        // 处理initialFiles数组：将Solana合约的abi.json替换为idl.json
        const updatedFiles = [...initialFiles];
        
        // 1. 先查找并过滤掉所有的abi.json和idl.json文件
        const filteredFiles = updatedFiles.filter(file => {
          // 对于Solana合约，移除abi.json和idl.json
          if (contractType === 'solana' || isSolanaProgram) {
            return !(file.path.endsWith('abi.json') || file.path.endsWith('idl.json'));
          }
          // 对于以太坊合约，移除abi.json
          return !file.path.endsWith('abi.json');
        });
        
        // 2. 添加新的接口文件
        const interfaceFile = {
          name: filename,
          path: filename,
          content: interfaceContent,
        };
        filteredFiles.push(interfaceFile);

        // 设置更新后的文件列表
        setFiles(filteredFiles);
        setAbiFileContent(interfaceContent);
        setLoadingAbi(false);
      } catch (error) {
        console.error('Failed to fetch interface data:', error);
        setLoadingAbi(false);
      }
    };

    if (address) {
      fetchInterfaceData();
    }
  }, [address, chainId, contractName, contractType, isSolanaProgram, abi, initialFiles]);

  // Add abi.json or idl.json to the allFiles array
  const interfaceFile: ContractFile =
    contractType === "proxy"
      ? {
          name: interfaceFileName,
          path: `proxy/${interfaceFileName}`,
          content: abiFileContent || JSON.stringify([], null, 2),
        }
      : {
          name: interfaceFileName,
          path: `implementation/${interfaceFileName}`,
          content: abiFileContent || JSON.stringify([], null, 2),
        };

  // 添加一个函数，用于确保所有已经存在的文件使用正确的文件名
  const ensureCorrectFileNames = (inputFiles: ContractFile[]): ContractFile[] => {
    if (!isSolanaProgram) return inputFiles;
    
    return inputFiles.map(file => {
      // 对于Solana程序，将abi.json转换为idl.json
      if (file.name === 'abi.json' || file.path.endsWith('/abi.json')) {
        const newName = file.name.replace('abi.json', 'idl.json');
        const newPath = file.path.replace('abi.json', 'idl.json');
        
        return {
          ...file,
          name: newName,
          path: newPath
        };
      }
      return file;
    });
  };
  
  // 确保文件列表中的abi.json被转为idl.json（如果是Solana程序）
  const correctedFiles = ensureCorrectFileNames(files);
  
  // 对过滤后的文件进行同样的转换
  const correctedFilteredFiles = ensureCorrectFileNames(filteredFiles);

  // Build allFiles array with deduplication for report files
  const allFiles = [
    // Keep non-report files
    ...correctedFilteredFiles.filter((f) => !f.path.startsWith("report-")),
    // 只有当原始文件列表中不存在这些文件时才添加它们
    // README文件
    ...(correctedFiles.some(f => f.path === "README.md") ? [] : [readmeFile]),
    // config.json文件 - 检查是否存在任何config.json文件
    ...(correctedFiles.some(f => f.path.endsWith("config.json")) ? [] : [configFile]), 
    // abi.json或idl.json文件 - 检查是否存在任何abi.json或idl.json文件
    ...(correctedFiles.some(f => 
      (isSolanaProgram && f.path.endsWith("idl.json")) || 
      (!isSolanaProgram && f.path.endsWith("abi.json"))
    ) ? [] : [interfaceFile]),
    // Keep all report files without deduplication
    ...correctedFiles.filter((f) => f.path.startsWith("report-")),
  ];

  // Build file tree
  const buildFileTree = (files: ContractFile[]): FileTreeNode => {
    const root: FileTreeNode = {
      name: "",
      type: "directory",
      path: "",
      children: [],
    };

    files.forEach((file) => {
      // 对于Solana合约，确保所有abi.json文件都改为idl.json
      let fileName = file.name;
      let filePath = file.path;
      
      if (isSolanaProgram && (fileName === "abi.json" || fileName.endsWith("/abi.json"))) {
        fileName = fileName.replace("abi.json", "idl.json");
        filePath = filePath.replace("abi.json", "idl.json");
      }
      
      // Remove proxy/ or implementation/ prefixes
      const cleanPath = filePath.replace(/^(proxy|implementation)\//, "");
      const parts = cleanPath.split("/");
      let current = root;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // File node
          current.children = current.children || [];
          // 使用可能修改过的文件名
          current.children.push({
            name: index === parts.length - 1 ? fileName.split('/').pop() || fileName : part,
            type: "file",
            path: filePath, // Use potentially modified path
            content: file.content,
          });
        } else {
          // Directory node
          current.children = current.children || [];
          let child = current.children.find(
            (node) => node.type === "directory" && node.name === part
          );

          if (!child) {
            child = {
              name: part,
              type: "directory",
              path: parts.slice(0, index + 1).join("/"),
              children: [],
            };
            current.children.push(child);
          }
          current = child;
        }
      });
    });

    // Recursively sort the children of each directory
    const sortNodes = (node: FileTreeNode): FileTreeNode => {
      if (node.children) {
        // First recursively process all children
        node.children = node.children.map(sortNodes);

        // Then sort the children of the current level
        node.children.sort((a, b) => {
          // If types are different, directories come first
          if (a.type !== b.type) {
            return a.type === "directory" ? -1 : 1;
          }
          // If types are the same, sort by name alphabetically
          return a.name.localeCompare(b.name);
        });
      }
      return node;
    };

    // Compress single-path directory nodes and sort
    return sortNodes(compressPath(root));
  };

  // Build file tree - using the file list containing README.md
  const fileTree = buildFileTree(allFiles);

  // Handle window size adjustment
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      if (newWidth > 150 && newWidth < 600) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // 添加一个useEffect来同步initialFiles和files状态
  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  return (
    <>
      <div
        className="bg-[#252526] border-r border-[#1E1E1E] flex flex-col overflow-hidden"
        style={{ width: `${width}px` }}
      >
        {/* Contract Type Switcher */}
        {hasProxyContract && hasImplementationContract && (
          <div className="flex flex-col p-2 gap-2 border-b border-[#1E1E1E]">
            <div className="flex gap-1">
              <button
                onClick={() => {
                  onContractTypeChange("proxy");
                  const proxyFile = files.find((f) =>
                    f.path.startsWith("proxy/")
                  );
                  if (proxyFile) onFileSelect(proxyFile);
                }}
                className={`flex-1 px-3 py-1.5 rounded text-sm flex items-center justify-center gap-2 transition-colors
                  ${
                    contractType === "proxy"
                      ? "bg-[#1E1E1E] text-white"
                      : "text-gray-400 hover:text-white hover:bg-[#2D2D2D]"
                  }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
                Proxy
              </button>
              <button
                onClick={() => {
                  onContractTypeChange("implementation");
                  const implFile = files.find((f) =>
                    f.path.startsWith("implementation/")
                  );
                  if (implFile) onFileSelect(implFile);
                }}
                className={`flex-1 px-3 py-1.5 rounded text-sm flex items-center justify-center gap-2 transition-colors
                  ${
                    contractType === "implementation"
                      ? "bg-[#1E1E1E] text-white"
                      : "text-gray-400 hover:text-white hover:bg-[#2D2D2D]"
                  }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Implementation
              </button>
            </div>
          </div>
        )}

        {/* File Explorer Title with Wrap Toggle */}
        <div className="p-4 text-white font-medium border-b border-[#1E1E1E] flex items-center justify-between">
          <span>Files</span>
          <button
            onClick={() => onWrapChange(!isWrapped)}
            className="px-2 py-1 hover:bg-[#333333] text-gray-400 
              rounded-md transition-colors flex items-center gap-1.5 text-xs"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isWrapped ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
            {isWrapped ? "Unwrap" : "Wrap"}
          </button>
        </div>

        {/* File Tree */}
        <div className="flex-1 overflow-auto">
          {fileTree.children?.map((node, index) => (
            <FileTreeView
              key={node.path + index}
              node={node}
              onFileSelect={onFileSelect}
              selectedPath={selectedFile?.path}
            />
          ))}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="w-1 hover:w-1 cursor-col-resize bg-transparent hover:bg-[#2DD4BF]/20 
                   active:bg-[#2DD4BF]/40 transition-colors"
        onMouseDown={() => setIsResizing(true)}
      >
        <div className="w-px h-full bg-[#333333]" />
      </div>
    </>
  );
}
