// src/pages/admin/patients/AdminPatients.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Card, Badge, PageLoader, Empty, Table, Th, Td, Button, Modal } from '@/components/ui';
import {
  Users, RefreshCw, ChevronLeft, ChevronRight,
  Search, X, Calendar, Phone, Mail, MapPin,
  Heart, Activity, Shield,
} from 'lucide-react';
import { getAllPatients, getPatientById } from '@/api/endpoints/admin';
import { getAppointmentsByPatient } from '@/api/endpoints/appointments';
import type { Patient, Appointment } from '@/api/types';
import { formatDate, formatRelative, initials } from '@/lib/utils';

const PAGE_SIZE = 15;

const STATUS_VARIANT: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'muted'> = {
  CONFIRMED: 'info', COMPLETED: 'success', PENDING: 'warn',
  CANCELLED: 'danger', NO_SHOW: 'danger', IN_PROGRESS: 'info',
};

export default function AdminPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState('');

  // Detail modal
  const [selected, setSelected] = useState<Patient | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await getAllPatients(p, PAGE_SIZE);
      setPatients(res.data?.content ?? []);
      setTotal(res.data?.totalElements ?? 0);
      setPage(p);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(0); }, []);

  // Client-side search filter
  const filtered = query.trim()
    ? patients.filter(p => {
        const q = query.toLowerCase();
        return (
          p.firstName?.toLowerCase().includes(q) ||
          p.lastName?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.phone?.includes(q)
        );
      })
    : patients;

  const openDetail = async (patient: Patient) => {
    setSelected(patient);
    setDetailLoading(true);
    try {
      const [detailRes, aptsRes] = await Promise.allSettled([
        getPatientById(patient.id),
        getAppointmentsByPatient(patient.id, 0),
      ]);
      if (detailRes.status === 'fulfilled' && detailRes.value.data) {
        setSelected(detailRes.value.data);
      }
      if (aptsRes.status === 'fulfilled') {
        const content = (aptsRes.value.data as any)?.content ?? aptsRes.value.data ?? [];
        setPatientAppointments(Array.isArray(content) ? content : []);
      }
    } catch { /* ignore */ }
    setDetailLoading(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-800 text-[#F0F4FF]">Hasta Listesi</h1>
          <p className="text-sm text-[#8A9BC4] mt-0.5">Toplam {total} hasta</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9BC4]" />
            <input
              type="text"
              placeholder="Hasta ara..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="h-9 w-56 rounded-xl border border-white/10 bg-white/5 pl-9 pr-8 text-sm text-[#F0F4FF] outline-none placeholder:text-[#8A9BC4]/60 focus:border-[#EE7436]/50 transition-colors"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A9BC4] hover:text-[#F0F4FF]">
                <X size={13} />
              </button>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={() => load(0)} loading={loading}>
            <RefreshCw size={13} /> Yenile
          </Button>
        </div>
      </div>

      <Card padding={false}>
        {loading ? <PageLoader /> : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Hasta</Th>
                  <Th>Telefon</Th>
                  <Th>Doğum Tarihi</Th>
                  <Th>Kan Grubu</Th>
                  <Th>Durum</Th>
                  <Th>Son Giriş</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={6}><Empty icon={Users} message="Hasta bulunamadı" /></td></tr>
                  : filtered.map(p => (
                    <tr
                      key={p.id}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors cursor-pointer"
                      onClick={() => openDetail(p)}
                    >
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-xs font-700 text-blue-400">
                            {initials(p.firstName, p.lastName)}
                          </div>
                          <div>
                            <p className="font-600 text-[#F0F4FF]">{p.firstName} {p.lastName}</p>
                            <p className="text-xs text-[#8A9BC4]">{p.email}</p>
                          </div>
                        </div>
                      </Td>
                      <Td className="text-[#8A9BC4] text-xs">{p.phone ?? '—'}</Td>
                      <Td className="text-[#8A9BC4] text-xs">{p.birthDate ? formatDate(p.birthDate) : '—'}</Td>
                      <Td>
                        {p.bloodType
                          ? <Badge variant="info">{p.bloodType}</Badge>
                          : <span className="text-[#8A9BC4]">—</span>}
                      </Td>
                      <Td>
                        <Badge variant={p.status === 'ACTIVE' ? 'success' : 'muted'}>{p.status}</Badge>
                      </Td>
                      <Td className="text-[#8A9BC4] text-xs">
                        {p.lastLoginDate ? formatRelative(p.lastLoginDate) : '—'}
                      </Td>
                    </tr>
                  ))
                }
              </tbody>
            </Table>
            {total > PAGE_SIZE && (
              <div className="flex items-center justify-between border-t border-white/8 px-5 py-3">
                <p className="text-xs text-[#8A9BC4]">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total}</p>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => load(page - 1)}><ChevronLeft size={14} /></Button>
                  <Button variant="ghost" size="sm" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => load(page + 1)}><ChevronRight size={14} /></Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Hasta detay modal */}
      <Modal open={!!selected} onClose={() => { setSelected(null); setPatientAppointments([]); }} title="Hasta Detayı" width="max-w-2xl">
        {selected && (
          <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-lg font-800 text-blue-400">
                {initials(selected.firstName, selected.lastName)}
              </div>
              <div>
                <h3 className="text-lg font-700 text-[#F0F4FF]">{selected.firstName} {selected.lastName}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant={selected.status === 'ACTIVE' ? 'success' : 'muted'}>{selected.status}</Badge>
                  <Badge variant={selected.emailVerified ? 'success' : 'warn'}>
                    {selected.emailVerified ? 'Email Doğrulandı' : 'Email Bekliyor'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* İletişim bilgileri */}
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-white/4 p-4">
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-[#8A9BC4]" />
                <span className="text-sm text-[#F0F4FF]">{selected.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-[#8A9BC4]" />
                <span className="text-sm text-[#F0F4FF]">{selected.phone ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-[#8A9BC4]" />
                <span className="text-sm text-[#F0F4FF]">{[selected.province, selected.district].filter(Boolean).join(', ') || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-[#8A9BC4]" />
                <span className="text-sm text-[#F0F4FF]">{selected.birthDate ? formatDate(selected.birthDate) : '—'}</span>
              </div>
            </div>

            {/* Sağlık bilgileri */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: Heart, label: 'Kan Grubu', value: selected.bloodType ?? '—', color: 'text-red-400' },
                { icon: Activity, label: 'BMI', value: selected.bmi ? selected.bmi.toFixed(1) : '—', color: 'text-emerald-400' },
                { icon: Shield, label: 'Boy', value: selected.heightCm ? `${selected.heightCm} cm` : '—', color: 'text-blue-400' },
                { icon: Shield, label: 'Kilo', value: selected.weightKg ? `${selected.weightKg} kg` : '—', color: 'text-amber-400' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="rounded-xl bg-white/4 p-3 text-center">
                  <Icon size={16} className={`${color} mx-auto mb-1`} />
                  <p className="text-xs text-[#8A9BC4]">{label}</p>
                  <p className="text-sm font-700 text-[#F0F4FF] mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Randevu geçmişi */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-[#EE7436]" />
                <h4 className="text-sm font-700 text-[#F0F4FF]">Randevu Geçmişi</h4>
                <Badge variant="muted">{patientAppointments.length}</Badge>
              </div>
              {detailLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#EE7436] border-t-transparent" />
                </div>
              ) : patientAppointments.length === 0 ? (
                <div className="rounded-xl bg-white/4 px-4 py-6 text-center">
                  <p className="text-sm text-[#8A9BC4]">Randevu bulunamadı</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                  {patientAppointments.map(apt => (
                    <div key={apt.id} className="flex items-center gap-3 rounded-xl bg-white/4 px-4 py-2.5">
                      <div className="flex flex-col items-center rounded-lg bg-white/8 px-2.5 py-1.5 text-center min-w-[56px]">
                        <span className="text-xs font-700 text-[#F0F4FF]">{apt.startTime}</span>
                        <span className="text-[9px] text-[#8A9BC4]">{apt.durationMinutes}dk</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#F0F4FF]">{formatDate(apt.appointmentDate)}</p>
                        <p className="text-xs text-[#8A9BC4] truncate">{apt.chiefComplaint ?? 'Belirtilmemiş'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={STATUS_VARIANT[apt.status] ?? 'muted'}>{apt.status}</Badge>
                        <Badge variant="muted">{apt.consultationType === 'VIDEO_CALL' ? 'Video' : 'Yüz Yüze'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
