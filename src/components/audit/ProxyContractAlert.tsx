interface ProxyContractAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onViewImplementation: () => void;
}

export default function ProxyContractAlert({
  isOpen,
  onClose,
  onViewImplementation,
}: ProxyContractAlertProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#252526] 
        rounded-lg border border-[#333333] p-6 w-[480px] z-50 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <div className="p-2 bg-[#FF8B3E]/10 rounded-lg">
            <svg
              className="w-6 h-6 text-[#FF8B3E]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              Proxy Contract Detected
            </h3>
            <p className="text-gray-400 mb-4">
              This is a proxy contract. The actual implementation of the
              contract logic is stored at a different address.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#2D2D2D] hover:bg-[#3D3D3D] text-gray-300 
                  rounded-lg text-sm border border-[#404040] transition-colors"
              >
                Stay on Proxy
              </button>
              <button
                onClick={() => {
                  onViewImplementation();
                  onClose();
                }}
                className="px-4 py-2 bg-[#2D2D2D] hover:bg-[#3D3D3D] text-[#FF8B3E]
                  rounded-lg text-sm border border-[#FF8B3E]/20 transition-colors
                  hover:border-[#FF8B3E]/40 hover:bg-[#FF8B3E]/10"
              >
                View Implementation
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
