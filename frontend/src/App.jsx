import React, { useState } from 'react';
import { Routes, Route, NavLink, Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Menu, X, Volume2, VolumeX } from 'lucide-react';
import { useVoiceContext } from './context/VoiceContext';
import './App.css';

// Components
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import MyCommittees from './pages/MyCommittees';
import CommitteeDashboard from './pages/CommitteeDashboard';
import AiAdvisor from './pages/AiAdvisor';
import VoiceNavigator from './components/VoiceNavigator';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import useSessionTimeout from './hooks/useSessionTimeout';
import SessionWarningModal from './components/SessionWarningModal';


function App() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isVoiceEnabled, toggleVoice } = useVoiceContext();
  
  // useAutoLogout(15); // Replaced by enterprise-grade session timeout below
  const { showWarning, resetTimer } = useSessionTimeout(10, 60);

  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="app flex flex-col min-h-screen">
        <VoiceNavigator />
        {/* Navigation Bar */}
        <nav className="navbar">
          <div className="container">
            <Link to="/" className="logo" onClick={closeMobileMenu}>
              <ShieldCheck size={32} color="#D4AF37" />
              <span>{t('common.app_name')}</span>
            </Link>

            <div className="navbar-tools-flex" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={toggleVoice}
                className="btn btn-text voice-toggle-btn"
                title={isVoiceEnabled ? "Disable Voice Guidance" : "Enable Voice Guidance"}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px', borderRadius: '20px', border: isVoiceEnabled ? '1px solid #D4AF37' : '1px solid transparent' }}
              >
                {isVoiceEnabled ? <Volume2 size={18} color="#D4AF37" /> : <VolumeX size={18} />}
                <span className="hide-mobile" style={{ fontSize: '12px' }}>{isVoiceEnabled ? 'ON' : 'OFF'}</span>
              </button>
              <LanguageSwitcher />
              <div className={`nav-links ${mobileMenuOpen ? 'nav-links-mobile' : ''}`}>
                {user && (
                  <>
                    <NavLink
                      to="/dashboard"
                      className="btn btn-text"
                      onClick={closeMobileMenu}
                    >
                      {t('common.dashboard')}
                    </NavLink>
                    <NavLink
                      to="/committees"
                      className="btn btn-text"
                      onClick={closeMobileMenu}
                    >
                      {t('common.active_committees')}
                    </NavLink>
                    <NavLink
                      to="/advisor"
                      className="btn btn-accent"
                      onClick={closeMobileMenu}
                      style={{ marginLeft: '10px' }}
                    >
                      {t('nav.ai_advisor')}
                    </NavLink>
                  </>
                )}

                {user ? (
                  <button
                    onClick={handleLogout}
                    className="btn btn-accent"
                    style={{ border: 'none', cursor: 'pointer' }}
                  >
                    {t('common.logout')}
                  </button>
                ) : (
                  <NavLink
                    to="/login"
                    className="btn btn-accent"
                    onClick={closeMobileMenu}
                  >
                    {t('common.login')}
                  </NavLink>
                )}
              </div>
            </div>

            <button
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
              style={{ marginLeft: '10px' }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="main-content flex-grow pb-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/committees" element={
              <ProtectedRoute>
                <MyCommittees />
              </ProtectedRoute>
            } />
            <Route path="/committees/:id" element={
              <ProtectedRoute>
                <CommitteeDashboard />
              </ProtectedRoute>
            } />
            <Route path="/advisor" element={
              <ProtectedRoute>
                <AiAdvisor />
              </ProtectedRoute>
            } />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="footer bg-slate-900 text-white w-full py-6 mt-auto z-50">
          <div className="container">
            <div className="footer-links">
              <Link to="/privacy">{t('nav.privacy')}</Link>
              <Link to="/terms">{t('nav.terms')}</Link>
              <Link to="/support">{t('nav.support')}</Link>
              <Link to="/about">{t('nav.about')}</Link>
            </div>
            <p>&copy; 2026 {t('nav.footer_text')}</p>
          </div>
        </footer>

        {/* Enterprise-Grade Security: Session Expiration Warning */}
        {showWarning && (
            <SessionWarningModal onStayLoggedIn={resetTimer} />
        )}
      </div>
    );
}

export default App;