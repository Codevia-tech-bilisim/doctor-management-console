// src/pages/admin/appointments/AdminAppointments.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Card, Badge, Button, PageLoader, Empty, Table, Th, Td, Modal } from '@/components/ui';
import { Calendar, RefreshCw, ChevronLeft, ChevronRight, Video, FileText, ExternalLink } from 'lucide-react';
import {
  getAllAppointments, cancelAppointment, getMeetingLink,
} from '@/api/endpoints/appointments';
import type { Appointment, AppointmentStatus } from '@/api/types';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 15;

const STATUS_VARIANT: Record<string, 'info' | 'success' | 'warn' | 'danger' | 'muted' | 'orange'> = {
  CONFIRMED: 'info', COMPLETED: 'success', PENDING: 'warn',
  CANCELLED: 'danger', NO_SHOW: 'danger', RESCHEDULED: 'muted',
  CHECKED_IN: 'info', IN_PROGRESS: 'orange',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Bekliyor', CONFIRMED: 'Onaylandı', CHECKED_IN: 'Check-in',
  IN_PROGRESS: 'Devam Ediyor', COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal', NO_SHOW: 'Gelmedi', RESCHEDULED: 'Ertelendi',
};

const FILTERS: { label: string; value: string }[] = [
  { label: 'Tümü',          value: 'ALL' },
  { label: 'Onaylandı',     value: 'CONFIRMED' },
  { label: 'Devam Ediyor',  value: 'IN_PROGRESS' },
  { label: 'Tamamlandı',    value: 'COMPLETED' },
  { label: 'İptal',         value: 'CANCELLED' },
];

