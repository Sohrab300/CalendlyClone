/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SchedulingPage from './pages/SchedulingPage';
import AdminDashboard from './admin/AdminDashboard';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import FeaturesPage from './pages/FeaturesPage';
import CaseStudiesPage from './pages/CaseStudiesPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SignupPage from './pages/SignupPage';
import AuthCallback from './pages/AuthCallback';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product" element={<ProductPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/case-studies" element={<CaseStudiesPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
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
