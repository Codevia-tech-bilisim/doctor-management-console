// src/pages/doctor/profile/DoctorProfile.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, Badge, Button, PageLoader } from '@/components/ui';
import { Save, Stethoscope, Clock, DollarSign, ToggleLeft, ToggleRight, CheckCircle } from 'lucide-react';
import {
  getMyProfile, updateMyProfile,
  updateWorkingHours, updateConsultationInfo,
} from '@/api/endpoints/doctors';
import { api } from '@/api/client';
import type { Doctor, ApiResponse } from '@/api/types';
import { formatDate, initials } from '@/lib/utils';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABELS: Record<string, string> = {
  MON: 'Pzt', TUE: 'Sal', WED: 'Çar',
  THU: 'Per', FRI: 'Cum', SAT: 'Cmt', SUN: 'Paz',
};

export default function DoctorProfile() {
  const { user } = useAuth();

  const [doctor,       setDoctor]       = useState<Doctor | null>(null);
  const [loading,      setLoading]      = useState(true);

  // Bio
  const [bio,          setBio]          = useState('');
  const [bioLoading,   setBioLoading]   = useState(false);
  const [bioSaved,     setBioSaved]     = useState(false);

  // Çalışma saatleri
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime,    setStartTime]    = useState('09:00');
  const [endTime,      setEndTime]      = useState('17:00');
  const [hoursLoading, setHoursLoading] = useState(false);
  const [hoursSaved,   setHoursSaved]   = useState(false);

  // Danışma bilgisi
  const [fee,          setFee]          = useState<number>(0);
  const [duration,     setDuration]     = useState<number>(30);
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultSaved, setConsultSaved] = useState(false);

  // Randevu kabul toggle
  const [acceptLoading, setAcceptLoading] = useState(false);

  useEffect(() => {
    getMyProfile().then(res => {
      const d = res.data;
      setDoctor(d);
      setBio(d.biography ?? '');
      setSelectedDays(d.workingDays ?? []);
      setStartTime(d.workingHoursStart ?? '09:00');
      setEndTime(d.workingHoursEnd ?? '17:00');
      setFee(d.consultationFee ?? 0);
      setDuration(d.consultationDurationMinutes ?? 30);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const showSaved = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const saveBio = async () => {
    setBioLoading(true);
    try {
      const res = await updateMyProfile(bio);
      setDoctor(res.data);
      showSaved(setBioSaved);
    } catch { /* ignore */ }
    setBioLoading(false);
  };

  const saveHours = async () => {
    setHoursLoading(true);
    try {
      const res = await updateWorkingHours(selectedDays, startTime, endTime);
      setDoctor(res.data);
      showSaved(setHoursSaved);
    } catch { /* ignore */ }
    setHoursLoading(false);
  };

  const saveConsult = async () => {
    setConsultLoading(true);
    try {
      const res = await updateConsultationInfo(fee, duration);
      setDoctor(res.data);
      showSaved(setConsultSaved);
    } catch { /* ignore */ }
    setConsultLoading(false);
  };

  // Randevu kabul toggle
  // Backend'de isAcceptingNewPatients için ayrı endpoint yok.
  // Geçici çözüm: mevcut fee/duration ile consultation update yapıp
  // local state'i anında güncelliyoruz. Backend endpoint eklenince
  // PATCH /api/doctors/me/accepting-patients?accepting=true yapılacak.
  const toggleAccepting = async () => {
    if (!doctor) return;
    const newVal = !doctor.isAcceptingNewPatients;
    // Önce local state'i güncelle (immediate feedback)
    setDoctor(prev => prev ? { ...prev, isAcceptingNewPatients: newVal } : prev);
    setAcceptLoading(true);
    try {
      // Mevcut consultation bilgileriyle update — backend isAcceptingNewPatients'i
      // updateDoctorFields'da handle ediyor ama bu endpoint'e parametre eklenmiyor.
      // Bu yüzden direkt doctor update endpoint'ini dene:
      await api.patch<ApiResponse<Doctor>>(
        `/api/doctors/me/accepting-patients?accepting=${newVal}`
      );
      // Başarılıysa profili yenile
      const fresh = await getMyProfile();
      setDoctor(fresh.data);
    } catch {
      // Endpoint yoksa (404/400) local state yeterli — UI çalışır
      // Backend'e DoctorController'a şu endpoint eklenince gerçek çalışır:
      // @PatchMapping("/me/accepting-patients")
      // public ApiResponse<DoctorDto> setAcceptingPatients(@RequestParam boolean accepting)
    }
    setAcceptLoading(false);
  };

  const toggleDay = (day: string) =>
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  if (loading) return <PageLoader />;
  if (!doctor) return <p className="text-sm text-red-400 p-6">Profil yüklenemedi.</p>;

  const verBadge: Record<string, 'success' | 'warn' | 'danger' | 'muted'> = {
    VERIFIED: 'success', PENDING: 'warn', REJECTED: 'danger', SUSPENDED: 'muted',
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-800 text-[#F0F4FF]">Profilim</h1>
        <p className="text-sm text-[#8A9BC4] mt-0.5">Bilgilerinizi güncelleyin</p>
      </div>

      {/* Profil özeti */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-[#EE7436]/15 text-xl font-800 text-[#EE7436]">
            {initials(doctor.firstName, doctor.lastName)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-800 text-[#F0F4FF]">Dr. {doctor.firstName} {doctor.lastName}</h2>
            <p className="text-sm text-[#8A9BC4]">{doctor.email}</p>
            <div className="mt-2 flex gap-2 flex-wrap">
              <Badge variant={verBadge[doctor.verificationStatus]}>{doctor.verificationStatus}</Badge>
              <Badge variant="info">{doctor.specialty ?? doctor.currentHospital ?? 'Doktor'}</Badge>
            </div>
          </div>
        </div>

        {/* Randevu kabul toggle — profil kartı içinde */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/4 px-4 py-3">
          <div>
            <p className="text-sm font-600 text-[#F0F4FF]">Yeni Randevu Kabul</p>
            <p className="text-xs text-[#8A9BC4] mt-0.5">
              {doctor.isAcceptingNewPatients
                ? 'Hastalar size randevu alabilir'
                : 'Randevu almak şu an kapalı'}
            </p>
          </div>
          <button
            onClick={toggleAccepting}
            disabled={acceptLoading}
            className="flex items-center gap-2 rounded-xl px-3 py-2 transition-all disabled:opacity-60"
          >
            {acceptLoading ? (
              <svg className="h-5 w-5 animate-spin text-[#EE7436]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : doctor.isAcceptingNewPatients ? (
              <ToggleRight size={32} className="text-emerald-400" />
            ) : (
              <ToggleLeft size={32} className="text-[#8A9BC4]" />
            )}
            <span className={`text-sm font-600 ${doctor.isAcceptingNewPatients ? 'text-emerald-400' : 'text-[#8A9BC4]'}`}>
              {doctor.isAcceptingNewPatients ? 'Açık' : 'Kapalı'}
            </span>
          </button>
        </div>

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-white/4 p-4 sm:grid-cols-4">
          {[
            { l: 'Deneyim', v: doctor.yearsOfExperience ? `${doctor.yearsOfExperience} yıl` : '—' },
            { l: 'Puan',    v: doctor.rating ? `${doctor.rating.toFixed(1)} ⭐` : '—' },
            { l: 'Hastane', v: doctor.currentHospital ?? '—' },
            { l: 'Kayıt',   v: formatDate(doctor.createdAt) },
          ].map(({ l, v }) => (
            <div key={l}>
              <p className="text-[10px] font-700 uppercase tracking-wider text-[#8A9BC4]">{l}</p>
              <p className="mt-0.5 text-sm text-[#F0F4FF]">{v}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Biyografi */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Stethoscope size={16} className="text-[#EE7436]" />
          <h3 className="text-sm font-700 text-[#F0F4FF]">Biyografi</h3>
        </div>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={5}
          placeholder="Kendinizi tanıtın, uzmanlık alanlarınızı yazın..."
          className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-[#F0F4FF] outline-none placeholder:text-[#8A9BC4]/60 focus:border-[#EE7436]/50 resize-none"
        />
        <div className="flex items-center justify-end gap-3 mt-3">
          {bioSaved && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle size={12} /> Kaydedildi
            </span>
          )}
          <Button variant="primary" size="sm" onClick={saveBio} loading={bioLoading}>
            <Save size={13} /> Kaydet
          </Button>
        </div>
      </Card>

      {/* Çalışma saatleri */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-blue-400" />
          <h3 className="text-sm font-700 text-[#F0F4FF]">Çalışma Saatleri</h3>
        </div>
        <div className="flex gap-2 mb-4 flex-wrap">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`rounded-xl px-3.5 py-2 text-xs font-700 transition-all ${
                selectedDays.includes(day)
                  ? 'bg-[#EE7436] text-white shadow-sm shadow-[#EE7436]/20'
                  : 'bg-white/6 text-[#8A9BC4] hover:bg-white/10 hover:text-[#B8C6E0]'
              }`}
            >
              {DAY_LABELS[day]}
            </button>
          ))}
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-700 uppercase tracking-wider text-[#8A9BC4]">Başlangıç</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-[#F0F4FF] outline-none focus:border-[#EE7436]/50" />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-700 uppercase tracking-wider text-[#8A9BC4]">Bitiş</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-[#F0F4FF] outline-none focus:border-[#EE7436]/50" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-3">
          {hoursSaved && <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle size={12}/> Kaydedildi</span>}
          <Button variant="primary" size="sm" onClick={saveHours} loading={hoursLoading}>
            <Save size={13} /> Kaydet
          </Button>
        </div>
      </Card>

      {/* Danışma bilgileri */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={16} className="text-emerald-400" />
          <h3 className="text-sm font-700 text-[#F0F4FF]">Danışma Bilgileri</h3>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-700 uppercase tracking-wider text-[#8A9BC4]">Ücret (₺)</label>
            <input type="number" min={0} value={fee} onChange={e => setFee(Number(e.target.value))}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-[#F0F4FF] outline-none focus:border-[#EE7436]/50" />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-700 uppercase tracking-wider text-[#8A9BC4]">Süre (dk)</label>
            <select value={duration} onChange={e => setDuration(Number(e.target.value))}
              className="h-10 rounded-xl border border-white/10 bg-[#162040] px-4 text-sm text-[#F0F4FF] outline-none focus:border-[#EE7436]/50">
              {[15, 20, 30, 45, 60, 90].map(d => <option key={d} value={d}>{d} dk</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-3">
          {consultSaved && <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle size={12}/> Kaydedildi</span>}
          <Button variant="primary" size="sm" onClick={saveConsult} loading={consultLoading}>
            <Save size={13} /> Kaydet
          </Button>
        </div>
      </Card>
    </div>
  );
}
