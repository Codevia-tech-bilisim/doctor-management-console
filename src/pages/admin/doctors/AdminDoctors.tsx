// src/pages/admin/doctors/AdminDoctors.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Badge, Button, Modal, PageLoader, Empty, Table, Th, Td,
} from '@/components/ui';
import {
  Search, CheckCircle2, XCircle, Stethoscope, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { getAllDoctors, searchDoctors, updateVerificationStatus } from '@/api/endpoints/doctors';
import type { Doctor, VerificationStatus } from '@/api/types';
import { formatDate, initials } from '@/lib/utils';

type Filter = 'ALL' | VerificationStatus;

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'Tümü',           value: 'ALL' },
  { label: 'Bekleyen',       value: 'PENDING' },
  { label: 'Onaylı',         value: 'VERIFIED' },
  { label: 'Reddedildi',     value: 'REJECTED' },
  { label: 'Askıya Alındı',  value: 'SUSPENDED' },
];

// Backend bazen Page<T>, bazen T[] dönüyor
function extractList<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.content)) return d.content as T[];
  return [];
}

const verBadge = (s: VerificationStatus): 'success' | 'warn' | 'danger' | 'muted' => (
  ({ VERIFIED: 'success', PENDING: 'warn', REJECTED: 'danger', SUSPENDED: 'muted' } as const)[s]
);

const PAGE_SIZE = 15;

