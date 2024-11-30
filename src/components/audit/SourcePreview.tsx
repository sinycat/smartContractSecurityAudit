"use client";

import { useEffect, useRef, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-solidity";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/line-numbers/prism-line-numbers";
import FileExplorer from "./FileExplorer";
import ProxyContractAlert from "./ProxyContractAlert";
import PathBreadcrumb from "./PathBreadcrumb";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { generateReadme } from "@/utils/readme";
import { generateConfig, formatConfig } from "@/utils/config";
import AIConfigModal from "./AIConfigModal";
import toast from "react-hot-toast";
import { analyzeContract } from "@/services/audit/contractAnalyzer";
import { getExplorerUrl } from "@/utils/chainServices";
import { CHAINS } from "@/utils/constants";
import { useAIConfig, getModelName, getAIConfig } from "@/utils/ai";
import type { AIConfig } from "@/utils/ai";

interface ContractFile {
  name: string;
  content: string;
  path: string;
}

interface SourcePreviewProps {
  files: ContractFile[];
  onAnalyze: () => void;
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
  };
  evmVersion?: string;
  tokenName?: string;
  creationCode?: string;
  deployedBytecode?: string;
  abi?: any[];
  implementationAbi?: any[];
}

// Remove duplicate markdown headers
function removeDuplicateHeaders(content: string): string {
  const lines = content.split("\n");
  const seenHeaders = new Set<string>();
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^#{1,6}\s+/)) {
      // Extract header text (without # symbols)
      const headerText = line.replace(/^#{1,6}\s+/, "").trim();
      if (!seenHeaders.has(headerText)) {
        seenHeaders.add(headerText);
        result.push(line);
      }
    } else {
      result.push(line);
    }
  }

  return result.join("\n");
}

