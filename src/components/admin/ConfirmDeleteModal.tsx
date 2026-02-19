import { AlertTriangle, Loader2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  customMessage?: string;
  isLoading?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  customMessage,
  isLoading = false,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Confirmation</h3>
              <p className="text-sm text-zinc-300 leading-relaxed mb-1">
                Are you sure you want to delete <span className="font-semibold text-white">"{itemName}"</span>?
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {customMessage || "This action cannot be undone and will permanently remove this item from the database."}
              </p>
            </div>
          </div>
        </div>
        
        {/* Actions Footer */}
        <div className="bg-zinc-800/50 p-4 px-6 flex items-center justify-end gap-3 border-t border-zinc-800">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