export default function AdminDoctors() {
  const [allDoctors,  setAllDoctors]  = useState<Doctor[]>([]);   // tüm veri
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState<Filter>('ALL');
  const [query,       setQuery]       = useState('');
  const [selected,    setSelected]    = useState<Doctor | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmModal, setConfirmModal]   = useState<{ doctor: Doctor; action: VerificationStatus } | null>(null);

  const load = useCallback(async (p = 0, q = query) => {
    setLoading(true);
    try {
      const res = q.trim()
        ? await searchDoctors(q, p)
        : await getAllDoctors(p, PAGE_SIZE);
      const list = extractList<Doctor>(res.data);
      setAllDoctors(list);
      // totalElements varsa kullan, yoksa list.length
      const resData = res.data as unknown as Record<string, unknown> | null;
      setTotal(typeof resData?.totalElements === 'number' ? resData.totalElements : list.length);
      setPage(p);
    } catch { /* ignore */ }
    setLoading(false);
  }, [filter, query]);

  useEffect(() => { load(0); }, [filter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(0); };

  const handleVerify = async (doctor: Doctor, status: VerificationStatus) => {
    setActionLoading(true);
    try {
      const res = await updateVerificationStatus(doctor.id, status);
      const updated = res.data;
      // State'i anında güncelle — yeniden fetch'e gerek yok
      setAllDoctors(prev => prev.map(d => d.id === doctor.id ? updated : d));
      if (selected?.id === doctor.id) setSelected(updated);
    } catch { /* ignore */ }
    setActionLoading(false);
    setConfirmModal(null);
  };

  // Filtre client-side
  const doctors = filter === 'ALL'
    ? allDoctors
    : allDoctors.filter(d => d.verificationStatus === filter);

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-800 text-[#F0F4FF]">Doktor Yönetimi</h1>
          <p className="text-sm text-[#8A9BC4] mt-0.5">
            {doctors.length} doktor
            {filter !== 'ALL' && ` (${filter})`}
            {' · '}toplam {total}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => load(0)} loading={loading}>
          <RefreshCw size={13} /> Yenile
        </Button>
      </div>

      {/* Filtre + Arama */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-600 transition-all ${
                filter === f.value
                  ? 'bg-[#EE7436] text-white shadow-sm shadow-[#EE7436]/25'
                  : 'bg-white/6 text-[#8A9BC4] hover:bg-white/10 hover:text-[#B8C6E0]'
              }`}
            >
              {f.label}
              {/* inline count */}
              {f.value !== 'ALL' && (
                <span className="ml-1.5 opacity-60">
                  {allDoctors.filter(d => d.verificationStatus === f.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="relative ml-auto w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9BC4]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="İsim veya uzmanlık ara..."
            className="h-9 w-full rounded-xl border border-white/10 bg-white/5 pl-8 pr-4 text-sm text-[#F0F4FF] outline-none placeholder:text-[#8A9BC4]/60 focus:border-[#EE7436]/50 transition-all"
          />
        </form>
      </div>

      {/* Tablo */}
      <Card padding={false}>
        {loading ? <PageLoader /> : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Doktor</Th>
                  <Th>Uzmanlık</Th>
                  <Th>Hastane / Klinik</Th>
                  <Th>Durum</Th>
                  <Th>Randevu</Th>
                  <Th>Kayıt</Th>
                  <Th className="text-right">İşlem</Th>
                </tr>
              </thead>
              <tbody>
                {doctors.length === 0
                  ? <tr><td colSpan={7}><Empty icon={Stethoscope} message="Doktor bulunamadı" /></td></tr>
                  : doctors.map(doc => (
                    <tr
                      key={doc.id}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors cursor-pointer"
                      onClick={() => setSelected(doc)}
                    >
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/8 text-xs font-700 text-[#B8C6E0]">
                            {initials(doc.firstName, doc.lastName)}
                          </div>
                          <div>
                            <p className="font-600 text-[#F0F4FF]">{doc.firstName} {doc.lastName}</p>
                            <p className="text-xs text-[#8A9BC4]">{doc.email}</p>
                          </div>
                        </div>
                      </Td>
                      <Td className="font-500 text-[#B8C6E0]">{doc.specialty ?? '—'}</Td>
                      <Td className="text-[#8A9BC4]">{doc.currentHospital ?? doc.currentClinic ?? '—'}</Td>
                      <Td><Badge variant={verBadge(doc.verificationStatus)}>{doc.verificationStatus}</Badge></Td>
                      <Td>
                        <Badge variant={doc.isAcceptingNewPatients ? 'success' : 'muted'}>
                          {doc.isAcceptingNewPatients ? 'Açık' : 'Kapalı'}
                        </Badge>
                      </Td>
                      <Td className="text-[#8A9BC4]">{formatDate(doc.createdAt)}</Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          {doc.verificationStatus !== 'VERIFIED' && (
                            <Button variant="success" size="sm"
                              onClick={() => setConfirmModal({ doctor: doc, action: 'VERIFIED' })}>
                              <CheckCircle2 size={12} /> Onayla
                            </Button>
                          )}
                          {doc.verificationStatus !== 'REJECTED' && (
                            <Button variant="danger" size="sm"
                              onClick={() => setConfirmModal({ doctor: doc, action: 'REJECTED' })}>
                              <XCircle size={12} /> Reddet
                            </Button>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))
                }
              </tbody>
            </Table>

            {/* Pagination — sadece gerçek sayfa varsa göster */}
            {total > PAGE_SIZE && (
              <div className="flex items-center justify-between border-t border-white/8 px-5 py-3">
                <p className="text-xs text-[#8A9BC4]">
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total}
                </p>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => load(page - 1)}>
                    <ChevronLeft size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => load(page + 1)}>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Doktor detay modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Doktor Detayı" width="max-w-xl">
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EE7436]/15 text-lg font-800 text-[#EE7436]">
                {initials(selected.firstName, selected.lastName)}
              </div>
              <div>
                <h3 className="text-base font-700 text-[#F0F4FF]">{selected.firstName} {selected.lastName}</h3>
                <p className="text-sm text-[#8A9BC4]">{selected.email}</p>
                <div className="mt-1 flex gap-2 flex-wrap">
                  <Badge variant={verBadge(selected.verificationStatus)}>{selected.verificationStatus}</Badge>
                  <Badge variant={selected.isAcceptingNewPatients ? 'success' : 'muted'}>
                    {selected.isAcceptingNewPatients ? 'Randevu Açık' : 'Randevu Kapalı'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl bg-white/4 p-4">
              {[
                { l: 'Uzmanlık',     v: selected.specialty ?? '—' },
                { l: 'Deneyim',      v: selected.yearsOfExperience ? `${selected.yearsOfExperience} yıl` : '—' },
                { l: 'Hastane',      v: selected.currentHospital ?? '—' },
                { l: 'Klinik',       v: selected.currentClinic ?? '—' },
                { l: 'Seans Ücreti', v: selected.consultationFee ? `${selected.consultationFee} ₺` : '—' },
                { l: 'Süre',         v: selected.consultationDurationMinutes ? `${selected.consultationDurationMinutes} dk` : '—' },
                { l: 'Kayıt',        v: formatDate(selected.createdAt) },
                { l: 'Puan',         v: selected.rating ? `${selected.rating.toFixed(1)} (${selected.totalRatings})` : '—' },
              ].map(({ l, v }) => (
                <div key={l}>
                  <p className="text-[10px] font-700 uppercase tracking-wider text-[#8A9BC4]">{l}</p>
                  <p className="mt-0.5 text-sm text-[#F0F4FF]">{v}</p>
                </div>
              ))}
            </div>

            {selected.biography && (
              <div className="rounded-xl bg-white/4 p-4">
                <p className="text-[10px] font-700 uppercase tracking-wider text-[#8A9BC4] mb-2">Biyografi</p>
                <p className="text-sm text-[#B8C6E0] leading-relaxed">{selected.biography}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {selected.verificationStatus !== 'VERIFIED' && (
                <Button variant="success" onClick={() => handleVerify(selected, 'VERIFIED')} loading={actionLoading} className="flex-1">
                  <CheckCircle2 size={14} /> Onayla
                </Button>
              )}
              {selected.verificationStatus !== 'REJECTED' && (
                <Button variant="danger" onClick={() => handleVerify(selected, 'REJECTED')} loading={actionLoading} className="flex-1">
                  <XCircle size={14} /> Reddet
                </Button>
              )}
              {selected.verificationStatus !== 'SUSPENDED' && (
                <Button variant="secondary" onClick={() => handleVerify(selected, 'SUSPENDED')} loading={actionLoading}>
                  Askıya Al
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm modal */}
      <Modal
        open={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.action === 'VERIFIED' ? 'Doktoru Onayla' : 'Doktoru Reddet'}
        width="max-w-sm"
      >
        {confirmModal && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[#B8C6E0]">
              <span className="font-600 text-[#F0F4FF]">
                {confirmModal.doctor.firstName} {confirmModal.doctor.lastName}
              </span>{' '}
              adlı doktoru{' '}
              <span className={confirmModal.action === 'VERIFIED' ? 'text-emerald-400 font-600' : 'text-red-400 font-600'}>
                {confirmModal.action === 'VERIFIED' ? 'onaylamak' : 'reddetmek'}
              </span>{' '}
              istediğinize emin misiniz?
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setConfirmModal(null)} className="flex-1">İptal</Button>
              <Button
                variant={confirmModal.action === 'VERIFIED' ? 'success' : 'danger'}
                onClick={() => handleVerify(confirmModal.doctor, confirmModal.action)}
                loading={actionLoading}
                className="flex-1"
              >
                {confirmModal.action === 'VERIFIED' ? 'Evet, Onayla' : 'Evet, Reddet'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
