// src/components/layout/PanelLayout.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn, initials, formatRelative } from '@/lib/utils';
import {
  LayoutDashboard, Users, Calendar, UserCheck,
  Stethoscope, Clock, LogOut, ChevronDown,
  Menu, X, Bell, MessageSquare, AlertCircle,
  CheckCircle2, Settings,
} from 'lucide-react';

type Role = 'ADMIN' | 'DOCTOR';

const adminNav = [
  { to: '/admin',              label: 'Dashboard',   icon: LayoutDashboard, end: true },
  { to: '/admin/doctors',      label: 'Doktorlar',   icon: Stethoscope },
  { to: '/admin/appointments', label: 'Randevular',  icon: Calendar },
  { to: '/admin/leads',        label: "Lead'ler",    icon: MessageSquare },
  { to: '/admin/patients',     label: 'Hastalar',    icon: Users },
];

const doctorNav = [
  { to: '/doctor',              label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { to: '/doctor/slots',        label: 'Slotlarım',  icon: Clock },
  { to: '/doctor/appointments', label: 'Randevular', icon: Calendar },
  { to: '/doctor/profile',      label: 'Profilim',   icon: UserCheck },
];

// Statik bildirimler — gerçek bildirim servisi olmadığından simüle ediyoruz
// Gerçek implementasyonda WebSocket veya polling ile gelecek
interface Notification {
  id: string;
  type: 'info' | 'warn' | 'success';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

function useNotifications(role: Role) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Rol bazlı örnek bildirimler
    const now = new Date();
    const mins = (m: number) => new Date(now.getTime() - m * 60000).toISOString();

    if (role === 'ADMIN') {
      setNotifications([
        { id: '1', type: 'warn',    title: 'Onay Bekleyen Doktor',  message: '13 doktor onay bekliyor',             time: mins(5),   read: false },
        { id: '2', type: 'info',    title: 'Yeni Lead',             message: 'WhatsApp kanalından yeni lead geldi', time: mins(23),  read: false },
        { id: '3', type: 'success', title: 'Lead Dönüşümü',         message: 'Bir lead başarıyla hastaya dönüştü',  time: mins(120), read: true  },
      ]);
    } else {
      setNotifications([
        { id: '1', type: 'info',    title: 'Yeni Randevu',          message: 'Yarın saat 10:00 için randevu alındı', time: mins(10),  read: false },
        { id: '2', type: 'warn',    title: 'Randevu Hatırlatıcı',   message: 'Bugün 3 randevunuz var',               time: mins(60),  read: true  },
      ]);
    }
  }, [role]);

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markAllRead, markRead };
}

