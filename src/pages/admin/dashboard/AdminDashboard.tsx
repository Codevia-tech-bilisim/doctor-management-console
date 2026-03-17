// src/pages/admin/dashboard/AdminDashboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StatCard, Card, Badge, PageLoader, Empty, Button } from '@/components/ui';
import {
  Stethoscope, Calendar, MessageSquare,
  AlertCircle, TrendingUp, CheckCircle2, RefreshCw,
} from 'lucide-react';
import { getAllDoctors } from '@/api/endpoints/doctors';
import { getLeadStatistics, getUnassignedLeads } from '@/api/endpoints/admin';
import { getAllAppointments } from '@/api/endpoints/appointments';
import { formatDate, formatRelative } from '@/lib/utils';
import type { Doctor, Lead, Appointment } from '@/api/types';

// Backend bazen Page<T>, bazen T[] dönüyor — ikisini normalize et
function extractList<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.content)) return d.content as T[];
  return [];
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const [allDoctors,   setAllDoctors]   = useState<Doctor[]>([]);
  const [unassignedLeads, setUnassignedLeads] = useState<Lead[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [leadStats,    setLeadStats]    = useState<Record<string, number>>({});
  const [loading,      setLoading]      = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.allSettled([
      getAllDoctors(0, 100),       // tüm doktorları çek, client'ta filtrele
      getUnassignedLeads(),
      getAllAppointments(0, 8),
      getLeadStatistics(),
    ]).then(([doctors, unassigned, appointments, stats]) => {
      if (doctors.status === 'fulfilled')
        setAllDoctors(extractList<Doctor>(doctors.value.data));
      if (unassigned.status === 'fulfilled')
        setUnassignedLeads(extractList<Lead>(unassigned.value.data));
      if (appointments.status === 'fulfilled')
        setRecentAppointments(extractList<Appointment>(appointments.value.data));
      if (stats.status === 'fulfilled')
        setLeadStats((stats.value.data as Record<string, number>) ?? {});
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader />;

  const pendingDoctors  = allDoctors.filter(d => d.verificationStatus === 'PENDING');
  const verifiedCount   = allDoctors.filter(d => d.verificationStatus === 'VERIFIED').length;
  const totalLeads      = Object.values(leadStats).reduce((a, b) => a + b, 0);
  const convertedLeads  = leadStats['CONVERTED'] ?? 0;

  return (
    <div className="flex flex-col gap-6">

      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-800 text-[#F0F4FF]">
            Hoş geldin, {user?.firstName} 👋
          </h1>
          <p className="text-sm text-[#8A9BC4] mt-0.5">
            {formatDate(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={load} loading={loading}>
          <RefreshCw size={13} /> Yenile
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Onaylı Doktor"   value={verifiedCount}          icon={Stethoscope} color="green" />
        <StatCard label="Bekleyen Onay"   value={pendingDoctors.length}  icon={AlertCircle} color="amber"
          sub={pendingDoctors.length > 0 ? 'Aksiyon gerekiyor' : 'Temiz'} />
        <StatCard label="Atanmamış Lead"  value={unassignedLeads.length} icon={MessageSquare} color="orange"
          sub={unassignedLeads.length > 0 ? 'İşlem bekliyor' : 'Hepsi atandı'} />
        <StatCard label="Toplam Lead"     value={totalLeads}             icon={TrendingUp} color="blue"
          sub={`${convertedLeads} dönüştürüldü`} />
      </div>

      {/* Alt grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* Onay Bekleyen Doktorlar */}
        <Card padding={false}>
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-400" />
              <h2 className="text-sm font-700 text-[#F0F4FF]">Onay Bekleyen Doktorlar</h2>
            </div>
            <Badge variant="warn">{pendingDoctors.length}</Badge>
          </div>
          <div className="flex flex-col divide-y divide-white/5">
            {pendingDoctors.length === 0
              ? <Empty message="Bekleyen doktor yok" icon={CheckCircle2} />
              : pendingDoctors.slice(0, 5).map(doc => (
                <div key={doc.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/8 text-xs font-700 text-[#B8C6E0]">
                    {doc.firstName?.[0]}{doc.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-600 text-[#F0F4FF] truncate">
                      {doc.firstName} {doc.lastName}
                    </p>
                    <p className="text-xs text-[#8A9BC4]">{doc.specialty ?? '—'}</p>
                  </div>
                  <Badge variant="warn">PENDING</Badge>
                </div>
              ))
            }
          </div>
          {pendingDoctors.length > 0 && (
            <div className="border-t border-white/8 px-5 py-3">
              <a href="/admin/doctors" className="text-xs font-600 text-[#EE7436] hover:underline">
                Tümünü gör →
              </a>
            </div>
          )}
        </Card>

        {/* Atanmamış Leadler */}
        <Card padding={false}>
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-[#EE7436]" />
              <h2 className="text-sm font-700 text-[#F0F4FF]">Atanmamış Leadler</h2>
            </div>
            <Badge variant="orange">{unassignedLeads.length}</Badge>
          </div>
          <div className="flex flex-col divide-y divide-white/5">
            {unassignedLeads.length === 0
              ? <Empty message="Tüm leadler atanmış" icon={CheckCircle2} />
              : unassignedLeads.slice(0, 5).map(lead => (
                <div key={lead.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`h-2 w-2 flex-shrink-0 rounded-full ${
                    lead.priority === 'URGENT' ? 'bg-red-400' :
                    lead.priority === 'HIGH'   ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-600 text-[#F0F4FF] truncate">
                      {lead.firstName} {lead.lastName ?? ''}
                    </p>
                    <p className="text-xs text-[#8A9BC4]">{lead.source} · {formatRelative(lead.createdAt)}</p>
                  </div>
                  <LeadStatusBadge status={lead.status} />
                </div>
              ))
            }
          </div>
          {unassignedLeads.length > 0 && (
            <div className="border-t border-white/8 px-5 py-3">
              <a href="/admin/leads" className="text-xs font-600 text-[#EE7436] hover:underline">
                Tümünü gör →
              </a>
            </div>
          )}
        </Card>

        {/* Son Randevular */}
        <Card padding={false} className="xl:col-span-2">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-400" />
              <h2 className="text-sm font-700 text-[#F0F4FF]">Son Randevular</h2>
            </div>
            <a href="/admin/appointments" className="text-xs font-600 text-[#EE7436] hover:underline">Tümü</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Hasta ID', 'Doktor ID', 'Tarih', 'Tür', 'Ödeme', 'Durum'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-700 uppercase tracking-wider text-[#8A9BC4]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentAppointments.length === 0
                  ? <tr><td colSpan={6}><Empty message="Randevu bulunamadı" /></td></tr>
                  : recentAppointments.map(apt => (
                    <tr key={apt.id} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-[#8A9BC4]">{apt.patientId?.slice(-8) ?? '—'}</td>
                      <td className="px-5 py-3 font-mono text-xs text-[#8A9BC4]">{apt.doctorId?.slice(-8) ?? '—'}</td>
                      <td className="px-5 py-3 text-[#B8C6E0]">{formatDate(apt.appointmentDate)} {apt.startTime}</td>
                      <td className="px-5 py-3"><ConsultTypeBadge type={apt.consultationType} /></td>
                      <td className="px-5 py-3"><PaymentBadge status={apt.paymentStatus} /></td>
                      <td className="px-5 py-3"><AppointmentStatusBadge status={apt.status} /></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function LeadStatusBadge({ status }: { status: string }) {
  const map: Record<string, 'warn' | 'success' | 'info' | 'danger' | 'orange' | 'muted'> = {
    NEW: 'orange', ASSIGNED: 'info', CONTACTED: 'info', QUALIFIED: 'success',
    CONVERTED: 'success', LOST: 'danger', SPAM: 'muted',
  };
  return <Badge variant={map[status] ?? 'muted'}>{status}</Badge>;
}
function ConsultTypeBadge({ type }: { type: string }) {
  const m: Record<string, 'info' | 'success' | 'warn'> = { VIDEO_CALL: 'info', IN_PERSON: 'success', PHONE: 'warn' };
  return <Badge variant={m[type] ?? 'muted'}>{type}</Badge>;
}
function PaymentBadge({ status }: { status: string }) {
  const m: Record<string, 'success' | 'warn' | 'danger' | 'muted'> = {
    PAID: 'success', PENDING: 'warn', REFUNDED: 'danger', WAIVED: 'muted',
  };
  return <Badge variant={m[status] ?? 'muted'}>{status}</Badge>;
}
function AppointmentStatusBadge({ status }: { status: string }) {
  const m: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'muted'> = {
    CONFIRMED: 'info', COMPLETED: 'success', PENDING: 'warn',
    CANCELLED: 'danger', NO_SHOW: 'danger', RESCHEDULED: 'muted',
  };
  return <Badge variant={m[status] ?? 'muted'}>{status}</Badge>;
}
