import React from 'react';
import { ChevronDown, ToggleLeft, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface SelectedEventsToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
}

export const SelectedEventsToolbar: React.FC<SelectedEventsToolbarProps> = ({
  selectedCount,
  onClear,
  onDelete,
}) => (
  <AnimatePresence>
    {selectedCount > 0 && (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 flex items-center gap-6 z-50 min-w-[600px]"
      >
        <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-full">
          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
            {selectedCount}
          </span>
          <span className="text-sm font-bold text-slate-700">selected</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>

          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            <ToggleLeft className="w-4 h-4" />
            Toggle on/off
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-slate-200 mx-2" />

        <button
          onClick={onClear}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);
