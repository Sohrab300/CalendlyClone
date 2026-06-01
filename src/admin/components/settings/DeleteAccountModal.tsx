import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, AlertTriangle } from "lucide-react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [confirmationText, setConfirmationText] = React.useState("");
  const isDeleteEnabled = confirmationText === "DELETE";

  const handleConfirm = () => {
    if (isDeleteEnabled) {
      onConfirm();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[100] transition-opacity"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white z-[110] shadow-2xl rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                <h2 className="text-xl font-bold">Delete Account</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to delete your account? This action is{" "}
                <span className="font-bold text-slate-900">permanent</span> and
                cannot be undone. All your meetings, schedules, and profile data
                will be deleted.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  To confirm, type <span className="font-bold text-slate-900">DELETE</span> in the box below:
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isDeleteEnabled}
                className={`flex-1 px-4 py-2.5 bg-[#d93a00] text-white font-bold rounded-lg transition-colors ${
                  isDeleteEnabled ? "hover:bg-[#b83100]" : "opacity-50 cursor-not-allowed"
                }`}
              >
                Delete
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
