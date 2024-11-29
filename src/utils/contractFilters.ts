import type { ContractFile } from "@/types/blockchain";

// Define prefixes of third-party library paths to be filtered
const EXCLUDED_PREFIXES = [
  "@",
  "lib/",
  "node_modules/",
  "@openzeppelin/",
  "open-zeppelin/",
  "solmate/",
  "solady/",
  "permit2/",
  "forge-std/",
  ".deps/",
  "test/",
  "script/",
];

// Define third-party libraries to be filtered
const EXCLUDED_LIBRARIES = [
  "openzeppelin",
  "solmate",
  "solady",
  "permit2",
  "forge-std",
  "hardhat",
  "foundry",
];

// Check if a file path should be filtered
export function shouldExcludeFile(path: string): boolean {
  // Convert to lowercase for case-insensitive comparison
  const lowerPath = path.toLowerCase();

  // Check path prefixes
  if (
    EXCLUDED_PREFIXES.some((prefix) =>
      lowerPath.startsWith(prefix.toLowerCase())
    )
  ) {
    return true;
  }

  // Check if it contains third-party library names
  if (EXCLUDED_LIBRARIES.some((lib) => lowerPath.includes(lib.toLowerCase()))) {
    return true;
  }

  return false;
}

// Filter contract files
export function filterContractFiles(files: ContractFile[]): ContractFile[] {
  return files.filter((file) => !shouldExcludeFile(file.path));
}

// Extract main contract file
export function findMainContract(files: ContractFile[]): ContractFile | null {
  const filteredFiles = filterContractFiles(files);

  // If there is only one file, return it directly
  if (filteredFiles.length === 1) {
    return filteredFiles[0];
  }

  // Try to find the main contract file (usually the file matching the contract name)
  // Add more heuristic rules as needed
  return filteredFiles[0] || null;
}

// Merge the contents of multiple contract files
export function mergeContractContents(files: ContractFile[]): string {
  const filteredFiles = filterContractFiles(files);

  return filteredFiles
    .map((file) => {
      // Add file separator and file path comment
      return `\n// File: ${file.path}\n${file.content}`;
    })
    .join("\n");
}
