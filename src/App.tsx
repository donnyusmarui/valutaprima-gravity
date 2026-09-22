import { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CustomerDashboard } from './components/dashboard/CustomerDashboard';
import { TellerDashboard } from './components/dashboard/TellerDashboard';
import { SupervisorDashboard } from './components/dashboard/SupervisorDashboard';
import { ArrowRightLeft } from 'lucide-react';

function DashboardContent() {
  const { user, loading } = useAuth();

  const [activeSection, setActiveSection] = useState<string>('dashboard');

  // Reset to dashboard home every time role changes (e.g. via role switcher)
  const prevRoleRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (user?.role && user.role !== prevRoleRef.current) {
      prevRoleRef.current = user.role;
      setActiveSection('dashboard');
    }
  }, [user?.role]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg animate-pulse">
            <ArrowRightLeft className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-semibold text-slate-500">Memuat sesi Anda...</p>
        </div>
      </div>
    );
  }

  // Not logged in: show full-width Navbar only (auth modal will open from Navbar)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto shadow-lg">
              <ArrowRightLeft className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Valuta Prima</h1>
            <p className="text-sm text-slate-600">
              Platform penukaran valuta asing berizin resmi Bank Indonesia. Masuk atau daftar untuk memulai transaksi.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Logged in: Sidebar + Role-Based Dashboard
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navbar — hidden on desktop since sidebar has user info */}
      <Navbar />

      {/* Main layout: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {user.role === 'customer' && (
              <CustomerDashboard
                activeSection={activeSection}
                onNavigate={setActiveSection}
              />
            )}
            {user.role === 'teller' && (
              <TellerDashboard
                activeSection={activeSection}
                onNavigate={setActiveSection}
              />
            )}
            {user.role === 'supervisor' && (
              <SupervisorDashboard
                activeSection={activeSection}
                onNavigate={setActiveSection}
              />
            )}
          </div>

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400 mt-8">
            <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
              <span>Valuta Prima Gravity &copy; 2026 — Digital Money Changer Platform.</span>
              <span className="font-mono text-[11px] text-slate-400">
                V7LA Engine v3.0 | Neon Cloud DB | Sprint 3 Active
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
