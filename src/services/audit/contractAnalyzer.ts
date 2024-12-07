import { analyzeWithAI, getAIConfig } from "@/utils/ai";
import { generateReport } from "./reportGenerator";
import { mergeContractContents } from "@/utils/contractFilters";
import type { ContractFile } from "@/types/blockchain";
import { SECURITY_AUDIT_PROMPT } from "@/services/audit/prompts";
import { createPromptWithSupperPrompt } from "@/utils/prompts";
import { createPromptWithLanguage } from "@/utils/language";
import { AIConfig } from "@/types/ai";

// Format AI response content
function formatAIResponse(content: string): string {
  if (!content) return "";

  // Remove redundant Title lines and Title fields
  let formatted = content
    .replace(/### Title:.*\n/g, "")
    .replace(/- Title:.*\n/g, "");

  // Add dashes only to fields without them
  formatted = formatted.replace(
    /^(?!- )(Severity|Description|Impact|Location|Recommendation):/gm,
    "- $1:"
  );

  // bold text
  formatted = formatted.replace(/(\*\*[^*]+\*\*):/g, (match) => `\n${match}\n`);

  // make sure each ### title has a newline after it
  formatted = formatted.replace(/(### [^\n]+)(\n\*\*)/g, "$1\n$2");

  // Remove "```markdown"
  formatted = formatted.replace(/```markdown/g, "");

  // Remove extra newlines (more than 2 consecutive empty lines)
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  return formatted;
}

interface AnalysisResult {
  filteredFiles: ContractFile[];
  vulnerabilities: any[];
  optimizations: any[];
  report: {
    analysis: string;
    [key: string]: any;
  };
}

export async function analyzeContract(params: {
  files: ContractFile[];
  contractName?: string;
  chain?: string;
  signal?: AbortSignal;
  isMultiFile?: boolean;
}): Promise<AnalysisResult> {
  const maxRetries = 3;
  let retryCount = 0;
  let lastError: any;

  const savedConfig = localStorage.getItem("ai_config");
  if (!savedConfig) {
    throw new Error("AI configuration not found");
  }
  const config: AIConfig = JSON.parse(savedConfig);

  while (retryCount < maxRetries) {
    try {
      if (params.signal?.aborted) {
        throw new Error("Analysis cancelled");
      }

      // Skip filtering for multi-file mode
      let filesToAnalyze = params.isMultiFile 
        ? params.files 
        : params.files.filter((file) => {
            if (
              file.path.includes("/interfaces/") ||
              file.path.includes("Interface") ||
              file.path.startsWith("IERC") ||
              file.path.startsWith("ERC") ||
              file.path.startsWith("EIP")
            ) {
              return false;
            }

            if (
              file.path.includes("@openzeppelin/") ||
              file.path.includes("node_modules/") ||
              file.path.includes("@paulrberg/")
            ) {
              return false;
            }

            return true;
          });

      if (filesToAnalyze.length === 0) {
        throw new Error("No contract files to analyze after filtering");
      }

      // For non-multi-file mode, handle proxy/implementation separation
      if (!params.isMultiFile) {
        const proxyFiles = filesToAnalyze.filter((f) =>
          f.path.startsWith("proxy/")
        );
        const implementationFiles = filesToAnalyze.filter((f) =>
          f.path.startsWith("implementation/")
        );
        const regularFiles = filesToAnalyze.filter(
          (f) =>
            !f.path.startsWith("proxy/") && !f.path.startsWith("implementation/")
        );

        if (proxyFiles.length > 0 && implementationFiles.length > 0) {
          filesToAnalyze = implementationFiles;
        } else {
          filesToAnalyze = regularFiles;
        }
      }

      const mergedCode = mergeContractContents(filesToAnalyze, !params.isMultiFile);
      if (!mergedCode) {
        throw new Error("No valid contract code to analyze");
      }

      let finalPrompt = createPromptWithLanguage(
        SECURITY_AUDIT_PROMPT.replace("${mergedCode}", mergedCode).replace(
          "${params.contractName ? params.contractName : ''}",
          params.contractName || ""
        ),
        config.language
      );

      // if we have super prompt, add it to the final prompt
      // exclude o1-mini and o1-preview because they don't support super prompt
      if (
        config.superPrompt &&
        config.selectedModel !== "o1-mini" &&
        config.selectedModel !== "o1-preview"
      ) {
        // console.log("Using super prompt");
        finalPrompt = await createPromptWithSupperPrompt(finalPrompt);
      }

      // Get AI response
      const aiResponse = await analyzeWithAI(finalPrompt, params.signal);
      if (!aiResponse) {
        throw new Error("Failed to get AI analysis response");
      }

      // Format AI response
      const formattedResponse = formatAIResponse(aiResponse);

      // Generate report
      const report = await generateReport({
        code: mergedCode,
        files: filesToAnalyze,
        aiAnalysis: formattedResponse,
        vulnerabilities: [],
        gasOptimizations: [],
        contractName: params.contractName,
        chain: params.chain,
      });

      return {
        filteredFiles: filesToAnalyze,
        vulnerabilities: [],
        optimizations: [],
        report: {
          analysis: formattedResponse,
        },
      };
    } catch (error: unknown) {
      if (
        (error instanceof Error && error.name === "AbortError") ||
        params.signal?.aborted
      ) {
        throw new Error("Analysis cancelled");
      }
      lastError = error;
      retryCount++;

      // if we have retry chances, wait and retry
      if (retryCount < maxRetries) {
        console.log(
          `Analysis attempt ${retryCount} failed, retrying in ${
            retryCount * 2
          } seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, retryCount * 2000));
        continue;
      }

      // if we have reached the maximum retry count, throw the last error
      console.error(`Analysis failed after ${maxRetries} attempts:`, error);
      throw new Error(
        `Analysis failed after ${maxRetries} attempts: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  throw new Error(
    `Unexpected error: Analysis failed after ${maxRetries} attempts`
  );
}
