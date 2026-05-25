import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "../components/BrandLogo";
import { captureAppError } from "../lib/sentry";

const readApiResponse = async (response: Response) => {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text || response.statusText };
  }
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        captureAppError(new Error(data.error || "Failed to send password reset link"), {
          route: "/forgot-password",
          stage: "request_password_reset",
          status: response.status,
          email,
        });
        toast.error(data.error || "Failed to send password reset link");
        return;
      }

      setIsSent(true);
    } catch (error) {
      captureAppError(error, {
        route: "/forgot-password",
        stage: "request_password_reset",
        email,
      });
      toast.error("Failed to send password reset link");
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
        {isSent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              Check your email
            </h1>
            <p className="text-sm leading-relaxed text-slate-500 mb-8">
              We sent a password reset link to{" "}
              <span className="font-semibold text-slate-900">{email}</span>.
              The link is valid for 5 minutes only.
            </p>
            <Link
              to="/admin/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#006bff] py-4 text-lg font-bold text-white transition hover:bg-[#0052cc]"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Forgot password?
            </h1>
            <p className="text-sm leading-relaxed text-slate-500 mb-8">
              Enter your account email. If it exists, we will send a reset link
              that is valid for 5 minutes only.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full px-4 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#006bff] focus:border-[#006bff] outline-none transition-all placeholder:text-gray-500"
              />

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-4 bg-[#006bff] text-white rounded-xl font-bold text-lg hover:bg-[#0052cc] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Send reset link"
                )}
              </button>
            </form>

            <p className="text-center mt-8 text-slate-500 font-medium">
              Remembered it?{" "}
              <Link
                to="/admin/login"
                className="text-blue-600 font-bold hover:underline"
              >
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
