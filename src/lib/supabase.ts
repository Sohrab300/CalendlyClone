import { createClient } from '@supabase/supabase-js';
import { logOAuthDebug } from './authDebug';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getValidatedSession = async () => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    logOAuthDebug('getValidatedSession found no session', {
      hasSessionError: Boolean(sessionError),
      sessionErrorMessage: sessionError?.message,
    });
    return { session: null, user: null, error: sessionError };
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    logOAuthDebug('getValidatedSession found invalid user; signing out locally', {
      hasUserError: Boolean(userError),
      userErrorMessage: userError?.message,
    });
    await supabase.auth.signOut({ scope: 'local' });
    return { session: null, user: null, error: userError };
  }

  logOAuthDebug('getValidatedSession found valid session', {
    userId: user.id,
    userEmail: user.email,
  });
  return { session, user, error: null };
};
