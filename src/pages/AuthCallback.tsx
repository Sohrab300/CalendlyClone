import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getValidatedSession, supabase } from '../lib/supabase';
import { ensureProfileForSession } from '../services/profileService';
import { Loader2 } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { logOAuthDebug, readOAuthAttempt } from '../lib/authDebug';

export default function AuthCallback() {
  const navigate = useNavigate();
  const callbackHandledRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (callbackHandledRef.current) return;
      callbackHandledRef.current = true;

      logOAuthDebug('Auth callback page loaded', {
        previousAttempt: readOAuthAttempt(),
        hasSearchCode: new URLSearchParams(window.location.search).has('code'),
        hasSearchError: new URLSearchParams(window.location.search).has('error'),
        hasHashAccessToken: new URLSearchParams(window.location.hash.replace(/^#/, '')).has('access_token'),
        hasHashError: new URLSearchParams(window.location.hash.replace(/^#/, '')).has('error'),
      });

      const { session, user, error } = await getValidatedSession();
      logOAuthDebug('Auth callback session validation completed', {
        hasSession: Boolean(session),
        userId: user?.id,
        userEmail: user?.email,
        errorMessage: error?.message,
      });
      
      if (error) {
        console.error('Auth callback error:', error.message);
        navigate('/admin/login');
        return;
      }

      if (session && user) {
        console.log("[AuthCallback] Session found for user:", user.id);
        
        try {
          await ensureProfileForSession(session, user);
          logOAuthDebug('Auth callback profile ensured', {
            userId: user.id,
          });
        } catch (profileError) {
          console.error("[AuthCallback] Error ensuring profile:", profileError);
          logOAuthDebug('Auth callback profile ensure failed; signing out', {
            userId: user.id,
            errorMessage:
              profileError instanceof Error
                ? profileError.message
                : String(profileError),
          });
          await supabase.auth.signOut({ scope: "local" });
          navigate('/admin/login');
          return;
        }

        console.log("[AuthCallback] Redirecting to /admin...");
        logOAuthDebug('Auth callback navigating to admin');
        navigate('/admin');
      } else {
        logOAuthDebug('Auth callback had no valid session; navigating to login');
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
