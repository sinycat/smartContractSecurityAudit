import Image from "next/image";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { SecurityIcon, GasIcon, CodeIcon, AIIcon, ComplianceIcon, ReportIcon } from "@/components/Icons";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col">
      <main className="max-w-7xl mx-auto px-4 py-20 flex-1">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-[#E5E5E5] mb-4">
            Smart Contract <span className="text-[#FF8B3E]">Security</span>
          </h1>
          <p className="text-gray-400 text-xl">
            Powered by AI, securing your blockchain future with real-time analysis
          </p>
        </div>

        <div className="flex justify-center gap-6 mb-20">
          <a
            href="/audit"
            className="group relative inline-flex items-center gap-2 px-8 py-4 
                     bg-[#252526] rounded-lg text-[#FF8B3E] text-lg font-medium
                     border border-[#FF8B3E]/20
                     transition-all duration-300 ease-out
                     hover:bg-[#FF8B3E]/10"
          >
            <span className="relative z-10">Start Audit</span>
            <svg 
              className="w-5 h-5 transform transition-transform duration-300 
                         group-hover:translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>

          <a
            href="/docs"
            className="px-8 py-4 bg-[#252526] rounded-lg
                     text-[#CCCCCC] text-lg font-medium
                     border border-[#404040]
                     transition-all duration-300
                     hover:bg-[#2A2A2A] hover:border-[#505050]"
          >
            Documentation
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#2A2A2A]">
            <div className="w-12 h-12 bg-[#FF8B3E]/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#FF8B3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Vulnerability Detection</h3>
            <p className="text-gray-400">
              Real-time scanning and detection of potential security vulnerabilities in smart contracts.
            </p>
          </div>

          <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#2A2A2A]">
            <div className="w-12 h-12 bg-[#FF8B3E]/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#FF8B3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Gas Optimization</h3>
            <p className="text-gray-400">
              Advanced analysis and suggestions for optimizing gas consumption.
            </p>
          </div>

          <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#2A2A2A]">
            <div className="w-12 h-12 bg-[#FF8B3E]/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#FF8B3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Code Quality</h3>
            <p className="text-gray-400">
              Comprehensive code quality assessment with best practice recommendations.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#2A2A2A] mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <div>
              © 2024 mush-support. Licensed under{" "}
              <a
                href="https://github.com/mush-support/mush-audit/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF8B3E] hover:text-[#FF8B3E]/80 transition-colors"
              >
                AGPL-3.0
              </a>
            </div>
            <a
              href="https://github.com/mush-support/mush-audit"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
              aria-label="View on GitHub"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
