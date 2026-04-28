import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { toast } from "sonner";

interface VerificationStepProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  isVerifying: boolean;
}

export const VerificationStep: React.FC<VerificationStepProps> = ({
  email,
  onVerify,
  onResend,
  onBack,
  isVerifying,
}) => {
  const [code, setCode] = React.useState(["", "", "", "", "", ""]);
  const [isResending, setIsResending] = React.useState(false);
  const inputs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Filter non-numeric characters
    if (value && !/^\d$/.test(value)) {
      newCode[index] = "";
      setCode(newCode);
      return;
    }

    // Move to next input
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      toast.error("Please enter the full 6-digit code");
      return;
    }
    await onVerify(fullCode);
  };

  const handleResendClick = async () => {
    setIsResending(true);
    try {
      await onResend();
      toast.success("Code resent successfully!");
    } catch (err) {
      toast.error("Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        type="button"
        onClick={onBack}
        className="absolute -left-3 -top-3 z-20 p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-300 bg-white"
        aria-label="Go back"
      >
        <ArrowLeft className="w-7 h-7 text-blue-600" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20 text-center">
        <div className="max-w-md w-full space-y-10">
          <div className="space-y-4">
            <h2 className="text-[28px] font-bold text-[#1a1a1a]">
              Verify your email
            </h2>
            <p className="text-[16px] text-[#475569] leading-relaxed">
              To complete your booking, enter the 6-digit code sent to
              <br />
              <span className="font-bold text-[#1a1a1a]">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex gap-2.5 justify-center">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-16 md:w-14 md:h-20 text-center text-3xl font-bold border-2 border-slate-200 rounded-xl focus:border-[#006bff] focus:ring-0 outline-none transition-all bg-white"
                  autoFocus={i === 0}
                  disabled={isVerifying}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isVerifying || code.some((d) => !d)}
              className={cn(
                "w-full py-4 px-6 rounded-full text-lg font-bold transition-all transition-duration-300",
                isVerifying || code.some((d) => !d)
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-[#006bff] text-white hover:bg-[#0052cc] shadow-lg shadow-[#006bff]/20 active:scale-[0.98]",
              )}
            >
              {isVerifying ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </div>
              ) : (
                "Continue"
              )}
            </button>
          </form>

          <div className="space-y-4">
            <p className="text-[15px] text-[#475569]">
              Didn't get it?{" "}
              <button
                onClick={handleResendClick}
                disabled={isResending || isVerifying}
                className="text-[#006bff] font-bold hover:underline disabled:opacity-50"
              >
                {isResending ? "Sending..." : "Resend code"}
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 mt-auto">
        <button className="text-[14px] font-medium text-[#475569] hover:text-[#1a1a1a] transition-colors">
          Cookie settings
        </button>
      </div>
    </div>
  );
};
