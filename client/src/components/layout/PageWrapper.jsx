import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Footer from '../Footer';
import StudentNavbar from './StudentNavbar';

const PageWrapper = ({ children }) => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8ff', fontFamily: "'Inter', sans-serif" }}>
      <StudentNavbar user={user} isAdmin={isAdmin} onLogout={handleLogout} />
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8 pt-20 sm:pt-24">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PageWrapper;
