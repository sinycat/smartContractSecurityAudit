import Image from "next/image";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { SecurityIcon, GasIcon, CodeIcon, AIIcon, ComplianceIcon, ReportIcon, MultiChainIcon } from "@/components/Icons";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col">
      <div className="absolute top-4 right-4 text-gray-400 flex items-center gap-2">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        Real-time Monitoring Active
      </div>

      <main className="max-w-7xl mx-auto px-4 py-16 flex-1">
        {/* Top animated area */}
        <div className="relative text-center mb-16 overflow-hidden">
          <div className="absolute inset-0 flex justify-center">
            <div className="w-full h-full max-w-3xl opacity-20 blur-3xl bg-gradient-to-r from-[#2DD4BF]/30 via-[#3B82F6]/30 to-[#2DD4BF]/30 rounded-full"></div>
          </div>
          
          <h1 className="relative text-6xl font-bold text-[#E5E5E5] mb-6">
            Smart Contract <span className="text-[#2DD4BF]">Security Audit</span>
          </h1>
          <p className="relative text-gray-400 text-xl max-w-2xl mx-auto">
            AI-powered blockchain security solutions with real-time analysis and comprehensive protection
          </p>
          
          {/* Statistics */}
          <div className="relative mt-12 flex justify-center gap-12 text-center">
            <div className="flex flex-col">
              <span className="text-[#2DD4BF] text-4xl font-bold">50+</span>
              <span className="text-gray-400 text-sm">Supported Chains</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#2DD4BF] text-4xl font-bold">3000+</span>
              <span className="text-gray-400 text-sm">Audited Contracts</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#2DD4BF] text-4xl font-bold">99.8%</span>
              <span className="text-gray-400 text-sm">Accuracy Rate</span>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col items-center justify-center gap-6 mb-20">
          <a
            href="/audit"
            className="group relative inline-flex items-center gap-2 px-10 py-4 
                     bg-gradient-to-r from-[#2DD4BF] to-[#06B6D4] rounded-lg text-white text-lg font-medium
                     shadow-lg shadow-[#2DD4BF]/20
                     transition-all duration-300 ease-out
                     hover:shadow-xl hover:shadow-[#2DD4BF]/30 hover:translate-y-[-2px]"
          >
            <span className="relative z-10">Start Security Audit</span>
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
            href="https://github.com/mush-support/mush-audit/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 bg-transparent rounded-lg
                     text-[#CCCCCC] text-base font-medium
                     border border-[#404040]
                     transition-all duration-300
                     hover:bg-[#2A2A2A] hover:border-[#2DD4BF]/50"
            style={{ display: 'none' }}
          >
            View Documentation
          </a>
        </div>

        {/* Feature cards - using grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-[#1E1E1E] to-[#232323] p-6 rounded-xl border border-[#2A2A2A] hover:border-[#2DD4BF]/20 group transition-all duration-300">
            <div className="w-12 h-12 bg-[#2DD4BF]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#2DD4BF]/20 transition-colors">
              <SecurityIcon className="w-6 h-6 text-[#2DD4BF]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#2DD4BF] transition-colors">Security Audit</h3>
            <p className="text-gray-400">
              Comprehensive vulnerability detection and security risk analysis
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#1E1E1E] to-[#232323] p-6 rounded-xl border border-[#2A2A2A] hover:border-[#2DD4BF]/20 group transition-all duration-300">
            <div className="w-12 h-12 bg-[#2DD4BF]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#2DD4BF]/20 transition-colors">
              <GasIcon />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#2DD4BF] transition-colors">Gas Optimization</h3>
            <p className="text-gray-400">
              Smart analysis to minimize transaction costs and gas consumption
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#1E1E1E] to-[#232323] p-6 rounded-xl border border-[#2A2A2A] hover:border-[#2DD4BF]/20 group transition-all duration-300">
            <div className="w-12 h-12 bg-[#2DD4BF]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#2DD4BF]/20 transition-colors">
              <CodeIcon className="w-6 h-6 text-[#2DD4BF]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#2DD4BF] transition-colors">Code Quality</h3>
            <p className="text-gray-400">
              Identify code quality issues and best practice recommendations
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#1E1E1E] to-[#232323] p-6 rounded-xl border border-[#2A2A2A] hover:border-[#2DD4BF]/20 group transition-all duration-300">
            <div className="w-12 h-12 bg-[#2DD4BF]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#2DD4BF]/20 transition-colors">
              <AIIcon className="w-6 h-6 text-[#2DD4BF]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#2DD4BF] transition-colors">AI Powered</h3>
            <p className="text-gray-400">
              Advanced AI models for in-depth security analysis and reporting
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#1E1E1E] to-[#232323] p-6 rounded-xl border border-[#2A2A2A] hover:border-[#2DD4BF]/20 group transition-all duration-300">
            <div className="w-12 h-12 bg-[#2DD4BF]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#2DD4BF]/20 transition-colors">
              <MultiChainIcon className="w-6 h-6 text-[#2DD4BF]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#2DD4BF] transition-colors">Multi-Chain</h3>
            <p className="text-gray-400">
              Support for Ethereum, Solana, and other major blockchains
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#1E1E1E] to-[#232323] p-6 rounded-xl border border-[#2A2A2A] hover:border-[#2DD4BF]/20 group transition-all duration-300">
            <div className="w-12 h-12 bg-[#2DD4BF]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#2DD4BF]/20 transition-colors">
              <ReportIcon />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#2DD4BF] transition-colors">Detailed Reports</h3>
            <p className="text-gray-400">
              Comprehensive reports with actionable security recommendations
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#2A2A2A] mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <div>
              © 2025 <a 
                href="#" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2DD4BF] hover:text-[#2DD4BF]/80 transition-colors"
              >
                AuditX
              </a>. All rights reserved. Service and content protected by law.
            </div>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
              aria-label="Twitter"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
              aria-label="LinkedIn"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
