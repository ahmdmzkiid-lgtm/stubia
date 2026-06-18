import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { AdminRoute, PublicRoute, StudentRoute, StudentRouteWrapped } from './components/layout/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LatihanSoal from './pages/LatihanSoal';
import PusatTryout from './pages/tryout/PusatTryout';
import TryoutSession from './pages/TryoutSession';
import TryoutSessionNew from './pages/TryoutSessionNew';
import TryoutSubtesSelect from './pages/tryout/TryoutSubtesSelect';
import Bookmark from './pages/Bookmark';
import Riwayat from './pages/Riwayat';
import AdminDashboard from './pages/admin/AdminDashboard';
import InputSoal from './pages/admin/InputSoal';
import ImportCSV from './pages/admin/ImportCSV';
import UserManagement from './pages/admin/UserManagement';
import AdminSettings from './pages/admin/AdminSettings';
import ManageTodos from './pages/admin/ManageTodos';
import ManageLatihan from './pages/admin/ManageLatihan';
import LatihanPraktik from './pages/tryout/LatihanPraktik';
import LatihanResult from './pages/tryout/LatihanResult';
import TryoutResult from './pages/tryout/TryoutResult';
import TopikLatihan from './pages/tryout/TopikLatihan';
import ManageTryout from './pages/admin/ManageTryout';
import ManageBattleSoal from './pages/admin/ManageBattleSoal';
import PricingPage from './pages/PricingPage';
import PaketBelajar from './pages/PaketBelajar';
import Cart from './pages/Cart';
import ManageVouchers from './pages/admin/ManageVouchers';
import KonsultasiKakZ from './pages/KonsultasiKakZ';
import BattleLobby from './pages/BattleLobby';
import BattleGame from './pages/BattleGame';
import BattleLeaderboard from './pages/BattleLeaderboard';
import PrediksiSkor from './pages/PrediksiSkor';
import UjianMandiri from './pages/UjianMandiri';
import UjianMandiriDetail from './pages/UjianMandiriDetail';
import ManageUjianMandiri from './pages/admin/ManageUjianMandiri';
import ManageTryoutRegistrations from './pages/admin/ManageTryoutRegistrations';
import ManageSocialVerifications from './pages/admin/ManageSocialVerifications';
import LatihanSoalUM from './pages/LatihanSoalUM';
import LatihanSoalUMResult from './pages/LatihanSoalUMResult';
import TryoutSessionUM from './pages/TryoutSessionUM';
import TryoutUMResult from './pages/TryoutUMResult';
import AdminActivity from './pages/admin/AdminActivity';
import Profile from './pages/Profile';
import ManageDuplicates from './pages/admin/ManageDuplicates';
import LeaderboardPage from './pages/LeaderboardPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import ContactUs from './pages/ContactUs';
import Careers from './pages/Careers';
import ScrollToTop from './components/ScrollToTop';


function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/careers" element={<Careers />} />
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          
          {/* Student routes — pages have their own navbar/layout */}
          <Route element={<StudentRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/latihan" element={<LatihanSoal />} />
            <Route path="/tryout/packages" element={<PusatTryout />} />
            <Route path="/latihan/praktik/:subjectId" element={<LatihanPraktik />} />
            <Route path="/latihan/hasil" element={<LatihanResult />} />
            <Route path="/latihan/hasil/:sessionId" element={<LatihanResult />} />
            <Route path="/latihan/:subjectId" element={<TopikLatihan />} />
            <Route path="/tryout/select/:packageId" element={<TryoutSubtesSelect />} />
            <Route path="/tryout/:sessionId" element={<TryoutSession />} />
            <Route path="/tryout/new/:sessionId" element={<TryoutSessionNew />} />
            <Route path="/tryout/hasil/:sessionId" element={<TryoutResult />} />
            <Route path="/riwayat" element={<Riwayat />} />
            <Route path="/konsultasi" element={<KonsultasiKakZ />} />
            <Route path="/battle" element={<BattleLobby />} />
            <Route path="/battle/game/:matchId" element={<BattleGame />} />
            <Route path="/battle/leaderboard/:subjectId" element={<BattleLeaderboard />} />
            <Route path="/prediksi-skor" element={<PrediksiSkor />} />
            <Route path="/ujian-mandiri" element={<UjianMandiri />} />
            <Route path="/ujian-mandiri/:id" element={<UjianMandiriDetail />} />
            <Route path="/ujian-mandiri/:ujianId/latihan/:latihanId" element={<LatihanSoalUM />} />
            <Route path="/ujian-mandiri/:ujianId/latihan/:latihanId/hasil" element={<LatihanSoalUMResult />} />
            <Route path="/ujian-mandiri/:ujianId/latihan/:latihanId/hasil/:sessionId" element={<LatihanSoalUMResult />} />
            <Route path="/ujian-mandiri/:ujianId/tryout/:tryoutId" element={<TryoutSessionUM />} />
            <Route path="/ujian-mandiri/:ujianId/tryout/:tryoutId/hasil/:sessionId" element={<TryoutUMResult />} />
            <Route path="/leaderboard/:type/:id" element={<LeaderboardPage />} />
            <Route path="/paket-belajar" element={<PaketBelajar />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Student routes that need PageWrapper (no own navbar) */}
          <Route element={<StudentRouteWrapped />}>
            <Route path="/bookmark" element={<Bookmark />} />
          </Route>
          
          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />}>
              <Route path="input" element={<InputSoal />} />
              <Route path="import" element={<ImportCSV />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="todos" element={<ManageTodos />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="latihan" element={<ManageLatihan />} />
              <Route path="tryout" element={<ManageTryout />} />
              <Route path="battle" element={<ManageBattleSoal />} />
              <Route path="ujian-mandiri" element={<ManageUjianMandiri />} />
              <Route path="tryout-registrations" element={<ManageTryoutRegistrations />} />
              <Route path="social-verifications" element={<ManageSocialVerifications />} />
              <Route path="activity" element={<AdminActivity />} />
              <Route path="duplicates" element={<ManageDuplicates />} />
              <Route path="vouchers" element={<ManageVouchers />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster
          position="top-right"
          containerStyle={{
            top: '85px',
          }}
          toastOptions={{
            duration: 2500,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '14px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
