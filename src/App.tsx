/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SchedulingPage from './pages/SchedulingPage';
import AdminDashboard from './admin/AdminDashboard';
import LandingPage from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from 'sonner';
import { supabase } from './lib/supabase';

function RootRedirect() {
  const [redirectPath, setRedirectPath] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function getSlug() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let query = supabase.from('profiles').select('username');
        
        if (user) {
          query = query.eq('id', user.id);
        } else {
          // If not logged in, take the first profile found as the primary host
          query = query.order('created_at', { ascending: true });
        }
        
        const { data, error } = await query.limit(1).single();
        
        if (data?.username) {
          setRedirectPath(`/${data.username}`);
        } else {
          // No profile found, go to login
          console.warn('No profile found or error fetching:', error);
          setRedirectPath('/admin/login');
        }
      } catch (err) {
        console.error('Redirect error:', err);
        setRedirectPath('/admin/login');
      }
    }
    getSlug();
  }, []);

  if (!redirectPath) return null;
  return <Navigate to={redirectPath} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/:userSlug" element={<LandingPage />} />
          <Route path="/:userSlug/:eventSlug" element={<SchedulingPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
