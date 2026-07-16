import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { AdminRoute, PublicRoute, StudentRoute, StudentRouteWrapped, SKDRoute, AdminSKDRoute } from './components/layout/ProtectedRoute';

const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const LatihanSoal = React.lazy(() => import('./pages/LatihanSoal'));
const PusatTryout = React.lazy(() => import('./pages/tryout/PusatTryout'));
const TryoutSession = React.lazy(() => import('./pages/TryoutSession'));
const TryoutSessionNew = React.lazy(() => import('./pages/TryoutSessionNew'));
const TryoutSubtesSelect = React.lazy(() => import('./pages/tryout/TryoutSubtesSelect'));
const Bookmark = React.lazy(() => import('./pages/Bookmark'));
const Riwayat = React.lazy(() => import('./pages/Riwayat'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
const ManageLatihan = React.lazy(() => import('./pages/admin/ManageLatihan'));
const LatihanPraktik = React.lazy(() => import('./pages/tryout/LatihanPraktik'));
const LatihanResult = React.lazy(() => import('./pages/tryout/LatihanResult'));
const TryoutResult = React.lazy(() => import('./pages/tryout/TryoutResult'));
const TopikLatihan = React.lazy(() => import('./pages/tryout/TopikLatihan'));
const ManageTryout = React.lazy(() => import('./pages/admin/ManageTryout'));
const TryoutDashboard = React.lazy(() => import('./pages/admin/TryoutDashboard'));
const QuestionReview = React.lazy(() => import('./pages/admin/QuestionReview'));
const ManageBattleSoal = React.lazy(() => import('./pages/admin/ManageBattleSoal'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const PaketBelajar = React.lazy(() => import('./pages/PaketBelajar'));
const Cart = React.lazy(() => import('./pages/Cart'));
const ManageVouchers = React.lazy(() => import('./pages/admin/ManageVouchers'));
const KonsultasiKakZ = React.lazy(() => import('./pages/KonsultasiKakZ'));
const BattleLobby = React.lazy(() => import('./pages/BattleLobby'));
const BattleGame = React.lazy(() => import('./pages/BattleGame'));
const BattleLeaderboard = React.lazy(() => import('./pages/BattleLeaderboard'));
const PrediksiSkor = React.lazy(() => import('./pages/PrediksiSkor'));
const Rasionalisasi = React.lazy(() => import('./pages/Rasionalisasi'));
const UjianMandiri = React.lazy(() => import('./pages/UjianMandiri'));
const UjianMandiriDetail = React.lazy(() => import('./pages/UjianMandiriDetail'));
const ManageUjianMandiri = React.lazy(() => import('./pages/admin/ManageUjianMandiri'));
const ManageLatihanSKD = React.lazy(() => import('./pages/admin/ManageLatihanSKD'));
const ManageTryoutSKD = React.lazy(() => import('./pages/admin/ManageTryoutSKD'));
const ManageTryoutRegistrations = React.lazy(() => import('./pages/admin/ManageTryoutRegistrations'));
const ManageSocialVerifications = React.lazy(() => import('./pages/admin/ManageSocialVerifications'));
const LatihanSoalUM = React.lazy(() => import('./pages/LatihanSoalUM'));
const LatihanSoalUMResult = React.lazy(() => import('./pages/LatihanSoalUMResult'));
const TryoutSessionUM = React.lazy(() => import('./pages/TryoutSessionUM'));
const TryoutUMResult = React.lazy(() => import('./pages/TryoutUMResult'));
const AdminActivity = React.lazy(() => import('./pages/admin/AdminActivity'));
const Profile = React.lazy(() => import('./pages/Profile'));
const ManageDuplicates = React.lazy(() => import('./pages/admin/ManageDuplicates'));
const LeaderboardPage = React.lazy(() => import('./pages/LeaderboardPage'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = React.lazy(() => import('./pages/TermsAndConditions'));
const ContactUs = React.lazy(() => import('./pages/ContactUs'));
const Careers = React.lazy(() => import('./pages/Careers'));
const ApplyJob = React.lazy(() => import('./pages/ApplyJob'));
const BlogList = React.lazy(() => import('./pages/BlogList'));
const BlogDetail = React.lazy(() => import('./pages/BlogDetail'));
const Fellowship = React.lazy(() => import('./pages/Fellowship'));
const CMSLayout = React.lazy(() => import('./components/layout/CMSLayout'));
const CertificateVerify = React.lazy(() => import('./pages/CertificateVerify'));
const CMSDashboard = React.lazy(() => import('./pages/cms/CMSDashboard'));
const CMSArticles = React.lazy(() => import('./pages/cms/CMSArticles'));
const CMSCareers = React.lazy(() => import('./pages/cms/CMSCareers'));
const CMSFellowship = React.lazy(() => import('./pages/cms/CMSFellowship'));
const CMSActivityLogs = React.lazy(() => import('./pages/cms/CMSActivityLogs'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const SKDHome = React.lazy(() => import('./pages/skd/SKDHome'));
const SKDTryoutSession = React.lazy(() => import('./pages/skd/SKDTryoutSession'));
const SKDTryoutResult = React.lazy(() => import('./pages/skd/SKDTryoutResult'));
const SKDLatihan = React.lazy(() => import('./pages/skd/SKDLatihan'));
const SKDLatihanSession = React.lazy(() => import('./pages/skd/SKDLatihanSession'));
const SKDLatihanResult = React.lazy(() => import('./pages/skd/SKDLatihanResult'));
import ScrollToTop from './components/ScrollToTop';


function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <React.Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#faf8ff' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #0050cb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                <p style={{ color: '#424656', fontSize: '14px', fontFamily: 'sans-serif', margin: 0 }}>Memuat halaman...</p>
              </div>
            </div>
          }>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/careers/daftar/:type/:jobId" element={<ApplyJob />} />
            <Route path="/careers/verify/:id" element={<CertificateVerify />} />
            <Route path="/careers/verify" element={<CertificateVerify />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/fellowship" element={<Fellowship />} />
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
              <Route path="/rasionalisasi" element={<Rasionalisasi />} />
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
              {/* SKD CPNS Routes */}
              <Route element={<SKDRoute />}>
                <Route path="/skd" element={<SKDHome />} />
                <Route path="/skd/tryout/:sessionId" element={<SKDTryoutSession />} />
                <Route path="/skd/tryout/hasil/:sessionId" element={<SKDTryoutResult />} />
                <Route path="/skd/latihan/:subjectId" element={<SKDLatihan />} />
                <Route path="/skd/latihan/:subjectId/session" element={<SKDLatihanSession />} />
                <Route path="/skd/latihan/:subjectId/hasil/:sessionId" element={<SKDLatihanResult />} />
              </Route>
            </Route>

            {/* Student routes that need PageWrapper (no own navbar) */}
            <Route element={<StudentRouteWrapped />}>
              <Route path="/bookmark" element={<Bookmark />} />
            </Route>
            
            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />}>
                <Route path="users" element={<UserManagement />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="latihan" element={<ManageLatihan />} />
                <Route path="tryout" element={<ManageTryout />} />
                <Route path="tryout-dashboard" element={<TryoutDashboard />} />
                <Route path="question-review" element={<QuestionReview />} />
                <Route path="battle" element={<ManageBattleSoal />} />
                <Route path="ujian-mandiri" element={<ManageUjianMandiri />} />
                <Route element={<AdminSKDRoute />}>
                  <Route path="skd-latihan" element={<ManageLatihanSKD />} />
                  <Route path="skd-tryout" element={<ManageTryoutSKD />} />
                </Route>
                <Route path="tryout-registrations" element={<ManageTryoutRegistrations />} />
                <Route path="social-verifications" element={<ManageSocialVerifications />} />
                <Route path="activity" element={<AdminActivity />} />
                <Route path="duplicates" element={<ManageDuplicates />} />
                <Route path="vouchers" element={<ManageVouchers />} />
              </Route>
              <Route path="/cms" element={<CMSLayout />}>
                <Route index element={<CMSDashboard />} />
                <Route path="articles" element={<CMSArticles />} />
                <Route path="careers" element={<CMSCareers />} />
                <Route path="fellowship" element={<CMSFellowship />} />
                <Route path="activity" element={<CMSActivityLogs />} />
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
            </Routes>
          </React.Suspense>
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
