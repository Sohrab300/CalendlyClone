import React from "react";
import { X } from "lucide-react";
import { motion } from "motion/react";

interface SidebarPanelProps {
  children: React.ReactNode;
  onClose: () => void;
}

const getPanelMode = () => {
  if (typeof window === "undefined") {
    return {
      isFullWidth: false,
      isOverlay: false,
    };
  }

  return {
    isFullWidth: window.innerWidth < 768,
    isOverlay: window.innerWidth < 1024,
  };
};

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
  children,
  onClose,
}) => {
  const [panelMode, setPanelMode] = React.useState(getPanelMode);

  React.useEffect(() => {
    const handleResize = () => setPanelMode(getPanelMode());

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (panelMode.isOverlay) {
    return (
      <>
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-[140] bg-slate-950/40"
          aria-label="Close event panel"
        />

        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 220 }}
          className={`fixed inset-y-0 right-0 z-[150] h-full overflow-hidden border-l border-slate-200 bg-white shadow-2xl ${
            panelMode.isFullWidth ? "w-full border-l-0" : "w-[400px]"
          }`}
        >
          <div className="h-full flex flex-col">
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
      </>
    );
  }

  return (
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
};
