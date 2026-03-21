// src/pages/doctor/dashboard/DoctorDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StatCard, Card, Badge, PageLoader, Empty, Button } from '@/components/ui';
import { Calendar, Clock, Video, CheckCircle2, ExternalLink } from 'lucide-react';
import {
  getAppointmentsByDoctor, getMeetingLink,
} from '@/api/endpoints/appointments';
import { getAvailableSlots, countAvailableSlots } from '@/api/endpoints/doctors';
import type { Appointment, TimeSlot } from '@/api/types';
import { formatDate, formatTime } from '@/lib/utils';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const doctorId = user?.userId ?? '';

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [todaySlots,   setTodaySlots]   = useState<TimeSlot[]>([]);
  const [slotCount,    setSlotCount]    = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [zoomLoading,  setZoomLoading]  = useState<string | null>(null);

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    if (!doctorId) return;
    setLoading(true);
    Promise.allSettled([
      getAppointmentsByDoctor(doctorId, 0, 10),
      getAvailableSlots(doctorId, today),
      countAvailableSlots(doctorId, today),
    ]).then(([apts, slots, count]) => {
      if (apts.status === 'fulfilled')   setAppointments(apts.value.data?.content ?? []);
      if (slots.status === 'fulfilled')  setTodaySlots(slots.value.data ?? []);
      if (count.status === 'fulfilled')  setSlotCount(count.value.data ?? 0);
    }).finally(() => setLoading(false));
  }, [doctorId]);

  const todayAppointments = appointments.filter(a =>
    a.appointmentDate === today && a.status !== 'CANCELLED',
  );
  const pendingCount  = 0; // Randevular artık direkt CONFIRMED oluşuyor
  const completedCount= appointments.filter(a => a.status === 'COMPLETED').length;

  const joinZoom = async (apt: Appointment) => {
    if (!apt.meetingInfo?.joinUrl) {
      setZoomLoading(apt.id);
      try {
        const res = await getMeetingLink(apt.id);
        const url = res.data?.startUrl ?? res.data?.joinUrl;
        if (url) window.open(url, '_blank');
      } catch { /* ignore */ }
      setZoomLoading(null);
    } else {
      window.open(apt.meetingInfo.startUrl ?? apt.meetingInfo.joinUrl, '_blank');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-800 text-[#F0F4FF]">
          Hoş geldin, Dr. {user?.lastName} 👋
        </h1>
        <p className="text-sm text-[#8A9BC4] mt-0.5">
          {formatDate(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Bugün Randevu"  value={todayAppointments.length} icon={Calendar} color="orange" />
        <StatCard label="Onay Bekleyen"  value={pendingCount}            icon={Clock}    color="amber" />
        <StatCard label="Tamamlanan"     value={completedCount}          icon={CheckCircle2} color="green" />
        <StatCard label="Bugün Boş Slot" value={slotCount}              icon={Clock}    color="blue"
          sub="Müsait slot sayısı" />
      </div>

      {/* Alt grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* Bugünün randevuları */}
        <Card padding={false}>
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[#EE7436]" />
              <h2 className="text-sm font-700 text-[#F0F4FF]">Bugünün Randevuları</h2>
            </div>
            <Badge variant="orange">{todayAppointments.length}</Badge>
          </div>
          <div className="flex flex-col divide-y divide-white/5">
            {todayAppointments.length === 0
              ? <Empty message="Bugün randevu yok" icon={CheckCircle2} />
              : todayAppointments.map(apt => (
                <div key={apt.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex flex-col items-center rounded-xl bg-white/8 px-3 py-2 text-center">
                    <span className="text-sm font-800 text-[#F0F4FF]">{apt.startTime}</span>
                    <span className="text-[10px] text-[#8A9BC4]">{apt.durationMinutes}dk</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-600 text-[#F0F4FF] truncate">
                      Hasta: <span className="font-mono text-xs text-[#8A9BC4]">{apt.patientId.slice(-8)}</span>
                    </p>
                    <p className="text-xs text-[#8A9BC4]">{apt.chiefComplaint ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={apt.status === 'CONFIRMED' ? 'info' : apt.status === 'IN_PROGRESS' ? 'orange' : 'success'}>
                      {apt.status}
                    </Badge>
                    {apt.consultationType === 'VIDEO_CALL' && (
                      <Button
                        variant="primary" size="sm"
                        loading={zoomLoading === apt.id}
                        onClick={() => joinZoom(apt)}
                      >
                        <Video size={12} /> Katıl
                      </Button>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
          {todayAppointments.length > 0 && (
            <div className="border-t border-white/8 px-5 py-3">
              <a href="/doctor/appointments" className="text-xs font-600 text-[#EE7436] hover:underline">
                Tüm randevular →
              </a>
            </div>
          )}
        </Card>

        {/* Bugünkü slotlar */}
        <Card padding={false}>
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-400" />
              <h2 className="text-sm font-700 text-[#F0F4FF]">Bugünkü Slotlar</h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info">{todaySlots.length} toplam</Badge>
              <a href="/doctor/slots" className="text-xs font-600 text-[#EE7436] hover:underline">Yönet</a>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {todaySlots.length === 0
              ? <Empty message="Bugün için slot oluşturulmamış" />
              : todaySlots.map(slot => (
                <div
                  key={slot.id}
                  className={`rounded-xl px-3 py-2 text-xs font-600 border ${
                    slot.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    slot.status === 'BOOKED'    ? 'bg-blue-500/10    text-blue-400    border-blue-500/20'    :
                    slot.status === 'BLOCKED'   ? 'bg-red-500/10     text-red-400     border-red-500/20'     :
                                                  'bg-white/5        text-[#8A9BC4]   border-white/10'
                  }`}
                >
                  {slot.startTime}
                  <span className="ml-1 opacity-60">{slot.status}</span>
                </div>
              ))
            }
          </div>
        </Card>
      </div>
    </div>
  );
}
