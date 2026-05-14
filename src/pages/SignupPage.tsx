import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getValidatedSession, supabase } from "../lib/supabase";
import { ensureProfileForSession } from "../services/profileService";
import { toast } from "sonner";
import { 
  Loader2, 
  Mail, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  User, 
  AtSign,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BrandLogo } from "../components/BrandLogo";

type SignupStep = 1 | 2 | 3 | 4;

const hasOAuthCallbackParams = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return (
    searchParams.has("code") ||
    searchParams.has("error") ||
    hashParams.has("access_token") ||
    hashParams.has("refresh_token") ||
    hashParams.has("error")
  );
};

export default function SignupPage() {
  const [step, setStep] = useState<SignupStep>(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const authCallbackHandledRef = useRef(false);

  // Handle Google OAuth callback for Method 1 and Step 4
  useEffect(() => {
    const handleAuthCallback = async () => {
      if (!hasOAuthCallbackParams()) return;
      if (authCallbackHandledRef.current) return;
      authCallbackHandledRef.current = true;

      const { session, user } = await getValidatedSession();
      if (session && user) {
        try {
          await ensureProfileForSession(session, user);
        } catch (error) {
          console.error("[Signup-OAuth] Error ensuring profile:", error);
          await supabase.auth.signOut({ scope: "local" });
          toast.error("We could not finish setting up your profile. Please try again.");
          return;
        }

        navigate("/admin");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
        scopes: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.send",
        redirectTo: window.location.origin + "/signup",
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      const response = await fetch("/api/auth/send-signup-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("OTP sent to your email");
        setStep(2);
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return;
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-signup-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();
      if (response.ok) {
        setStep(3);
      } else {
        toast.error(data.error || "Invalid or expired OTP. Please try again.");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const createProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username) return;
    setLoading(true);

    try {
      const { data: existingUsername, error: usernameError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (usernameError) {
        toast.error("Could not validate username. Please try again.");
        setLoading(false);
        return;
      }

      if (existingUsername) {
        toast.error("That username is already taken.");
        setLoading(false);
        return;
      }

      // Create user in Supabase Auth (using a dummy password for now since we verified email)
      // Actually, Supabase doesn't allow creating user without password easily via client SDK if email is already verified by us.
      // But we can use signInWithOtp (magic link) or just signUp with a random password.
      // Alternatively, we can use a dedicated signup route on backend.
      // For this task, I'll use signUp with a random password.
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: Math.random().toString(36).slice(-12), // Random password
        options: {
          data: {
            full_name: fullName,
            username: username,
          }
        }
      });

      if (authError) {
        toast.error(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: authData.user.id,
              full_name: fullName,
              username: username,
              email: email,
            },
          ]);

        if (profileError) {
          console.error("[Signup-Email] Error inserting profile:", profileError);
          if (authData.session) {
            await ensureProfileForSession(authData.session, authData.user);
            setStep(4);
          } else {
            toast.error(profileError.message);
          }
        } else {
          console.log("[Signup-Email] Profile created. Starting seeding...");
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              await ensureProfileForSession(session, authData.user);
            }
            console.log("[Signup-Email] Seeding finished.");
          } catch (seedError) {
            console.error("[Signup-Email] Error during seeding:", seedError);
          }
          setStep(4);
        }
      }
    } catch (err) {
      toast.error("Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const skipGoogle = () => {
    navigate("/admin");
  };

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-8 md:pt-16 px-4">
      <div className="mb-12 md:mb-16">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <BrandLogo iconClassName="h-10 w-10" textClassName="text-2xl md:text-3xl" />
        </div>
      </div>

      <div className="w-full max-w-[440px]">
        <div className="flex items-center justify-between mb-6 px-2">
          <h1 className="text-xl font-bold text-slate-900">
            {step === 4 ? "Final Step" : "Create your account"}
          </h1>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Step {step} of 4
          </span>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-4 border border-gray-300 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all group mb-8"
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  </div>
                  <span className="font-bold text-slate-700">Continue with Google</span>
                </button>

                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-4 bg-white text-gray-400 font-bold uppercase tracking-widest">
                      or
                    </span>
                  </div>
                </div>

                <form onSubmit={sendOTP} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#006bff] focus:border-[#006bff] outline-none transition-all placeholder:text-gray-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full py-4 bg-[#006bff] text-white rounded-xl font-bold text-lg hover:bg-[#0052cc] transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-blue-100"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-600 mb-6 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm font-bold">Back</span>
                </button>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h2>
                <p className="text-slate-500 text-sm mb-8">
                  We sent a 6-digit code to <span className="text-slate-900 font-semibold">{email}</span>
                </p>

                <form onSubmit={verifyOTP} className="space-y-8">
                  <div className="flex justify-between gap-2">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-12 h-14 text-center text-2xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#006bff] focus:border-[#006bff] outline-none transition-all"
                      />
                    ))}
                  </div>

                  <div className="space-y-4">
                    <button
                      type="submit"
                      disabled={loading || otp.join("").length < 6}
                      className="w-full py-4 bg-[#006bff] text-white rounded-xl font-bold text-lg hover:bg-[#0052cc] transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-blue-100"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Code"}
                    </button>
                    <button
                      type="button"
                      onClick={sendOTP}
                      className="w-full text-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Resend code
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-bold text-slate-900 mb-8">Tell us about yourself</h2>

                <form onSubmit={createProfile} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#006bff] focus:border-[#006bff] outline-none transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Username
                    </label>
                    <div className="relative">
                      <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="johndoe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#006bff] focus:border-[#006bff] outline-none transition-all placeholder:text-gray-400"
                      />
                    </div>
                    {username && (
                      <p className="text-[11px] font-medium text-slate-400 mt-2 ml-1">
                        Your link: <span className="text-blue-600">devschedule.edu/{username}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !fullName || !username}
                    className="w-full py-4 bg-[#006bff] text-white rounded-xl font-bold text-lg hover:bg-[#0052cc] transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-blue-100"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Connect your Google account</h2>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  To send booking confirmations and manage your calendar, we need access to:
                </p>

                <div className="space-y-4 mb-10 text-left">
                  <div className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Send emails on your behalf</h4>
                      <p className="text-xs text-slate-500 mt-0.5">So your invitees receive confirmations from you</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                      <Calendar className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Access your Google Calendar</h4>
                      <p className="text-xs text-slate-500 mt-0.5">So we can automatically create meeting events</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-4 bg-[#006bff] text-white rounded-xl font-bold text-lg hover:bg-[#0052cc] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Connect Google Account"}
                  </button>
                  <button
                    onClick={skipGoogle}
                    className="text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-10 text-slate-500 font-medium">
          Already have an account?{" "}
          <Link to="/admin/login" className="text-blue-600 font-bold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
