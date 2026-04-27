import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/admin';

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    
    // We try to sign in with OTP (Magic Link) as default based on the UI "Enter your email" -> "Continue"
    // However, if the user wants to use a password, we should handle that too. 
    // To keep it simple and match the "Continue" button feel:
    // We'll check if they typed a password. If not, we'll send a magic link.
    // But since the user might want a simple setup, we can also just show the password field right away or toggle it.
    
    if (showPassword) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
      } else {
        toast.success('Logged in successfully');
        navigate(from, { replace: true });
      }
    } else {
      // Check if user exists or just try to send magic link
      // For this demo/task, we'll offer a way to enter password if they "Continue" but want to use credentials.
      // Or we can just use Magic link. 
      // The user mentioned "manually make users", so maybe they will set passwords.
      
      // Let's offer a "Use password instead" or just show password field if they want.
      // I'll stick to a simple multi-step or just regular form. 
      // Given the "Continue" button, let's assume it leads to password or magic link.
      
      // For now, let's make it a robust Email/Password login but styled like the image.
      setShowPassword(true);
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'azure') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/admin',
      }
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-8 md:pt-16 px-4">
      {/* Logo */}
      <div className="mb-12 md:mb-20">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-[#006bff] rounded-lg flex items-center justify-center">
             <div className="w-6 h-6 border-4 border-white rounded-full border-t-transparent -rotate-45" />
          </div>
          <span className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Calendly</span>
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 md:mb-12">Log in to your account</h1>

      <div className="w-full max-w-[440px] bg-white border border-gray-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10">
        <form onSubmit={handleEmailSubmit} className="space-y-4">
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

          {showPassword && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#006bff] focus:border-[#006bff] outline-none transition-all placeholder:text-gray-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#006bff] text-white rounded-xl font-bold text-lg hover:bg-[#0052cc] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (showPassword ? 'Log in' : 'Continue')}
          </button>
        </form>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => handleSocialLogin('google')}
            className="w-full py-4 border border-gray-300 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all group"
          >
            <div className="w-6 h-6 flex items-center justify-center">
               <svg viewBox="0 0 24 24" className="w-5 h-5">
                 <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                 <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                 <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                 <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
               </svg>
            </div>
            <span className="font-bold text-slate-700">Continue with Google</span>
          </button>

          <button 
            onClick={() => handleSocialLogin('azure')}
            className="w-full py-4 border border-gray-300 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all group"
          >
            <div className="w-6 h-6 flex items-center justify-center">
               <svg viewBox="0 0 23 23" className="w-5 h-5">
                 <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                 <path fill="#f35325" d="M1 1h10v10H1z"/>
                 <path fill="#81bc06" d="M12 1h10v10H12z"/>
                 <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                 <path fill="#ffba08" d="M12 12h10v10H12z"/>
               </svg>
            </div>
            <span className="font-bold text-slate-700">Continue with Microsoft</span>
          </button>
        </div>
      </div>
    </div>
  );
};