export default function PanelLayout({ role }: { role: Role }) {
  const { user, logout }   = useAuth();
  const navigate           = useNavigate();
  const location           = useLocation();
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [sidebarProfileOpen, setSidebarProfileOpen] = useState(false);
  const [topbarProfileOpen, setTopbarProfileOpen]   = useState(false);
  const [notifOpen,   setNotifOpen]     = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const sidebarProfileRef = useRef<HTMLDivElement>(null);
  const topbarProfileRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, markAllRead, markRead } = useNotifications(role);
  const nav = role === 'ADMIN' ? adminNav : doctorNav;

  // Click outside kapat
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (sidebarProfileRef.current && !sidebarProfileRef.current.contains(e.target as Node)) setSidebarProfileOpen(false);
      if (topbarProfileRef.current && !topbarProfileRef.current.contains(e.target as Node)) setTopbarProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Route değişince sidebar kapat
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login', { replace: true });
  };

  // Sayfa başlığı
  const currentNav = nav.find(n => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to));
  const pageTitle  = currentNav?.label ?? '';

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <>
      {nav.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={onClick}
          className={({ isActive }) => cn(
            'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-500 transition-all duration-150',
            isActive
              ? 'bg-[#EE7436]/12 text-[#EE7436] border border-[#EE7436]/20'
              : 'text-[#8A9BC4] hover:bg-white/5 hover:text-[#B8C6E0]',
          )}
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-r-full bg-[#EE7436]" />}
              <Icon size={16} className="flex-shrink-0" />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </>
  );

  const notifIcon = (type: Notification['type']) => {
    const map = { info: <Bell size={13} className="text-blue-400" />, warn: <AlertCircle size={13} className="text-amber-400" />, success: <CheckCircle2 size={13} className="text-emerald-400" /> };
    return map[type];
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#111D35]">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-white/7 bg-[#0D1829] lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-white/7 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#EE7436] to-[#C8521A] shadow-md shadow-[#EE7436]/30">
            <span className="text-xs font-black text-white">HV</span>
          </div>
          <span className="text-base font-black tracking-tight text-white">HEALTHVIA</span>
          <span className="ml-auto rounded border border-[#EE7436]/25 bg-[#EE7436]/10 px-1.5 py-0.5 text-[9px] font-700 uppercase tracking-wider text-[#EE7436]">
            {role === 'ADMIN' ? 'Admin' : 'Doktor'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          <NavItems />
        </nav>

        {/* User card */}
        <div className="border-t border-white/7 p-3">
          <div ref={sidebarProfileRef} className="relative">
            <button
              onClick={() => setSidebarProfileOpen(v => !v)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 transition-all hover:bg-white/7"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#EE7436]/20 text-xs font-700 text-[#EE7436]">
                {initials(user?.firstName, user?.lastName)}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-600 text-[#F0F4FF] truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-[10px] text-[#8A9BC4]">{user?.role}</p>
              </div>
              <ChevronDown size={13} className={cn('text-[#8A9BC4] transition-transform flex-shrink-0', sidebarProfileOpen && 'rotate-180')} />
            </button>
            {sidebarProfileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-white/10 bg-[#162040] shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/8">
                  <p className="text-xs font-600 text-[#F0F4FF]">{user?.firstName} {user?.lastName}</p>
                  <p className="text-[10px] text-[#8A9BC4] mt-0.5">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={14} /> Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile Sidebar ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col border-r border-white/7 bg-[#0D1829] z-50">
            <div className="flex h-16 items-center justify-between border-b border-white/7 px-5">
              <span className="text-base font-black text-white">HEALTHVIA</span>
              <button onClick={() => setSidebarOpen(false)} className="text-[#8A9BC4] hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 overflow-y-auto p-3 flex-1">
              <NavItems onClick={() => setSidebarOpen(false)} />
            </nav>
            <div className="border-t border-white/7 p-3">
              <button onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut size={14} /> Çıkış Yap
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/7 bg-[#0D1829]/80 px-5 backdrop-blur-sm">
          {/* Sol: hamburger + sayfa başlığı */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-[#8A9BC4] hover:bg-white/5 hover:text-[#F0F4FF] transition-colors lg:hidden">
              <Menu size={18} />
            </button>
            {pageTitle && (
              <h2 className="text-sm font-700 text-[#F0F4FF] hidden sm:block">{pageTitle}</h2>
            )}
          </div>

          {/* Sağ: bildirim + kullanıcı */}
          <div className="flex items-center gap-2">

            {/* Bildirim butonu */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => { setNotifOpen(v => !v); if (!notifOpen && unreadCount > 0) {} }}
                className="relative rounded-xl p-2.5 text-[#8A9BC4] hover:bg-white/5 hover:text-[#F0F4FF] transition-colors"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#EE7436] text-[9px] font-800 text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Bildirim dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/10 bg-[#162040] shadow-2xl z-50 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-[#EE7436]" />
                      <span className="text-sm font-700 text-[#F0F4FF]">Bildirimler</span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-[#EE7436] px-1.5 py-0.5 text-[9px] font-800 text-white">{unreadCount}</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] font-600 text-[#EE7436] hover:underline">
                        Tümünü okundu işaretle
                      </button>
                    )}
                  </div>

                  {/* Liste */}
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-[#8A9BC4]">
                        <Bell size={24} className="opacity-30 mb-2" />
                        <p className="text-sm">Bildirim yok</p>
                      </div>
                    ) : notifications.map(n => (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={cn(
                          'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors border-b border-white/5 last:border-0',
                          n.read ? 'hover:bg-white/3' : 'bg-white/4 hover:bg-white/7',
                        )}
                      >
                        <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-white/8">
                          {notifIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn('text-xs font-600', n.read ? 'text-[#B8C6E0]' : 'text-[#F0F4FF]')}>{n.title}</p>
                            {!n.read && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#EE7436]" />}
                          </div>
                          <p className="text-xs text-[#8A9BC4] mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-[#8A9BC4]/60 mt-1">{formatRelative(n.time)}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="border-t border-white/8 px-4 py-2.5">
                      <button onClick={markAllRead} className="w-full text-[10px] font-600 text-[#8A9BC4] hover:text-[#EE7436] transition-colors text-center">
                        Tümünü temizle
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop kullanıcı pill */}
            <div ref={topbarProfileRef} className="relative hidden lg:block">
              <button
                onClick={() => setTopbarProfileOpen(v => !v)}
                className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/4 px-3 py-2 hover:bg-white/7 transition-all"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EE7436]/20 text-[10px] font-700 text-[#EE7436]">
                  {initials(user?.firstName, user?.lastName)}
                </div>
                <div>
                  <p className="text-xs font-600 text-[#F0F4FF]">{user?.firstName} {user?.lastName}</p>
                  <p className="text-[10px] text-[#8A9BC4]">{user?.email}</p>
                </div>
                <ChevronDown size={12} className={cn('text-[#8A9BC4] transition-transform ml-1', topbarProfileOpen && 'rotate-180')} />
              </button>

              {topbarProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-[#162040] shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-xs font-600 text-[#F0F4FF]">{user?.firstName} {user?.lastName}</p>
                    <p className="text-[10px] text-[#8A9BC4] mt-0.5 truncate">{user?.email}</p>
                  </div>
                  <button onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                    <LogOut size={14} /> Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