function extractList<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.content)) return d.content as T[];
  return [];
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('ALL');
  const [actionId,     setActionId]     = useState<string | null>(null);
  const [detailModal,  setDetailModal]  = useState<Appointment | null>(null);
  const [zoomModal,    setZoomModal]    = useState<{ url: string; apt: Appointment } | null>(null);
  const [zoomLoading,  setZoomLoading]  = useState<string | null>(null);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const statusParam = filter === 'ALL' ? undefined : filter;
      const res = await getAllAppointments(p, PAGE_SIZE, statusParam);
      const list = extractList<Appointment>(res.data);
      setAppointments(list);
      const d = res.data as unknown as Record<string, unknown>;
      setTotal(typeof d?.totalElements === 'number' ? d.totalElements : list.length);
      setPage(p);
    } catch { /* ignore */ }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(0); }, [filter]);

  const act = async (id: string, fn: () => Promise<{ data: Appointment }>) => {
    setActionId(id);
    try {
      const res = await fn();
      setAppointments(prev => prev.map(a => a.id === id ? res.data : a));
      if (detailModal?.id === id) setDetailModal(res.data);
    } catch { /* ignore */ }
    setActionId(null);
  };

  const openZoom = async (apt: Appointment) => {
    setZoomLoading(apt.id);
    try {
      const url = apt.meetingInfo?.startUrl ?? apt.meetingInfo?.meetingUrl ?? apt.meetingInfo?.joinUrl;
      if (url) { setZoomModal({ url, apt }); }
      else {
        const res = await getMeetingLink(apt.id);
        const link = res.data?.startUrl ?? res.data?.joinUrl;
        if (link) setZoomModal({ url: link, apt });
      }
    } catch { /* ignore */ }
    setZoomLoading(null);
  };

  return (
    <div className="flex flex-col gap-5">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-800 text-[#F0F4FF]">Randevu Yönetimi</h1>
          <p className="text-sm text-[#8A9BC4] mt-0.5">Toplam {total} randevu</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => load(0)} loading={loading}>
          <RefreshCw size={13} /> Yenile
        </Button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-600 transition-all ${
              filter === f.value ? 'bg-[#EE7436] text-white' : 'bg-white/6 text-[#8A9BC4] hover:bg-white/10'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <Card padding={false}>
        {loading ? <PageLoader /> : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Tarih / Saat</Th>
                  <Th>Hasta ID</Th>
                  <Th>Doktor ID</Th>
                  <Th>Tür</Th>
                  <Th>Ücret</Th>
                  <Th>Ödeme</Th>
                  <Th>Durum</Th>
                  <Th className="text-right">İşlem</Th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0
                  ? <tr><td colSpan={8}><Empty icon={Calendar} message="Randevu bulunamadı" /></td></tr>
                  : appointments.map(apt => (
                    <tr key={apt.id}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors cursor-pointer"
                      onClick={() => setDetailModal(apt)}>
                      <Td>
                        <p className="font-600 text-[#F0F4FF]">{formatDate(apt.appointmentDate)}</p>
                        <p className="text-xs text-[#8A9BC4]">{apt.startTime} – {apt.endTime}</p>
                      </Td>
                      <Td className="font-mono text-xs text-[#8A9BC4]">{apt.patientId?.slice(-8)}</Td>
                      <Td className="font-mono text-xs text-[#8A9BC4]">{apt.doctorId?.slice(-8)}</Td>
                      <Td>
                        <Badge variant={apt.consultationType === 'VIDEO_CALL' ? 'info' : 'success'}>
                          {apt.consultationType}
                        </Badge>
                      </Td>
                      <Td className="text-[#B8C6E0]">
                        {apt.consultationFee ? `${apt.consultationFee} ${apt.currency ?? '₺'}` : '—'}
                      </Td>
                      <Td>
                        <Badge variant={apt.paymentStatus === 'PAID' ? 'success' : apt.paymentStatus === 'PENDING' ? 'warn' : 'danger'}>
                          {apt.paymentStatus}
                        </Badge>
                      </Td>
                      <Td><Badge variant={STATUS_VARIANT[apt.status] ?? 'muted'}>{STATUS_LABEL[apt.status] ?? apt.status}</Badge></Td>
                      <Td className="text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {apt.consultationType === 'VIDEO_CALL' &&
                            ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'].includes(apt.status) && (
                            <Button variant="info" size="sm" loading={zoomLoading === apt.id}
                              onClick={() => openZoom(apt)}>
                              <Video size={11} /> Zoom
                            </Button>
                          )}
                          {['CONFIRMED', 'CHECKED_IN'].includes(apt.status) && (
                            <Button variant="danger" size="sm" loading={actionId === apt.id}
                              onClick={() => act(apt.id, () => cancelAppointment(apt.id, 'admin') as any)}>
                              İptal
                            </Button>
                          )}
                        </div>
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

      {/* Detay Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Randevu Detayı" width="max-w-xl">
        {detailModal && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 flex-wrap">
              <Badge variant={STATUS_VARIANT[detailModal.status] ?? 'muted'}>{STATUS_LABEL[detailModal.status]}</Badge>
              <Badge variant={detailModal.consultationType === 'VIDEO_CALL' ? 'info' : 'success'}>{detailModal.consultationType}</Badge>
              {detailModal.meetingInfo && <Badge variant="info">Zoom Bağlı</Badge>}
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl bg-white/4 p-4">
              {[
                { l: 'Tarih',    v: formatDate(detailModal.appointmentDate) },
                { l: 'Saat',     v: `${detailModal.startTime} – ${detailModal.endTime}` },
                { l: 'Hasta ID', v: <span className="font-mono text-xs">{detailModal.patientId}</span> },
                { l: 'Doktor ID',v: <span className="font-mono text-xs">{detailModal.doctorId}</span> },
                { l: 'Ücret',    v: detailModal.consultationFee ? `${detailModal.consultationFee} ${detailModal.currency ?? '₺'}` : '—' },
                { l: 'Ödeme',    v: detailModal.paymentStatus },
              ].map(({ l, v }) => (
                <div key={l}>
                  <p className="text-[10px] font-700 uppercase tracking-wider text-[#8A9BC4]">{l}</p>
                  <p className="mt-0.5 text-sm text-[#F0F4FF]">{v}</p>
                </div>
              ))}
            </div>

            {detailModal.chiefComplaint && (
              <div className="rounded-xl bg-white/4 p-4">
                <p className="text-[10px] font-700 uppercase tracking-wider text-[#8A9BC4] mb-1.5">Hasta Şikayeti</p>
                <p className="text-sm text-[#B8C6E0]">{detailModal.chiefComplaint}</p>
              </div>
            )}
            {detailModal.patientNotes && (
              <div className="rounded-xl bg-blue-500/8 border border-blue-500/20 p-4">
                <p className="text-[10px] font-700 uppercase tracking-wider text-blue-400 mb-1.5">Hasta Notu</p>
                <p className="text-sm text-[#B8C6E0]">{detailModal.patientNotes}</p>
              </div>
            )}
            {detailModal.doctorNotes && (
              <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-4">
                <p className="text-[10px] font-700 uppercase tracking-wider text-emerald-400 mb-1.5">Doktor Notu</p>
                <p className="text-sm text-[#B8C6E0]">{detailModal.doctorNotes}</p>
              </div>
            )}
            {detailModal.cancellationReason && (
              <div className="rounded-xl bg-red-500/8 border border-red-500/20 p-4">
                <p className="text-[10px] font-700 uppercase tracking-wider text-red-400 mb-1">İptal Nedeni</p>
                <p className="text-sm text-[#B8C6E0]">{detailModal.cancellationReason}</p>
              </div>
            )}

            {detailModal.consultationType === 'VIDEO_CALL' &&
              ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'].includes(detailModal.status) && (
              <Button variant="primary" size="sm" loading={zoomLoading === detailModal.id} onClick={() => openZoom(detailModal)}>
                <Video size={14} /> Zoom Linkini Aç
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* Zoom Modal */}
      <Modal open={!!zoomModal} onClose={() => setZoomModal(null)} title="Zoom Görüşmesi" width="max-w-sm">
        {zoomModal && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-blue-500/8 border border-blue-500/20 p-4">
              <p className="text-sm text-blue-400 font-600">Toplantı linki hazır</p>
              <p className="text-xs text-[#8A9BC4] mt-1">{formatDate(zoomModal.apt.appointmentDate)} · {zoomModal.apt.startTime}</p>
              {zoomModal.apt.meetingInfo?.meetingId && (
                <p className="text-xs text-[#8A9BC4] mt-0.5 font-mono">Meeting ID: {zoomModal.apt.meetingInfo.meetingId}</p>
              )}
            </div>
            <a href={zoomModal.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-11 rounded-xl bg-[#EE7436] text-white text-sm font-700 hover:bg-[#D45E20] transition-colors">
              <Video size={16} /> Zoom'a Katıl <ExternalLink size={13} />
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
}