export default function SourcePreview({
  files: initialFiles,
  onAnalyze,
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
}: SourcePreviewProps) {
  const [files, setFiles] = useState<ContractFile[]>(initialFiles);
  const [selectedFile, setSelectedFile] = useState<ContractFile>(files[0]);
  const [isWrapped, setIsWrapped] = useState(true);
  const [showProxyAlert, setShowProxyAlert] = useState(false);
  const [contractType, setContractType] = useState<"proxy" | "implementation">(
    "proxy"
  );
  const [showRawReadme, setShowRawReadme] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const codeRef = useRef<HTMLElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const { config } = useAIConfig();

  // Only check once when the component mounts
  useEffect(() => {
    const shouldShowAlert =
      files.some((f) => f.path.startsWith("proxy/")) &&
      files.some((f) => f.path.startsWith("implementation/"));
    if (shouldShowAlert) {
      setShowProxyAlert(true);
    }
  }, []); // Empty dependency array, only run when mounted

  useEffect(() => {
    if (codeRef.current && preRef.current) {
      preRef.current.classList.add("line-numbers");
      Prism.highlightElement(codeRef.current);
      Prism.plugins.lineNumbers.resize(preRef.current);
    }
  }, [selectedFile]);

  // Build Blockscan URL
  const getBlockscanUrl = () => {
    if (!chainId || !address) return null;
    return `https://vscode.blockscan.com/${chainId}/${address}`;
  };

  // Add file tree formatting function
  const formatFileTree = (files: string[]): string => {
    const tree: { [key: string]: any } = {};

    // Build tree structure
    files.forEach((path) => {
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

    // Recursively generate tree string
    const printTree = (node: any, prefix = "", isLast = true): string => {
      let result = "";
      const entries = Object.entries(node);

      entries.forEach(([key, value], index) => {
        const isLastEntry = index === entries.length - 1;
        const linePrefix = prefix + (isLast ? "└── " : "├── ");
        const nextPrefix = prefix + (isLast ? "    " : "│   ");

        result += linePrefix + key + "\n";

        if (value !== null) {
          result += printTree(value, nextPrefix, isLastEntry);
        }
      });

      return result;
    };

    return printTree(tree);
  };

  // Add download source code function
  const handleDownloadSource = async () => {
    const zip = new JSZip();

    // Add contract files
    files.forEach((file) => {
      zip.file(file.path, file.content);
    });

    // Add README.md
    const readmeContent = generateReadme({
      files,
      tokenName,
      proxyInfo: {
        contractName,
        compiler,
        optimization,
        runs,
        evmVersion,
        address,
        chainId,
      },
      implementationInfo: implementationInfo
        ? {
            ...implementationInfo,
          }
        : undefined,
      implementationAddress,
    });

    zip.file("README.md", readmeContent);

    // Check if it's a proxy contract
    const hasProxy = files.some((f) => f.path.startsWith("proxy/"));
    const hasImplementation = files.some((f) =>
      f.path.startsWith("implementation/")
    );

    if (hasProxy && hasImplementation) {
      // Add proxy contract configuration file and ABI
      const proxyConfig = generateConfig({
        contractName,
        compiler,
        optimization,
        runs,
        evmVersion,
        creationCode,
        deployedBytecode,
      });
      zip.file("proxy/config.json", formatConfig(proxyConfig));
      zip.file("proxy/abi.json", JSON.stringify(abi || [], null, 2));

      // Add implementation contract configuration file and ABI
      const implConfig = generateConfig({
        contractName: implementationInfo?.contractName || "",
        compiler: implementationInfo?.compiler || "",
        optimization: implementationInfo?.optimization || false,
        runs: implementationInfo?.runs || 200,
        evmVersion: implementationInfo?.evmVersion,
        creationCode: implementationInfo?.creationCode,
        deployedBytecode: implementationInfo?.deployedBytecode,
      });
      zip.file("implementation/config.json", formatConfig(implConfig));
      zip.file(
        "implementation/abi.json",
        JSON.stringify(implementationAbi || [], null, 2)
      );
    } else {
      // Non-proxy contract, only add one configuration file and ABI
      const config = generateConfig({
        contractName,
        compiler,
        optimization,
        runs,
        evmVersion,
        creationCode,
        deployedBytecode,
      });
      zip.file("config.json", formatConfig(config));
      zip.file("abi.json", JSON.stringify(abi || [], null, 2));
    }

    try {
      const content = await zip.generateAsync({ type: "blob" });
      const fileName = `${
        tokenName || implementationInfo?.contractName || contractName
      }-source.zip`;
      saveAs(content, fileName);
    } catch (error) {
      console.error("Error creating zip file:", error);
    }
  };

  const handleViewImplementation = () => {
    setContractType("implementation");
    const implFile = files.find((f) => f.path.startsWith("implementation/"));
    if (implFile) {
      setSelectedFile(implFile);
    }
  };

  // Handle start analysis button click
  const handleAnalyzeClick = () => {
    setShowAIConfig(true);
  };

  // Handle analysis after AI configuration is complete
  const handleStartAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setShowAIConfig(false);

      // // Perform analysis
      // const result = await analyzeContract({
      //   files,
      //   contractName,
      //   chain: chainId,
      // });

      // // Check if there's a main title, if not add it
      // let analysisContent = result.report.analysis;
      // if (!analysisContent.match(/^#\s+/m)) {
      //   analysisContent = `# Smart Contract Security Analysis Report\n\n${analysisContent}`;
      // }

      // TODO: test
      let analysisContent;
      analysisContent = getModelName(getAIConfig(config));

      // Remove duplicate titles
      analysisContent = removeDuplicateHeaders(analysisContent);

      // Check if it's a proxy contract
      const isProxy =
        files.some((f) => f.path.startsWith("proxy/")) &&
        files.some((f) => f.path.startsWith("implementation/"));

      // Determine report file name based on contract type
      const reportContractName = isProxy
        ? tokenName || implementationInfo?.contractName || contractName
        : contractName;

      // Create report.md file with contract name
      let languageCfg = getAIConfig(config).language;
      if (languageCfg === "english") {
        languageCfg = "";
      } else {
        languageCfg = `-${languageCfg}`;
      }
      const reportFileName = `report-${reportContractName.toLowerCase()}-${getModelName(
        getAIConfig(config)
      )}${languageCfg}.md`;
      const reportFile: ContractFile = {
        name: reportFileName,
        path: reportFileName,
        content: analysisContent,
      };

      setFiles((prevFiles) => {
        // Delete old reports for the same model
        const filesWithoutCurrentModelReport = prevFiles.filter(
          (f) => f.path !== reportFileName
        );

        // Append new report file
        return [...filesWithoutCurrentModelReport, reportFile];
      });

      // Display new report
      setSelectedFile(reportFile);

      toast.success("Analysis completed");
    } catch (error) {
      console.error("Error in analysis:", error);
      toast.error("Error during analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1E1E1E]">
      <div className="absolute top-0 left-0 right-0 h-14 bg-[#252526] border-b border-[#1E1E1E] flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/mush.png"
              alt="Mush Audit"
              width={28}
              height={28}
              className="w-7 h-7"
            />
            <span className="text-xl font-bold text-[#E5E5E5]">
              Mush <span className="text-[#FF8B3E]">Audit</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {getBlockscanUrl() && (
            <a
              href={getBlockscanUrl()!}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-2 px-4 py-1.5
                       bg-[#252526] rounded-lg text-[#CCCCCC] text-sm
                       border border-[#404040]
                       transition-all duration-300
                       hover:bg-[#2A2A2A] hover:border-[#505050]"
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
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              View on Blockscan
            </a>
          )}
          <button
            onClick={handleDownloadSource}
            className="group relative inline-flex items-center gap-2 px-4 py-1.5
                     bg-[#252526] rounded-lg text-[#CCCCCC] text-sm
                     border border-[#404040]
                     transition-all duration-300
                     hover:bg-[#2A2A2A] hover:border-[#505050]"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Source
          </button>
          <button
            onClick={handleAnalyzeClick}
            className="group relative inline-flex items-center gap-2 px-8 py-1.5
                     bg-[#252526] rounded-lg text-[#FF8B3E] text-sm font-medium
                     border border-[#FF8B3E]/20
                     transition-all duration-300 ease-out
                     hover:bg-[#FF8B3E]/10"
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <span className="relative z-10">Start Analysis</span>
          </button>
        </div>
      </div>

      <div className="absolute top-14 bottom-0 left-0 right-0 flex">
        <FileExplorer
          files={files}
          onFileSelect={setSelectedFile}
          selectedFile={selectedFile}
          showImplementation={contractType === "implementation"}
          contractType={contractType}
          onContractTypeChange={setContractType}
          isWrapped={isWrapped}
          onWrapChange={setIsWrapped}
          contractName={contractName}
          compiler={compiler}
          optimization={optimization}
          runs={runs}
          chainId={chainId}
          address={address}
          implementationAddress={implementationAddress}
          implementationInfo={implementationInfo}
          evmVersion={evmVersion}
          tokenName={tokenName}
          creationCode={creationCode}
          deployedBytecode={deployedBytecode}
          abi={abi}
          implementationAbi={implementationAbi}
        />

        <div className="flex-1 flex flex-col bg-[#1E1E1E] min-w-0">
          <div className="px-4 py-2 bg-[#252526] border-b border-[#1E1E1E] text-[#CCCCCC] text-sm flex items-center justify-between">
            <PathBreadcrumb path={selectedFile.path} />
            <div className="flex items-center gap-2">
              {selectedFile.path.endsWith(".md") && (
                <button
                  onClick={() => setShowRawReadme(!showRawReadme)}
                  className="px-3 py-1 hover:bg-[#333333] text-gray-400 text-xs rounded-md transition-colors flex items-center gap-2"
                >
                  {showRawReadme ? "View Rendered" : "View Raw"}
                </button>
              )}
              <button
                onClick={() =>
                  navigator.clipboard.writeText(selectedFile.content)
                }
                className="px-3 py-1 hover:bg-[#333333] text-gray-400 text-xs rounded-md transition-colors flex items-center gap-2"
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
                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                  />
                </svg>
                Copy
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {selectedFile.path.endsWith(".md") ? (
              <div className="relative">
                {showRawReadme ? (
                  <pre className="p-4 text-[#CCCCCC] text-sm font-mono whitespace-pre-wrap">
                    {selectedFile.content}
                  </pre>
                ) : (
                  <div
                    className="p-4 prose prose-invert max-w-none
                                prose-headings:text-[#E5E5E5] 
                                prose-h1:text-3xl prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b prose-h1:border-[#333333]
                                prose-h2:text-xl prose-h2:text-[#FF8B3E] prose-h2:mt-8 prose-h2:mb-4
                                prose-p:text-[#CCCCCC]
                                prose-li:text-[#CCCCCC]
                                prose-strong:text-[#4EC9B0]
                                prose-code:text-[#CE9178] prose-code:bg-[#1E1E1E]
                                [&_ul]:my-0 [&_ul]:pl-4
                                [&_li]:my-1
                                [&_pre]:bg-[#252526]
                                [&_pre]:border [&_pre]:border-[#333333]
                                [&_pre]:rounded-md
                                [&_pre]:shadow-sm"
                  >
                    <ReactMarkdown>{selectedFile.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ) : selectedFile.path.endsWith("config.json") ||
              selectedFile.path.endsWith("abi.json") ? (
              <pre className="p-4 text-[#CCCCCC] text-sm font-mono whitespace-pre">
                {selectedFile.content}
              </pre>
            ) : (
              <pre
                ref={preRef}
                className={`w-full h-full bg-[#1E1E1E] language-solidity line-numbers
                  ${
                    isWrapped
                      ? "whitespace-pre-wrap break-all"
                      : "whitespace-pre"
                  }`}
                style={{ margin: 0 }}
              >
                <code
                  ref={codeRef}
                  className={`language-solidity text-sm font-mono ${
                    isWrapped ? "break-all" : ""
                  }`}
                >
                  {selectedFile.content}
                </code>
              </pre>
            )}
          </div>
        </div>
      </div>

      <ProxyContractAlert
        isOpen={showProxyAlert}
        onClose={() => setShowProxyAlert(false)}
        onViewImplementation={handleViewImplementation}
      />

      <AIConfigModal
        isOpen={showAIConfig}
        onClose={() => setShowAIConfig(false)}
        onStartAnalysis={handleStartAnalysis}
      />

      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-[#1E1E1E] rounded-lg p-8 flex flex-col items-center">
            <div className="relative w-16 h-16 mb-4">
              <div
                className="absolute inset-0 border-4 border-t-[#FF8B3E] border-r-[#FF8B3E]/50 border-b-[#FF8B3E]/30 border-l-[#FF8B3E]/10 
                            rounded-full animate-spin"
              />
              <div className="absolute inset-3 bg-[#1E1E1E] rounded-full flex items-center justify-center">
                <Image
                  src="/mush.png"
                  alt="Loading"
                  width={20}
                  height={20}
                  className="animate-bounce-slow"
                />
              </div>
            </div>
            <p className="text-[#E5E5E5] text-lg mb-2">Analyzing Contract</p>
            <p className="text-gray-400 text-sm">
              This may take a few moments...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
