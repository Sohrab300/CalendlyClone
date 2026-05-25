import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "../components/BrandLogo";

const readApiResponse = async (response: Response) => {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text || response.statusText };
  }
};

export default function ResetPasswordPage() {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [isComplete, setIsComplete] = React.useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";
  const hasResetInfo = Boolean(email && token);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        toast.error(data.error || "Failed to update password");
        return;
      }

      setIsComplete(true);
    } catch {
      toast.error("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-8 md:pt-16 px-4">
      <div className="mb-12 md:mb-20">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <BrandLogo iconClassName="h-10 w-10" />
        </div>
      </div>

      <div className="w-full max-w-[440px] bg-white border border-gray-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10">
        {isComplete ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              Password updated
            </h1>
            <p className="text-sm leading-relaxed text-slate-500 mb-8">
              You can now log in with your new password.
            </p>
            <Link
              to="/admin/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#006bff] py-4 text-lg font-bold text-white transition hover:bg-[#0052cc]"
            >
              Log in
            </Link>
          </div>
        ) : !hasResetInfo ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              Invalid reset link
            </h1>
            <p className="text-sm leading-relaxed text-slate-500 mb-8">
              This password reset link is missing required information. Please
              request a new link.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#006bff] py-4 text-lg font-bold text-white transition hover:bg-[#0052cc]"
            >
              Request new link
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Set new password
            </h1>
            <p className="text-sm leading-relaxed text-slate-500 mb-8">
              Enter and confirm your new password. This reset link is valid for
              5 minutes only.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#006bff] focus:border-[#006bff] outline-none transition-all placeholder:text-gray-500"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#006bff] focus:border-[#006bff] outline-none transition-all placeholder:text-gray-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full py-4 bg-[#006bff] text-white rounded-xl font-bold text-lg hover:bg-[#0052cc] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Update password"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
