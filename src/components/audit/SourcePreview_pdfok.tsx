"use client";

import { useEffect, useRef, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-solidity";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-toml";
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
import type { AIConfig } from "@/types/ai";
import html2canvas from "html2canvas";
import { marked } from "marked";
import { handleSaveAsPdf } from "./PDFExporter";
import { generateABI, generateIDL } from "@/utils/abi";

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

// Add save as image function
const handleSaveAsImage = async (content: string, fileName: string) => {
  // Create a temporary div to render Markdown
  const tempDiv = document.createElement("div");
  tempDiv.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 800px;
    padding: 20px;
    background: #1A1A1A;
    color: #E5E5E5;
    font-family: Arial, Helvetica, sans-serif;
  `;
  document.body.appendChild(tempDiv);

  // Render Markdown content
  tempDiv.innerHTML = marked(content);

  try {
    const canvas = await html2canvas(tempDiv, {
      backgroundColor: "#1A1A1A",
      scale: 5, // 增加缩放比例
      useCORS: true,
      logging: false,
      letterRendering: true, // 启用文字渲染增强
      onclone: (document) => {
        // 在克隆的文档中强制使用标准字体
        Array.from(
          document.querySelectorAll("*")
        ).forEach((e: Element) => {
          let existingStyle = e.getAttribute("style") || "";
          e.setAttribute("style", existingStyle + "; font-family: Arial, Helvetica, sans-serif !important; font-weight: normal !important;");
        });
      }
    });

    try {
      // 首先尝试JPEG格式，通常更稳定
      const jpegData = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      link.download = `${fileName.replace(".md", "")}.jpg`;
      link.href = jpegData; 
      link.click();
    } catch (jpegError) {
      console.error("JPEG生成失败，尝试PNG格式:", jpegError);
      
      // 备用方案：尝试PNG格式
      try {
        const pngData = canvas.toDataURL("image/png", 0.95);
        const link = document.createElement("a");
        link.download = `${fileName.replace(".md", "")}.png`;
        link.href = pngData;
        link.click();
      } catch (pngError) {
        console.error("PNG生成也失败:", pngError);
        toast.error("无法保存图像，请尝试减小内容量或分段保存");
        
        // 尝试最终备用方案：Blob方式导出
        try {
          canvas.toBlob(function(blob) {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.download = `${fileName.replace(".md", "")}_backup.jpg`;
              link.href = url;
              link.click();
              setTimeout(() => URL.revokeObjectURL(url), 60000);
            } else {
              throw new Error("Blob创建失败");
            }
          }, 'image/jpeg', 0.8);
        } catch (blobError) {
          console.error("所有图像生成方式都失败:", blobError);
          toast.error("无法保存图像，请截图或复制内容到其他应用");
        }
      }
    }
  } catch (error) {
    console.error("Error generating image:", error);
    toast.error("Failed to generate image: " + (error instanceof Error ? error.message : String(error)));
  } finally {
    document.body.removeChild(tempDiv);
  }
};

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
  creator,
  creationTxHash,
}: SourcePreviewProps) {
  // 检测是否为Solana程序
  const isSolanaProgram = compiler && compiler.includes("Solana");
  
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
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

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
      
      // 根据文件扩展名设置正确的语言
      if (selectedFile) {
        // 移除之前的所有语言类
        const previousLanguage = codeRef.current.className.match(/language-\w+/);
        if (previousLanguage) {
          codeRef.current.classList.remove(previousLanguage[0]);
        }
        
        // 获取文件扩展名并设置对应的语言
        const ext = selectedFile.name.split('.').pop()?.toLowerCase();
        let language = 'solidity'; // 默认
        
        if (ext === 'rs') {
          language = 'rust';
        } else if (ext === 'sol') {
          language = 'solidity';
        } else if (ext === 'md') {
          language = 'markdown';
        } else if (ext === 'json') {
          language = 'json';
        } else if (ext === 'info' || ext === 'txt') {
          language = 'bash'; // 使用bash高亮来显示信息文件
        } else if (ext === 'toml') {
          language = 'markup'; // 使用markup来显示TOML文件
        } else if (ext === 'yaml' || ext === 'yml') {
          language = 'yaml';
        }
        
        codeRef.current.classList.add(`language-${language}`);
      }
      
      Prism.highlightElement(codeRef.current);
      Prism.plugins.lineNumbers.resize(preRef.current);
      
      // 添加强制样式应用
      setTimeout(() => {
        // 对特定语言的一些元素进行样式强制覆盖
        if (codeRef.current) {
          // 获取CSS变量
          const getComputedColor = (varName: string) => {
            return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
          };

          // 颜色配置
          const colors = {
            blue: getComputedColor('--syntax-blue') || '#3B9EFF',
            lightBlue: getComputedColor('--syntax-light-blue') || '#59BAFF',
            cyan: getComputedColor('--syntax-cyan') || '#2DD4BF',
            brightCyan: getComputedColor('--syntax-bright-cyan') || '#06EFE0',
            green: getComputedColor('--syntax-green') || '#4ADE80',
            softGreen: getComputedColor('--syntax-soft-green') || '#65D1A7',
            teal: getComputedColor('--syntax-teal') || '#5FD9CD',
            lavender: getComputedColor('--syntax-lavender') || '#A389F4',
            purple: getComputedColor('--syntax-purple') || '#C792EA',
            pink: getComputedColor('--syntax-pink') || '#FF7B9D',
            coral: getComputedColor('--syntax-coral') || '#FF7F78',
            orange: getComputedColor('--syntax-orange') || '#FFB86C',
            yellow: getComputedColor('--syntax-yellow') || '#FFFFA5',
            gray: getComputedColor('--syntax-gray') || '#A8B9BF',
            brightGray: getComputedColor('--syntax-bright-gray') || '#D9E1E4',
          };

          // 处理所有文本节点，通过内容匹配特定元素
          const processElementsByContent = () => {
            const elements = codeRef.current?.querySelectorAll('.token');
            if (!elements) return;
            
            elements.forEach(el => {
              const text = el.textContent || '';
              const parentClasses = (el.parentElement?.className || '');
              const isRust = parentClasses.includes('rust');
              const isSolidity = parentClasses.includes('solidity');
              
              // 控制流关键字
              const controlKeywords = ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'match', 'loop', 'yield'];
              if (controlKeywords.some(kw => text === kw)) {
                (el as HTMLElement).style.color = colors.lightBlue;
              }
              
              // 可见性修饰符
              const visibilityModifiers = ['public', 'private', 'internal', 'external', 'pub', 'protected'];
              if (visibilityModifiers.some(mod => text === mod)) {
                (el as HTMLElement).style.color = colors.pink;
              }
              
              // 布尔值和特殊常量
              const specialConstants = ['true', 'false', 'null', 'undefined', 'None', 'Some', 'Ok', 'Err'];
              if (specialConstants.some(sc => text === sc)) {
                (el as HTMLElement).style.color = colors.yellow;
              }
              
              // Rust特定处理
              if (isRust) {
                // Rust核心关键字
                const rustCoreKeywords = ['fn', 'struct', 'enum', 'impl', 'trait', 'mod', 'use', 'type', 'let', 'const', 'static'];
                if (rustCoreKeywords.some(kw => text === kw)) {
                  (el as HTMLElement).style.color = colors.blue;
                  (el as HTMLElement).style.fontWeight = '500';
                }
                
                // Rust特殊标识符
                const rustSpecialIdentifiers = ['self', 'Self', 'super', 'crate'];
                if (rustSpecialIdentifiers.some(si => text === si)) {
                  (el as HTMLElement).style.color = colors.purple;
                }
                
                // Rust属性和宏
                if (text.startsWith('#') || text.startsWith('derive')) {
                  (el as HTMLElement).style.color = colors.pink;
                }
                
                // Rust特殊函数
                const rustSpecialFunctions = ['unwrap', 'expect', 'panic', 'println', 'format', 'vec'];
                if (el.classList.contains('function') && rustSpecialFunctions.some(sf => text.includes(sf))) {
                  (el as HTMLElement).style.color = colors.brightCyan;
                }
                
                // Rust错误处理相关
                if (text.includes('Error') || text.includes('Invalid')) {
                  (el as HTMLElement).style.color = colors.coral;
                }
                
                // Rust类型
                const rustTypes = ['u8', 'u16', 'u32', 'u64', 'u128', 'i8', 'i16', 'i32', 'i64', 'i128', 'f32', 'f64', 'bool', 'char', 'str', 'String', 'Vec', 'Option', 'Result'];
                if (rustTypes.some(t => text === t)) {
                  (el as HTMLElement).style.color = colors.cyan;
                }
              }
              
              // Solidity特定处理
              if (isSolidity) {
                // Solidity核心关键字
                const solidityCoreKeywords = ['pragma', 'solidity', 'contract', 'library', 'interface', 'import', 'using', 'struct', 'event', 'enum', 'constructor', 'modifier'];
                if (solidityCoreKeywords.some(kw => text === kw)) {
                  (el as HTMLElement).style.color = colors.blue;
                  (el as HTMLElement).style.fontWeight = '500';
                }
                
                // Solidity可见性修饰符
                const solidityVisibilityModifiers = ['public', 'private', 'internal', 'external'];
                if (solidityVisibilityModifiers.some(vm => text === vm)) {
                  (el as HTMLElement).style.color = colors.pink;
                }
                
                // Solidity状态修饰符
                const solidityStateModifiers = ['view', 'pure', 'payable', 'constant', 'immutable'];
                if (solidityStateModifiers.some(sm => text === sm)) {
                  (el as HTMLElement).style.color = colors.lavender;
                }
                
                // Solidity类型
                const solidityTypes = ['address', 'uint', 'uint8', 'uint256', 'int', 'bool', 'bytes', 'bytes32', 'string', 'mapping'];
                if (solidityTypes.some(t => text.includes(t) && !text.includes('.'))) {
                  (el as HTMLElement).style.color = colors.cyan;
                }
                
                // Solidity特殊函数
                const soliditySpecialFunctions = ['require', 'assert', 'revert', 'transfer', 'send', 'call'];
                if (soliditySpecialFunctions.some(sf => text === sf)) {
                  (el as HTMLElement).style.color = colors.coral;
                  (el as HTMLElement).style.fontWeight = '500';
                }
                
                // Solidity特殊变量
                const soliditySpecialVars = ['msg.sender', 'msg.value', 'block.timestamp', 'block.number', 'tx.origin', 'this', 'now'];
                if (soliditySpecialVars.some(sv => text.includes(sv))) {
                  (el as HTMLElement).style.color = colors.purple;
                }
                
                // Solidity继承
                if (text === 'is') {
                  (el as HTMLElement).style.color = colors.blue;
                }
                
                // Solidity数字或单位
                if (/^\d+$/.test(text) || ['wei', 'gwei', 'ether', 'seconds', 'minutes', 'hours', 'days', 'weeks'].includes(text)) {
                  (el as HTMLElement).style.color = colors.orange;
                }
              }
              
              // 通用元素处理
              
              // 函数名
              if (el.classList.contains('function')) {
                (el as HTMLElement).style.color = colors.brightCyan;
              }
              
              // 字符串
              if (el.classList.contains('string')) {
                (el as HTMLElement).style.color = colors.green;
              }
              
              // 注释
              if (el.classList.contains('comment')) {
                (el as HTMLElement).style.color = colors.softGreen;
                (el as HTMLElement).style.fontStyle = 'italic';
                (el as HTMLElement).style.opacity = '0.8';
              }
              
              // 标点符号
              if (el.classList.contains('punctuation')) {
                (el as HTMLElement).style.color = colors.gray;
                // 特殊标点符号
                if (text === '{' || text === '}' || text === '(' || text === ')' || text === '[' || text === ']') {
                  (el as HTMLElement).style.color = colors.brightGray;
                  (el as HTMLElement).style.opacity = '0.9';
                }
              }
              
              // 数字
              if (el.classList.contains('number')) {
                (el as HTMLElement).style.color = colors.orange;
              }
              
              // 运算符
              if (el.classList.contains('operator')) {
                (el as HTMLElement).style.color = colors.brightCyan;
              }
            });
          };
          
          // 处理所有元素的样式
          const processElementsByClass = () => {
            // 基本元素
            const styleMap: {[key: string]: {color: string, weight?: string, style?: string, opacity?: string}} = {
              '.token.keyword': {color: colors.blue, weight: '500'},
              '.token.function': {color: colors.brightCyan},
              '.token.string': {color: colors.green},
              '.token.number': {color: colors.orange},
              '.token.comment': {color: colors.softGreen, style: 'italic', opacity: '0.8'},
              '.token.punctuation': {color: colors.gray, opacity: '0.9'},
              '.token.operator': {color: colors.brightCyan, weight: '500'},
              '.token.class-name': {color: colors.cyan},
              '.token.property': {color: colors.lavender},
              '.token.builtin': {color: colors.cyan},
              '.token.variable': {color: colors.teal},
              '.token.parameter': {color: colors.teal},
              '.token.boolean': {color: colors.yellow},
            };
            
            // 应用样式
            Object.entries(styleMap).forEach(([selector, style]) => {
              const elements = codeRef.current?.querySelectorAll(selector);
              elements?.forEach(el => {
                (el as HTMLElement).style.color = style.color;
                if (style.weight) (el as HTMLElement).style.fontWeight = style.weight;
                if (style.style) (el as HTMLElement).style.fontStyle = style.style;
                if (style.opacity) (el as HTMLElement).style.opacity = style.opacity;
              });
            });
          };
          
          // 执行样式处理
          processElementsByClass();
          processElementsByContent();
        }
      }, 100);
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
        creationCode,
        deployedBytecode,
        creator,
        creationTxHash,
      },
      implementationInfo: implementationInfo
        ? {
            ...implementationInfo,
          }
        : undefined,
      implementationAddress,
    });

    zip.file("README.md", readmeContent);

    // 根据编译器类型决定生成abi.json还是idl.json
    const abiFileName = isSolanaProgram ? "idl.json" : "abi.json";

    // Check if it's a proxy contract
    const hasProxy = files.some((f) => f.path.startsWith("proxy/"));
    const hasImplementation = files.some((f) =>
      f.path.startsWith("implementation/")
    );

    // 获取ABI/IDL数据
    try {
      // 如果是代理合约与实现合约
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
        
        // 获取代理合约接口数据
        const proxyAbiContent = isSolanaProgram 
          ? await generateIDL({ contractName, address, chainId, abi })
          : await generateABI({ contractName, address, chainId, abi });
        
        zip.file(`proxy/${abiFileName}`, proxyAbiContent);

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
        
        // 获取实现合约接口数据
        const implAbiContent = isSolanaProgram
          ? await generateIDL({ 
              contractName: implementationInfo?.contractName || "", 
              address: implementationAddress, 
              chainId, 
              abi: implementationAbi 
            })
          : await generateABI({ 
              contractName: implementationInfo?.contractName || "", 
              address: implementationAddress, 
              chainId, 
              abi: implementationAbi 
            });
        
        zip.file(
          `implementation/${abiFileName}`,
          implAbiContent
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
        
        // 获取合约接口数据
        const abiContent = isSolanaProgram
          ? await generateIDL({ contractName, address, chainId, abi })
          : await generateABI({ contractName, address, chainId, abi });
        
        zip.file(`${abiFileName}`, abiContent);
      }
    } catch (error) {
      console.error("获取合约接口数据失败:", error);
      // 发生错误时使用空数组作为备用
      if (hasProxy && hasImplementation) {
        zip.file(`proxy/${abiFileName}`, JSON.stringify(abi || [], null, 2));
        zip.file(`implementation/${abiFileName}`, JSON.stringify(implementationAbi || [], null, 2));
      } else {
        zip.file(`${abiFileName}`, JSON.stringify(abi || [], null, 2));
      }
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
      const controller = new AbortController();
      setAbortController(controller);

      const result = await analyzeContract({
        files,
        contractName,
        chain: chainId,
        signal: controller.signal,
      });

      // Check if there's a main title, if not add it
      let analysisContent = result.report.analysis;
      if (!analysisContent.match(/^#\s+/m)) {
        analysisContent = `# Smart Contract Security Analysis Report\n\n${analysisContent}`;
      }

      // // TODO: test
      // let analysisContent;
      // analysisContent = getModelName(getAIConfig(config));

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

      let withSuperPrompt = getAIConfig(config).superPrompt
        ? "-SuperPrompt"
        : "";

      const reportFileName = `report-${reportContractName.toLowerCase()}-${getModelName(
        getAIConfig(config)
      )}${languageCfg}${withSuperPrompt}.md`;
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
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        toast.success("Analysis cancelled");
      } else {
        console.error("Error in analysis:", error);
        toast.error("Error during analysis");
      }
    } finally {
      setIsAnalyzing(false);
      setAbortController(null);
    }
  };

  // Add cancel analysis function
  const handleCancelAnalysis = () => {
    if (abortController) {
      abortController.abort();
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
            <div className="relative w-8 h-8 flex items-center justify-center bg-[#2DD4BF] rounded-lg overflow-hidden">
              <svg 
                className="w-5 h-5 text-[#121212]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {/* A字母 - 左移 */}
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M1 20L7 4L13 20" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M3 14H11" 
                />
                
                {/* X字母 - 左移 */}
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M15 4L22 20" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M22 4L15 20" 
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-[#E5E5E5]">
              <span className="text-[#2DD4BF]">AuditX</span>
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
            className="py-2 px-4 bg-[#252526] rounded-lg text-[#2DD4BF] text-sm font-medium
                     border border-[#2DD4BF]/20
                     transition-colors
                     hover:bg-[#2DD4BF]/10"
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
          creator={creator}
          creationTxHash={creationTxHash}
        />

        <div className="flex-1 flex flex-col bg-[#1E1E1E] min-w-0">
          <div className="px-4 py-2 bg-[#252526] border-b border-[#1E1E1E] text-[#CCCCCC] text-sm flex items-center justify-between">
            <PathBreadcrumb path={selectedFile.path} />
            <div className="flex items-center gap-2">
              {selectedFile.path.endsWith(".md") && (
                <>
                  {!showRawReadme && (
                    <>
                      <button
                        onClick={() =>
                          handleSaveAsImage(
                            selectedFile.content,
                            selectedFile.name
                          )
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
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Save as Image
                      </button>
                      <button
                        onClick={() => handleSaveAsPdf(selectedFile.content, selectedFile.name)}
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
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        Save as PDF
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowRawReadme(!showRawReadme)}
                    className="px-3 py-1 hover:bg-[#333333] text-gray-400 text-xs rounded-md transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {showRawReadme ? (
                        // Review icon - for View Rendered
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      ) : (
                        // Code icon - for View Raw
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      )}
                    </svg>
                    {showRawReadme ? "View Rendered" : "View Raw"}
                  </button>
                </>
              )}
              <button
                onClick={() =>
                  navigator.clipboard.writeText(selectedFile.content).then(() => {
                    toast.success("内容已复制到剪贴板");
                  }).catch((err) => {
                    console.error("复制失败:", err);
                    toast.error("复制失败");
                  })
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
                                prose-h2:text-xl prose-h2:text-[#2DD4BF] prose-h2:mt-8 prose-h2:mb-4
                                prose-p:text-[#CCCCCC]
                                prose-li:text-[#CCCCCC]
                                prose-strong:text-[#4EC9B0]
                                prose-code:text-[#5EEAD4] prose-code:bg-[#1E1E1E]
                                [&_ul]:my-0 [&_ul]:pl-4
                                [&_li]:my-1
                                [&_pre]:bg-[#252526]
                                [&_pre]:border [&_pre]:border-[#333333]
                                [&_pre]:rounded-md
                                [&_pre]:shadow-sm
                                [&_blockquote]:border-l-[#2DD4BF] [&_blockquote]:bg-[#2DD4BF]/5
                                [&_a]:text-[#2DD4BF] [&_a]:no-underline hover:[&_a]:underline"
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
                Analyzing Contract
              </h3>
              <p className="text-sm text-gray-400">
                AI model is examining your contract for security issues...
              </p>
              <div className="flex justify-center gap-1.5 mt-2">
                <span className="w-2 h-2 bg-[#2DD4BF]/30 rounded-full animate-pulse"></span>
                <span className="w-2 h-2 bg-[#2DD4BF]/60 rounded-full animate-pulse delay-100"></span>
                <span className="w-2 h-2 bg-[#2DD4BF]/90 rounded-full animate-pulse delay-200"></span>
              </div>
            </div>
            <button
              onClick={handleCancelAnalysis}
              className="mt-6 px-4 py-2 bg-[#252526] text-[#2DD4BF] rounded-md 
                       border border-[#2DD4BF]/20
                       hover:bg-[#2DD4BF]/10 transition-colors
                       font-medium"
            >
              Cancel Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}