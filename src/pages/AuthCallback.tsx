import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getValidatedSession, supabase } from '../lib/supabase';
import { ensureProfileForSession } from '../services/profileService';
import { Loader2 } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

export default function AuthCallback() {
  const navigate = useNavigate();
  const callbackHandledRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (callbackHandledRef.current) return;
      callbackHandledRef.current = true;

      const { session, user, error } = await getValidatedSession();
      
      if (error) {
        console.error('Auth callback error:', error.message);
        navigate('/admin/login');
        return;
      }

      if (session && user) {
        console.log("[AuthCallback] Session found for user:", user.id);
        
        try {
          await ensureProfileForSession(session, user);
        } catch (profileError) {
          console.error("[AuthCallback] Error ensuring profile:", profileError);
          await supabase.auth.signOut({ scope: "local" });
          navigate('/admin/login');
          return;
        }

        console.log("[AuthCallback] Redirecting to /admin...");
        navigate('/admin');
      } else {
        navigate('/admin/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-8 md:pt-16 px-4">
      <div className="mb-12 md:mb-20">
        <div className="flex items-center gap-2">
          <BrandLogo iconClassName="h-10 w-10" textClassName="text-2xl md:text-3xl" />
        </div>
      </div>

      <div className="w-full max-w-[440px] bg-white border border-gray-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 flex flex-col items-center justify-center min-h-[240px]">
        <Loader2 className="w-10 h-10 animate-spin text-[#006bff] mb-6" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Finishing sign in...</h1>
        <p className="text-slate-500 text-sm text-center">
          Please wait while we set up your session.
        </p>
      </div>
    </div>
  );
}
