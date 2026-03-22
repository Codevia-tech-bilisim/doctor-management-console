// src/pages/auth/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';

type RoleTab = 'ADMIN' | 'DOCTOR';

const ROLE_CONFIG = {
  ADMIN: {
    icon: ShieldCheck,
    label: 'Admin',
    desc: 'Doktor onay, lead yönetimi, raporlar',
    accent: '#EE7436',
    hint: 'Admin hesabınızla giriş yapın',
  },
  DOCTOR: {
    icon: Stethoscope,
    label: 'Doktor',
    desc: 'Slotlar, randevular, online görüşmeler',
    accent: '#3b82f6',
    hint: 'Doktor hesabınızla giriş yapın',
  },
} as const;

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [role,     setRole]     = useState<RoleTab>('ADMIN');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  React.useEffect(() => {
    if (user) navigate(user.role === 'DOCTOR' ? '/doctor' : '/admin', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('E-posta ve şifre zorunludur.'); return; }
    setError(null);
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      // Role uyumsuzluğu için daha anlamlı mesaj
      const msg = result.error ?? 'Giriş başarısız.';
      if (msg.includes('sadece Admin ve Doktor')) {
        setError('Bu hesap hasta hesabıdır. Lütfen yetkili personel hesabı kullanın.');
      } else if (msg.includes('Geçersiz') || msg.includes('Invalid')) {
        setError('E-posta veya şifre hatalı. Lütfen kontrol edin.');
      } else {
        setError(msg);
      }
    }
  };

  const cfg = ROLE_CONFIG[role];
  const isAdmin = role === 'ADMIN';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A1525]">

      {/* ── Sol panel ── */}
      <div className="relative hidden w-[52%] flex-col overflow-hidden lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1B33] via-[#142244] to-[#17264A]" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#EE7436]/8 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border border-white/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full border border-white/5" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#EE7436] to-[#C8521A] shadow-lg shadow-[#EE7436]/30">
              <span className="text-sm font-black text-white">HV</span>
            </div>
            <span className="text-xl font-black tracking-tight text-white">HEALTHVIA</span>
            <span className="rounded-md border border-[#EE7436]/30 bg-[#EE7436]/10 px-2 py-0.5 text-[10px] font-700 uppercase tracking-widest text-[#EE7436]">
              Panel
            </span>
          </div>

          {/* Orta */}
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-tight text-white">
                Sağlık Turizmi<br />
                <span className="text-[#EE7436]">Yönetim Paneli</span>
              </h1>
              <p className="mt-4 max-w-sm text-base leading-relaxed text-[#8A9BC4]">
                Hasta yönetimi, randevu takibi, doktor onayları ve CRM işlemlerini tek panelden yönetin.
              </p>
            </div>

            {/* Role cards — tıklanabilir */}
            <div className="flex flex-col gap-3">
              {(Object.entries(ROLE_CONFIG) as [RoleTab, typeof ROLE_CONFIG[RoleTab]][]).map(([key, c]) => {
                const Icon = c.icon;
                const active = role === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setRole(key); setError(null); }}
                    className={cn(
                      'flex items-center gap-4 rounded-xl border px-4 py-3 text-left backdrop-blur-sm transition-all',
                      active
                        ? 'border-[#EE7436]/40 bg-[#EE7436]/10'
                        : 'border-white/8 bg-white/4 hover:bg-white/7 hover:border-white/15',
                    )}
                  >
                    <div className={cn(
                      'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
                      active ? 'bg-[#EE7436]/25' : 'bg-white/8',
                    )}>
                      <Icon size={17} className={active ? 'text-[#EE7436]' : 'text-[#8A9BC4]'} />
                    </div>
                    <div className="flex-1">
                      <p className={cn('text-sm font-700', active ? 'text-[#F0F4FF]' : 'text-[#B8C6E0]')}>{c.label} Paneli</p>
                      <p className="text-xs text-[#8A9BC4]">{c.desc}</p>
                    </div>
                    {active && (
                      <div className="h-2 w-2 rounded-full bg-[#EE7436] shadow-sm shadow-[#EE7436]/50" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-[#8A9BC4]/60">
            © 2026 Codevia Bilişim ve Yazılım A.Ş. — Ankara Üniversitesi Teknokent
          </p>
        </div>
      </div>

      {/* ── Sağ panel: Form ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#0D1829] px-8">

        {/* Mobil logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#EE7436] to-[#C8521A]">
            <span className="text-xs font-black text-white">HV</span>
          </div>
          <span className="text-lg font-black text-white">HEALTHVIA</span>
        </div>

        <div className="w-full max-w-[380px]">

          {/* Role toggle — mobilde de göster */}
          <div className="mb-6 flex rounded-xl border border-white/10 bg-white/5 p-1">
            {(Object.entries(ROLE_CONFIG) as [RoleTab, typeof ROLE_CONFIG[RoleTab]][]).map(([key, c]) => {
              const Icon = c.icon;
              const active = role === key;
              return (
                <button
                  key={key}
                  onClick={() => { setRole(key); setError(null); }}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-600 transition-all',
                    active
                      ? 'bg-[#EE7436] text-white shadow-md shadow-[#EE7436]/30'
                      : 'text-[#8A9BC4] hover:text-[#B8C6E0]',
                  )}
                >
                  <Icon size={15} />
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tight text-[#F0F4FF]">Giriş Yap</h2>
            <p className="mt-1 text-sm text-[#8A9BC4]">{cfg.hint}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-700 uppercase tracking-wider text-[#8A9BC4]">E-Posta</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9BC4]" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null); }}
                  placeholder={isAdmin ? 'admin@healthvia.com' : 'doktor@healthvia.com'}
                  className={cn(
                    'h-11 w-full rounded-xl border bg-white/5 pl-10 pr-4 text-sm text-[#F0F4FF] outline-none transition-all',
                    'placeholder:text-[#8A9BC4]/50',
                    error ? 'border-red-500/50' : 'border-white/10',
                    'focus:border-[#EE7436]/60 focus:ring-2 focus:ring-[#EE7436]/10',
                  )}
                />
              </div>
            </div>

            {/* Şifre */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-700 uppercase tracking-wider text-[#8A9BC4]">Şifre</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9BC4]" />
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••"
                  className={cn(
                    'h-11 w-full rounded-xl border bg-white/5 pl-10 pr-10 text-sm text-[#F0F4FF] outline-none transition-all',
                    'placeholder:text-[#8A9BC4]/50',
                    error ? 'border-red-500/50' : 'border-white/10',
                    'focus:border-[#EE7436]/60 focus:ring-2 focus:ring-[#EE7436]/10',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A9BC4] hover:text-[#F0F4FF] transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Hata */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <span className="mt-0.5 flex-shrink-0">⚠</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'mt-1 h-11 w-full rounded-xl text-sm font-700 text-white',
                'bg-gradient-to-r from-[#EE7436] to-[#D45E20]',
                'shadow-lg shadow-[#EE7436]/25 transition-all duration-150',
                'hover:shadow-[#EE7436]/40 hover:-translate-y-0.5',
                'active:scale-[.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0',
              )}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Giriş yapılıyor...
                </span>
              ) : `${cfg.label} olarak Giriş Yap`}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-[#8A9BC4]/60">
            Bu panel yalnızca yetkili personel içindir.
          </p>
        </div>
      </div>
    </div>
  );
}
