import React from "react";
import { X } from "lucide-react";
import { motion } from "motion/react";

interface SidebarPanelProps {
  children: React.ReactNode;
  onClose: () => void;
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
  children,
  onClose,
}) => (
  <motion.aside
    initial={{ width: 0, x: 400 }}
    animate={{ width: 400, x: 0 }}
    exit={{ width: 0, x: 400 }}
    transition={{ type: "spring", damping: 28, stiffness: 220 }}
    className="h-full shrink-0 overflow-hidden bg-white shadow-2xl z-50 border-l border-slate-200"
  >
    <div className="w-[400px] h-full flex flex-col">
      <div className="px-4 pt-2 flex items-center justify-end">
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  </motion.aside>
);
