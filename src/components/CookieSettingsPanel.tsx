import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Minus } from "lucide-react";
import { cn } from "../lib/utils";

interface CookieSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const CookieSettingsPanel: React.FC<CookieSettingsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const [preferences, setPreferences] = React.useState({
    functional: true,
    performance: true,
    targeting: true,
  });

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
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
            className="fixed inset-0 bg-black/40 z-50 transition-opacity"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-full max-w-md bg-white z-[60] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="text-blue-600 font-bold text-2xl flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center relative">
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center overflow-hidden">
                      <div className="w-full h-1/2 bg-blue-600 absolute bottom-0" />
                    </div>
                  </div>
                  <span className="tracking-tight">Calendly</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4">
                  Privacy Preference Center
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  When you visit any website, it may store or retrieve
                  information on your browser, mostly in the form of cookies.
                  This information might be about you, your preferences or your
                  device and is mostly used to make the site work as you expect
                  it to. The information does not usually directly identify you,
                  but it can give you a more personalized web experience.
                  Because we respect your right to privacy, you can choose not
                  to allow some types of cookies. Click on the different
                  category headings to find out more and change our default
                  settings. However, blocking some types of cookies may impact
                  your experience of the site and the services we are able to
                  offer.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  Manage Consent Preferences
                </h3>

                <div className="space-y-3">
                  {/* Strictly Necessary */}
                  <CookieItem
                    title="Strictly Necessary Cookies"
                    isAlwaysActive
                    content="These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in or filling in forms. You can set your browser to block or alert you about these cookies, but some parts of the site will not then work. These cookies do not store any personally identifiable information."
                  />

                  {/* Functional */}
                  <CookieItem
                    title="Functional Cookies"
                    isActive={preferences.functional}
                    onToggle={() => togglePreference("functional")}
                    content="These cookies enable the website to provide enhanced functionality and personalisation. They may be set by us or by third party providers whose services we have added to our pages. If you do not allow these cookies then some or all of these services may not function properly."
                  />

                  {/* Performance */}
                  <CookieItem
                    title="Performance Cookies"
                    isActive={preferences.performance}
                    onToggle={() => togglePreference("performance")}
                    content="These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous. If you do not allow these cookies we will not know when you have visited our site, and will not be able to monitor its performance."
                  />

                  {/* Targeting */}
                  <CookieItem
                    title="Targeting Cookies"
                    isActive={preferences.targeting}
                    onToggle={() => togglePreference("targeting")}
                    content="These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites. They do not store directly personal information, but are based on uniquely identifying your browser and internet device. If you do not allow these cookies, you will experience less targeted advertising."
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-slate-100 space-y-4">
              <div className="flex flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border-2 border-blue-600 text-blue-600 font-bold rounded-md hover:bg-blue-50 transition-colors text-sm"
                >
                  Reject All
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Confirm My Choices
                </button>
              </div>
              <div className="flex justify-center items-center gap-1 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                <span>Powered by</span>
                <span className="text-slate-600 flex items-center gap-0.5">
                  <div className="w-2 h-2 bg-slate-400 rounded-full" />
                  OneTrust
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const CookieItem = ({
  title,
  isActive,
  onToggle,
  isAlwaysActive = false,
  content,
}: {
  title: string;
  isActive?: boolean;
  onToggle?: () => void;
  isAlwaysActive?: boolean;
  content: string;
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="p-4 bg-white">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-3 text-left group"
          >
            {isExpanded ? (
              <Minus className="w-4 h-4 text-slate-400" />
            ) : (
              <Plus className="w-4 h-4 text-slate-400" />
            )}
            <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
              {title}
            </span>
          </button>

          {isAlwaysActive ? (
            <span className="text-sm font-bold text-blue-600">
              Always Active
            </span>
          ) : (
            <button
              onClick={onToggle}
              className={cn(
                "w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out",
                isActive ? "bg-[#4da14b]" : "bg-slate-300",
              )}
            >
              <div
                className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ease-in-out shadow-sm",
                  isActive ? "left-7" : "left-1",
                )}
              />
            </button>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 pl-7">
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  {content}
                </p>
                <button className="text-sm font-bold text-blue-600 hover:underline">
                  Cookie Details
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CookieSettingsPanel;
