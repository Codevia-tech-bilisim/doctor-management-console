// src/pages/doctor/appointments/DoctorAppointments.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, Badge, Button, PageLoader, Empty, Table, Th, Td, Modal } from '@/components/ui';
import {
  Calendar, Video, RefreshCw, ChevronLeft, ChevronRight,
  ExternalLink, FileText, Save, Play, CheckCircle2, UserX,
} from 'lucide-react';
import {
  getAppointmentsByDoctor,
  confirmAppointment, checkInAppointment, startConsultation,
  completeAppointment, cancelAppointment, markNoShow, getMeetingLink,
} from '@/api/endpoints/appointments';
import type { Appointment, AppointmentStatus } from '@/api/types';
import { formatDate, formatRelative } from '@/lib/utils';

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

const FILTERS = [
  { value: 'ALL',         label: 'Tümü' },
  { value: 'CONFIRMED',   label: 'Onaylandı' },
  { value: 'IN_PROGRESS', label: 'Devam Ediyor' },
  { value: 'COMPLETED',   label: 'Tamamlandı' },
  { value: 'CANCELLED',   label: 'İptal' },
];

export default function DoctorAppointments() {
  const { user } = useAuth();
  const doctorId = user?.userId ?? '';

  const [appointments, setAppointments]   = useState<Appointment[]>([]);
  const [total,        setTotal]          = useState(0);
  const [page,         setPage]           = useState(0);
  const [loading,      setLoading]        = useState(true);
  const [filter,       setFilter]         = useState('ALL');
  const [actionId,     setActionId]       = useState<string | null>(null);

  // Notlar + Tamamla modal
  const [noteModal,    setNoteModal]      = useState<Appointment | null>(null);
  const [doctorNotes,  setDoctorNotes]    = useState('');
  const [prescription, setPrescription]   = useState('');

  // Detay modal
  const [detailModal,  setDetailModal]    = useState<Appointment | null>(null);

  // Zoom modal
  const [zoomModal,    setZoomModal]      = useState<{ url: string; apt: Appointment } | null>(null);
  const [zoomLoading,  setZoomLoading]    = useState<string | null>(null);

  const load = useCallback(async (p = 0) => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const res = await getAppointmentsByDoctor(doctorId, p, PAGE_SIZE);
      const all = extractList<Appointment>(res.data);
      const filtered = filter === 'ALL' ? all : all.filter(a => a.status === filter);
      setAppointments(filtered);
      setTotal(extractTotal(res.data, all.length));
      setPage(p);
    } catch { /* ignore */ }
    setLoading(false);
  }, [doctorId, filter]);

  useEffect(() => { load(0); }, [filter]);

  // Genel aksiyon helper
  const act = async (id: string, fn: () => Promise<{ data: Appointment }>) => {
    setActionId(id);
    try {
      const res = await fn();
      setAppointments(prev => prev.map(a => a.id === id ? res.data : a));
      if (detailModal?.id === id) setDetailModal(res.data);
    } catch { /* ignore */ }
    setActionId(null);
  };

  // Tamamla (not ile)
  const handleComplete = async () => {
    if (!noteModal) return;
    setActionId(noteModal.id);
    try {
      const res = await completeAppointment(noteModal.id, doctorId, doctorNotes || undefined, prescription || undefined);
      setAppointments(prev => prev.map(a => a.id === noteModal.id ? res.data : a));
    } catch { /* ignore */ }
    setActionId(null);
    setNoteModal(null);
    setDoctorNotes('');
    setPrescription('');
  };

  // Zoom aç
  const openZoom = async (apt: Appointment) => {
    setZoomLoading(apt.id);
    try {
      const url = apt.meetingInfo?.startUrl ?? apt.meetingInfo?.meetingUrl ?? apt.meetingInfo?.joinUrl;
      if (url) {
        setZoomModal({ url, apt });
      } else {
        const res = await getMeetingLink(apt.id);
        const link = res.data?.startUrl ?? res.data?.joinUrl;
        if (link) setZoomModal({ url: link, apt });
      }
    } catch { /* ignore */ }
    setZoomLoading(null);
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-800 text-[#F0F4FF]">Randevularım</h1>
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

      {/* Tablo */}
      <Card padding={false}>
        {loading ? <PageLoader /> : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Tarih / Saat</Th>
                  <Th>Hasta</Th>
                  <Th>Şikayet</Th>
                  <Th>Tür</Th>
                  <Th>Durum</Th>
                  <Th className="text-right">İşlemler</Th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0
                  ? <tr><td colSpan={6}><Empty icon={Calendar} message="Randevu bulunamadı" /></td></tr>
                  : appointments.map(apt => (
                    <tr key={apt.id}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors cursor-pointer"
                      onClick={() => setDetailModal(apt)}>
                      <Td>
                        <p className="font-600 text-[#F0F4FF]">{formatDate(apt.appointmentDate)}</p>
                        <p className="text-xs text-[#8A9BC4]">{apt.startTime} – {apt.endTime}</p>
                      </Td>
                      <Td className="font-mono text-xs text-[#8A9BC4]">{apt.patientId.slice(-8)}</Td>
                      <Td className="max-w-[160px] truncate text-[#B8C6E0] text-xs">{apt.chiefComplaint ?? '—'}</Td>
                      <Td>
                        <Badge variant={apt.consultationType === 'VIDEO_CALL' ? 'info' : apt.consultationType === 'IN_PERSON' ? 'success' : 'warn'}>
                          {apt.consultationType === 'VIDEO_CALL' ? 'Online' : apt.consultationType === 'IN_PERSON' ? 'In Person' : apt.consultationType}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge variant={STATUS_VARIANT[apt.status] ?? 'muted'}>
                          {STATUS_LABEL[apt.status] ?? apt.status}
                        </Badge>
                      </Td>
                      <Td className="text-right">
                        <AppointmentActions
                          apt={apt}
                          doctorId={doctorId}
                          loading={actionId === apt.id}
                          zoomLoading={zoomLoading === apt.id}
                          onCheckIn={() => act(apt.id, () => checkInAppointment(apt.id) as any)}
                          onStart={() => act(apt.id, () => startConsultation(apt.id, doctorId) as any)}
                          onComplete={() => { setNoteModal(apt); setDoctorNotes(apt.doctorNotes ?? ''); }}
                          onCancel={() => act(apt.id, () => cancelAppointment(apt.id, doctorId) as any)}
                          onNoShow={() => act(apt.id, () => markNoShow(apt.id) as any)}
                          onZoom={() => openZoom(apt)}
                        />
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

      {/* ── Detay Modal ── */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Randevu Detayı" width="max-w-xl">
        {detailModal && (
          <div className="flex flex-col gap-4">
            {/* Durum + tip */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={STATUS_VARIANT[detailModal.status] ?? 'muted'}>
                {STATUS_LABEL[detailModal.status] ?? detailModal.status}
              </Badge>
              <Badge variant={detailModal.consultationType === 'VIDEO_CALL' ? 'info' : 'success'}>
                {detailModal.consultationType === 'VIDEO_CALL' ? 'Online' : detailModal.consultationType === 'IN_PERSON' ? 'In Person' : detailModal.consultationType}
              </Badge>
              {detailModal.meetingInfo && (
                <Badge variant="info">Zoom Bağlı</Badge>
              )}
            </div>

            {/* Bilgiler grid */}
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-white/4 p-4">
              {[
                { l: 'Tarih',    v: formatDate(detailModal.appointmentDate) },
                { l: 'Saat',     v: `${detailModal.startTime} – ${detailModal.endTime}` },
                { l: 'Süre',     v: `${detailModal.durationMinutes} dk` },
                { l: 'Hasta ID', v: <span className="font-mono text-xs">{detailModal.patientId}</span> },
                { l: 'Ücret',    v: detailModal.consultationFee ? `${detailModal.consultationFee} ${detailModal.currency ?? '₺'}` : '—' },
                { l: 'Ödeme',    v: detailModal.paymentStatus },
              ].map(({ l, v }) => (
                <div key={l}>
                  <p className="text-[10px] font-700 uppercase tracking-wider text-[#8A9BC4]">{l}</p>
                  <p className="mt-0.5 text-sm text-[#F0F4FF]">{v}</p>
                </div>
              ))}
            </div>

            {/* Hasta şikayeti */}
            {detailModal.chiefComplaint && (
              <div className="rounded-xl bg-white/4 p-4">
                <p className="text-[10px] font-700 uppercase tracking-wider text-[#8A9BC4] mb-1.5">Hasta Şikayeti</p>
                <p className="text-sm text-[#B8C6E0] leading-relaxed">{detailModal.chiefComplaint}</p>
              </div>
            )}

            {/* Hasta notu */}
            {detailModal.patientNotes && (
              <div className="rounded-xl bg-blue-500/8 border border-blue-500/20 p-4">
                <p className="text-[10px] font-700 uppercase tracking-wider text-blue-400 mb-1.5">Hasta Notu</p>
                <p className="text-sm text-[#B8C6E0] leading-relaxed">{detailModal.patientNotes}</p>
              </div>
            )}

            {/* Doktor notu */}
            <div className="rounded-xl bg-white/4 p-4">
              <p className="text-[10px] font-700 uppercase tracking-wider text-[#8A9BC4] mb-1.5">Doktor Notu</p>
              {detailModal.doctorNotes
                ? <p className="text-sm text-[#B8C6E0] leading-relaxed">{detailModal.doctorNotes}</p>
                : <p className="text-sm text-[#8A9BC4]/60 italic">Henüz not eklenmedi</p>
              }
            </div>

            {/* Reçete */}
            {detailModal.prescriptionId && (
              <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-4">
                <p className="text-[10px] font-700 uppercase tracking-wider text-emerald-400 mb-1">Reçete ID</p>
                <p className="font-mono text-sm text-emerald-400">{detailModal.prescriptionId}</p>
              </div>
            )}

            {/* Aksiyon butonları */}
            <div className="flex flex-wrap gap-2 pt-1">
              {detailModal.consultationType === 'VIDEO_CALL' &&
                (detailModal.status === 'CONFIRMED' || detailModal.status === 'CHECKED_IN' || detailModal.status === 'IN_PROGRESS') && (
                <Button variant="primary" size="sm" loading={zoomLoading === detailModal.id} onClick={() => openZoom(detailModal)}>
                  <Video size={13} /> Zoom'a Katıl
                </Button>
              )}
              {detailModal.status === 'IN_PROGRESS' && (
                <Button variant="success" size="sm" onClick={() => {
                  setDetailModal(null);
                  setNoteModal(detailModal);
                  setDoctorNotes(detailModal.doctorNotes ?? '');
                }}>
                  <FileText size={13} /> Not Ekle & Tamamla
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Not + Tamamla Modal ── */}
      <Modal open={!!noteModal} onClose={() => { setNoteModal(null); setDoctorNotes(''); setPrescription(''); }}
        title="Muayene Notu & Tamamla" width="max-w-lg">
        {noteModal && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-white/4 p-3 text-sm text-[#B8C6E0]">
              <span className="font-600 text-[#F0F4FF]">{formatDate(noteModal.appointmentDate)}</span>
              {' · '}{noteModal.startTime} · Hasta: <span className="font-mono text-xs">{noteModal.patientId.slice(-8)}</span>
            </div>

            {/* Hasta şikayeti - readonly */}
            {noteModal.chiefComplaint && (
              <div className="rounded-xl bg-blue-500/8 border border-blue-500/20 p-3">
                <p className="text-[10px] font-700 uppercase tracking-wider text-blue-400 mb-1">Hasta Şikayeti</p>
                <p className="text-sm text-[#B8C6E0]">{noteModal.chiefComplaint}</p>
              </div>
            )}

            {/* Hasta notu - readonly */}
            {noteModal.patientNotes && (
              <div className="rounded-xl bg-white/4 p-3">
                <p className="text-[10px] font-700 uppercase tracking-wider text-[#8A9BC4] mb-1">Hasta Notu</p>
                <p className="text-sm text-[#B8C6E0]">{noteModal.patientNotes}</p>
              </div>
            )}

            {/* Doktor notu */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-700 uppercase tracking-wider text-[#8A9BC4]">
                Doktor Notu <span className="text-[#8A9BC4]/50 normal-case font-400">(maks 2000 karakter)</span>
              </label>
              <textarea
                value={doctorNotes}
                onChange={e => setDoctorNotes(e.target.value)}
                maxLength={2000}
                rows={5}
                placeholder="Muayene bulguları, tanı, tedavi önerileri..."
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-[#F0F4FF] outline-none placeholder:text-[#8A9BC4]/60 focus:border-[#EE7436]/50 resize-none"
              />
              <p className="text-right text-[10px] text-[#8A9BC4]/60">{doctorNotes.length}/2000</p>
            </div>

            {/* Reçete ID */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-700 uppercase tracking-wider text-[#8A9BC4]">
                Reçete ID <span className="text-[#8A9BC4]/50 normal-case font-400">(opsiyonel)</span>
              </label>
              <input
                value={prescription}
                onChange={e => setPrescription(e.target.value)}
                placeholder="Reçete referans numarası"
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-[#F0F4FF] outline-none placeholder:text-[#8A9BC4]/60 focus:border-[#EE7436]/50"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="ghost" onClick={() => { setNoteModal(null); setDoctorNotes(''); setPrescription(''); }} className="flex-1">
                İptal
              </Button>
              <Button variant="success" onClick={handleComplete} loading={actionId === noteModal.id} className="flex-1">
                <CheckCircle2 size={14} /> Tamamla
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Zoom Modal ── */}
      <Modal open={!!zoomModal} onClose={() => setZoomModal(null)} title="Zoom Görüşmesi" width="max-w-sm">
        {zoomModal && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-blue-500/8 border border-blue-500/20 p-4">
              <p className="text-sm text-blue-400 font-600">Toplantı hazır!</p>
              <p className="text-xs text-[#8A9BC4] mt-1">
                {formatDate(zoomModal.apt.appointmentDate)} · {zoomModal.apt.startTime}
              </p>
              {zoomModal.apt.meetingInfo?.meetingId && (
                <p className="text-xs text-[#8A9BC4] mt-0.5 font-mono">
                  Meeting ID: {zoomModal.apt.meetingInfo.meetingId}
                </p>
              )}
            </div>
            <a
              href={zoomModal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-11 rounded-xl bg-[#EE7436] text-white text-sm font-700 hover:bg-[#D45E20] transition-colors"
            >
              <Video size={16} /> Zoom'a Katıl <ExternalLink size={13} />
            </a>
            <p className="text-xs text-center text-[#8A9BC4]">Yeni sekmede açılacak</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Aksiyon butonları bileşeni ─────────────────────────────────────────────────
function AppointmentActions({
  apt, doctorId, loading, zoomLoading,
  onCheckIn, onStart, onComplete, onCancel, onNoShow, onZoom,
}: {
  apt: Appointment; doctorId: string; loading: boolean; zoomLoading: boolean;
  onCheckIn: () => void; onStart: () => void;
  onComplete: () => void; onCancel: () => void; onNoShow: () => void; onZoom: () => void;
}) {
  const isVideo = apt.consultationType === 'VIDEO_CALL';
  return (
    <div className="flex items-center justify-end gap-1.5 flex-wrap">
      {/* CONFIRMED → Check-in (yüz yüze) */}
      {apt.status === 'CONFIRMED' && !isVideo && (
        <Button variant="info" size="sm" loading={loading} onClick={onCheckIn}>
          Check-in
        </Button>
      )}
      {/* CONFIRMED/CHECKED_IN → Başlat */}
      {(apt.status === 'CONFIRMED' || apt.status === 'CHECKED_IN') && (
        <Button variant="orange" size="sm" loading={loading} onClick={onStart}>
          <Play size={11} /> Başlat
        </Button>
      )}
      {/* IN_PROGRESS → Tamamla */}
      {apt.status === 'IN_PROGRESS' && (
        <Button variant="success" size="sm" loading={loading} onClick={onComplete}>
          <FileText size={11} /> Tamamla
        </Button>
      )}
      {/* Video: CONFIRMED/CHECKED_IN/IN_PROGRESS */}
      {isVideo && ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'].includes(apt.status) && (
        <Button variant="primary" size="sm" loading={zoomLoading} onClick={onZoom}>
          <Video size={11} /> Zoom
        </Button>
      )}
      {/* İptal */}
      {['CONFIRMED', 'CHECKED_IN'].includes(apt.status) && (
        <Button variant="danger" size="sm" loading={loading} onClick={onCancel}>
          İptal
        </Button>
      )}
      {/* No-show */}
      {apt.status === 'CONFIRMED' && (
        <Button variant="ghost" size="sm" loading={loading} onClick={onNoShow}>
          <UserX size={11} />
        </Button>
      )}
    </div>
  );
}

// Helpers
function extractList<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.content)) return d.content as T[];
  return [];
}
function extractTotal(data: unknown, fallback: number): number {
  const d = data as Record<string, unknown> | null;
  return typeof d?.totalElements === 'number' ? d.totalElements : fallback;
}
