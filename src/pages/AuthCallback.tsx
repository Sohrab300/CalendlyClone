import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getValidatedSession, supabase } from '../lib/supabase';
import { availabilityService } from '../services/availabilityService';
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
          // 1. Check if profile exists, if not create it
          console.log("[AuthCallback] Checking if profile exists...");
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (profileError) {
            console.error("[AuthCallback] Error fetching profile:", profileError);
            await supabase.auth.signOut({ scope: "local" });
            navigate('/admin/login');
            return;
          }

          if (!profile) {
            console.log("[AuthCallback] Profile NOT found. Creating profile for new Google user...");
            const googleName = user.user_metadata.full_name || user.user_metadata.name || "";
            const googleEmail = user.email || "";
            const baseUsername = (user.user_metadata.preferred_username || 
                                 user.user_metadata.name || 
                                 user.email?.split("@")[0] || 
                                 "user").toLowerCase().replace(/[^a-z0-9]/g, "");
            
            const { error: insertError } = await supabase
              .from("profiles")
              .insert([
                {
                  id: user.id,
                  full_name: googleName,
                  email: googleEmail,
                  username: `${baseUsername}${Math.floor(Math.random() * 1000)}`,
                  google_refresh_token: session.provider_refresh_token,
                  google_access_token: session.provider_token,
                },
              ]);
            
            if (insertError) {
              console.error("[AuthCallback] CRITICAL: Error creating profile:", insertError);
              await supabase.auth.signOut({ scope: "local" });
              navigate('/admin/login');
              return;
            } else {
              console.log("[AuthCallback] Profile created successfully.");
            }
          } else {
            console.log("[AuthCallback] Profile already exists.");
          }

          // 2. Check if this is a new user by checking schedules count
          console.log("[AuthCallback] Checking schedules count for seeding...");
          const { count, error: countError } = await supabase
            .from("schedules")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

          if (countError) {
            console.error("[AuthCallback] Error checking schedules:", countError);
          }

          console.log("[AuthCallback] Schedules count:", count);

          if (!countError && count === 0) {
            console.log("[AuthCallback] New user detected (0 schedules). Starting seeding...");
            await availabilityService.seedNewUser(user.id);
            console.log("[AuthCallback] Seeding function call finished.");
          } else {
            console.log("[AuthCallback] Skipping seeding (schedules already exist or error occurred).");
          }
        } catch (seedError) {
          console.error("[AuthCallback] UNEXPECTED ERROR during profile/seed flow:", seedError);
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
