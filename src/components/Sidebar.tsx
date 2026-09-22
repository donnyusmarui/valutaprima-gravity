import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  ShieldCheck,
  FileCheck,
  Building2,
  ShieldAlert,
  ClipboardList,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Menu,
  X,
  DollarSign,
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  roles: Array<'customer' | 'teller' | 'supervisor'>;
}

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

const ALL_ITEMS: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
    roles: ['customer', 'teller', 'supervisor'],
  },
  {
    id: 'rates',
    label: 'Papan Kurs',
    icon: <TrendingUp className="w-4 h-4" />,
    roles: ['customer', 'teller', 'supervisor'],
  },
  {
    id: 'transaction',
    label: 'Transaksi Valas',
    icon: <ArrowRightLeft className="w-4 h-4" />,
    roles: ['customer'],
  },
  {
    id: 'history',
    label: 'Riwayat Transaksi',
    icon: <Receipt className="w-4 h-4" />,
    roles: ['customer', 'teller', 'supervisor'],
  },
  {
    id: 'currency',
    label: 'Kelola Mata Uang',
    icon: <DollarSign className="w-4 h-4" />,
    badge: 'Kurs',
    badgeColor: 'indigo',
    roles: ['teller', 'supervisor'],
  },
  {
    id: 'kyc',
    label: 'Status KYC Saya',
    icon: <ShieldCheck className="w-4 h-4" />,
    roles: ['customer'],
  },
  {
    id: 'review',
    label: 'Review KYC Nasabah',
    icon: <FileCheck className="w-4 h-4" />,
    badge: 'Teller',
    badgeColor: 'indigo',
    roles: ['teller', 'supervisor'],
  },
  {
    id: 'inventory',
    label: 'Brankas Kas Fisik',
    icon: <Building2 className="w-4 h-4" />,
    badge: 'Kasir',
    badgeColor: 'amber',
    roles: ['teller', 'supervisor'],
  },
  {
    id: 'supervisor',
    label: 'Otorisasi PIN & AML',
    icon: <ShieldAlert className="w-4 h-4" />,
    badge: 'PIN',
    badgeColor: 'purple',
    roles: ['supervisor'],
  },
  {
    id: 'audit',
    label: 'Audit Log & PPATK',
    icon: <ClipboardList className="w-4 h-4" />,
    badge: 'BI',
    badgeColor: 'rose',
    roles: ['supervisor'],
  },
];

const BADGE_COLORS: Record<string, string> = {
  indigo: 'bg-indigo-100 text-indigo-700',
  amber: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  rose: 'bg-rose-100 text-rose-700',
};

export function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const visibleItems = ALL_ITEMS.filter((item) => item.roles.includes(user.role));

  const roleLabel =
    user.role === 'customer'
      ? 'Nasabah'
      : user.role === 'teller'
        ? 'Teller Kasir'
        : 'Supervisor';

  const roleBgClass =
    user.role === 'customer'
      ? 'bg-orange-500'
      : user.role === 'teller'
        ? 'bg-indigo-500'
        : 'bg-purple-600';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo + Collapse */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-4 border-b border-slate-200`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
              <ArrowRightLeft className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-sm text-slate-900">ValutaPrima</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 items-center justify-center transition cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
          )}
        </button>
      </div>

      {/* User Identity */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl ${roleBgClass} text-white flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-sm`}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-xl object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
              <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full ${roleBgClass} text-white`}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : BADGE_COLORS[item.badgeColor || 'indigo']}`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-slate-200">
        {!collapsed && (
          <div className="mb-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[10px] text-slate-500 font-medium">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition cursor-pointer ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Keluar' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center cursor-pointer"
      >
        <Menu className="w-4 h-4 text-slate-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full z-50 bg-white border-r border-slate-200 shadow-xl transition-transform duration-300 w-64 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center cursor-pointer"
        >
          <X className="w-3.5 h-3.5 text-slate-600" />
        </button>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 bg-white border-r border-slate-200 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

// Dummy User icon to avoid import error
export function _UserIcon() {
  return <User className="w-4 h-4" />;
}
