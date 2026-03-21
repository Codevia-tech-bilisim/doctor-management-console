// src/pages/doctor/slots/DoctorSlots.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, Badge, Button, Modal, PageLoader, Empty } from '@/components/ui';
import { Clock, Plus, RefreshCw, ChevronLeft, ChevronRight, Lock, Unlock, Trash2 } from 'lucide-react';
import {
  getSlotsInRange, generateDailySlots, generateWeeklySlots,
  blockSlot, unblockSlot, deleteSlot,
} from '@/api/endpoints/doctors';
import type { TimeSlot } from '@/api/types';
import { formatDate } from '@/lib/utils';

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toISO(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const SLOT_COLOR: Record<string, string> = {
  AVAILABLE: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  BOOKED:    'bg-blue-500/12    text-blue-400    border-blue-500/20    cursor-default',
  BLOCKED:   'bg-red-500/12     text-red-400     border-red-500/20',
  EXPIRED:   'bg-white/5        text-[#8A9BC4]   border-white/8        cursor-default opacity-50',
};

export default function DoctorSlots() {
  const { user } = useAuth();
  const doctorId = user?.userId ?? '';

  const [weekStart,   setWeekStart]   = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1); // Pazartesi
    return d;
  });
  const [slots,        setSlots]        = useState<TimeSlot[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [genLoading,   setGenLoading]   = useState(false);
  const [selected,     setSelected]     = useState<TimeSlot | null>(null);
  const [blockReason,  setBlockReason]  = useState('');
  const [genModal,     setGenModal]     = useState(false);
  const [genDate,      setGenDate]      = useState(toISO(new Date()));
  const [genDuration,  setGenDuration]  = useState(30);
  const [genWeekly,    setGenWeekly]    = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const load = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const res = await getSlotsInRange(doctorId, toISO(weekStart), toISO(addDays(weekStart, 6)));
      setSlots(res.data ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [doctorId, weekStart]);

  useEffect(() => { load(); }, [load]);

  const slotsForDay = (date: string) => slots.filter(s => s.date === date);

  const handleGenerate = async () => {
    setGenLoading(true);
    try {
      if (genWeekly) {
        await generateWeeklySlots(doctorId, genDate, genDuration);
      } else {
        await generateDailySlots(doctorId, genDate, genDuration);
      }
      await load();
    } catch { /* ignore */ }
    setGenLoading(false);
    setGenModal(false);
  };

  const handleBlock = async () => {
    if (!selected || !blockReason.trim()) return;
    setActionLoading(true);
    try {
      await blockSlot(selected.id, blockReason, doctorId);
      await load();
    } catch { /* ignore */ }
    setActionLoading(false);
    setSelected(null);
    setBlockReason('');
  };

  const handleUnblock = async (slot: TimeSlot) => {
    setActionLoading(true);
    try {
      await unblockSlot(slot.id);
      await load();
    } catch { /* ignore */ }
    setActionLoading(false);
  };

  const handleDelete = async (slot: TimeSlot) => {
    setActionLoading(true);
    try {
      await deleteSlot(slot.id, doctorId);
      await load();
    } catch { /* ignore */ }
    setActionLoading(false);
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-800 text-[#F0F4FF]">Slot Yönetimi</h1>
          <p className="text-sm text-[#8A9BC4] mt-0.5">
            {formatDate(toISO(weekStart), { day: 'numeric', month: 'long' })} –{' '}
            {formatDate(toISO(addDays(weekStart, 6)), { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={load} loading={loading}>
            <RefreshCw size={13} />
          </Button>
          <Button variant="primary" size="sm" onClick={() => setGenModal(true)}>
            <Plus size={14} /> Slot Oluştur
          </Button>
        </div>
      </div>

      {/* Hafta navigasyonu */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setWeekStart(d => addDays(d, -7))}>
          <ChevronLeft size={16} />
        </Button>
        <span className="text-sm font-600 text-[#B8C6E0]">
          {formatDate(toISO(weekStart), { month: 'long', year: 'numeric' })}
        </span>
        <Button variant="ghost" size="sm" onClick={() => setWeekStart(d => addDays(d, 7))}>
          <ChevronRight size={16} />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => {
          const d = new Date();
          d.setDate(d.getDate() - d.getDay() + 1);
          setWeekStart(d);
        }}>
          Bu Hafta
        </Button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        {[
          { label: 'Müsait', color: 'bg-emerald-500' },
          { label: 'Dolu',   color: 'bg-blue-500' },
          { label: 'Blok',   color: 'bg-red-500' },
          { label: 'Süresi Doldu', color: 'bg-white/20' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-[#8A9BC4]">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            {label}
          </div>
        ))}
      </div>

      {/* 7 günlük grid */}
      {loading ? <PageLoader /> : (
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map(day => {
            const iso   = toISO(day);
            const isToday = iso === toISO(new Date());
            const daySlots = slotsForDay(iso);
            const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

            return (
              <Card key={iso} padding={false} className={isToday ? 'border-[#EE7436]/40' : ''}>
                <div className={`border-b border-white/8 px-3 py-2.5 text-center ${isToday ? 'bg-[#EE7436]/8' : ''}`}>
                  <p className={`text-[10px] font-700 uppercase tracking-wider ${isToday ? 'text-[#EE7436]' : 'text-[#8A9BC4]'}`}>
                    {DAY_NAMES[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                  </p>
                  <p className={`text-base font-800 ${isToday ? 'text-[#EE7436]' : 'text-[#F0F4FF]'}`}>
                    {day.getDate()}
                  </p>
                  <p className="text-[9px] text-[#8A9BC4]">{daySlots.length} slot</p>
                </div>
                <div className="flex flex-col gap-1 overflow-y-auto p-2" style={{ maxHeight: 280 }}>
                  {daySlots.length === 0
                    ? <p className="py-4 text-center text-[10px] text-[#8A9BC4]/60">—</p>
                    : daySlots.map(slot => (
                      <div
                        key={slot.id}
                        role={slot.status !== 'EXPIRED' && slot.status !== 'BOOKED' ? 'button' : undefined}
                        tabIndex={slot.status !== 'EXPIRED' && slot.status !== 'BOOKED' ? 0 : undefined}
                        onClick={() => slot.status !== 'EXPIRED' && slot.status !== 'BOOKED' && setSelected(slot)}
                        onKeyDown={e => e.key === 'Enter' && slot.status !== 'EXPIRED' && slot.status !== 'BOOKED' && setSelected(slot)}
                        className={`group relative rounded-lg border px-2 py-1.5 text-left text-[10px] font-600 transition-all ${SLOT_COLOR[slot.status]} ${slot.status !== 'EXPIRED' && slot.status !== 'BOOKED' ? 'cursor-pointer' : ''}`}
                      >
                        <span className="block">{slot.startTime}</span>
                        <span className="block opacity-70">{slot.durationMinutes}dk</span>
                        {/* Inline actions for AVAILABLE/BLOCKED */}
                        {(slot.status === 'AVAILABLE' || slot.status === 'BLOCKED') && (
                          <div className="absolute right-1 top-1 hidden group-hover:flex gap-0.5">
                            {slot.status === 'BLOCKED' ? (
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={e => { e.stopPropagation(); handleUnblock(slot); }}
                                onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), handleUnblock(slot))}
                                className="rounded p-0.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 cursor-pointer"
                                title="Bloğu Kaldır"
                              >
                                <Unlock size={9} />
                              </span>
                            ) : null}
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={e => { e.stopPropagation(); handleDelete(slot); }}
                              onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), handleDelete(slot))}
                              className="rounded p-0.5 bg-red-500/20 text-red-400 hover:bg-red-500/40 cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 size={9} />
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Slot detay / blok modal */}
      <Modal
        open={!!selected}
        onClose={() => { setSelected(null); setBlockReason(''); }}
        title="Slot İşlemleri"
        width="max-w-sm"
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-white/4 p-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: 'Tarih',  v: formatDate(selected.date) },
                  { l: 'Saat',   v: `${selected.startTime} – ${selected.endTime}` },
                  { l: 'Süre',   v: `${selected.durationMinutes} dakika` },
                  { l: 'Durum',  v: selected.status },
                ].map(({ l, v }) => (
                  <div key={l}>
                    <p className="text-[10px] font-700 uppercase tracking-wider text-[#8A9BC4]">{l}</p>
                    <p className="mt-0.5 text-sm text-[#F0F4FF]">{v}</p>
                  </div>
                ))}
              </div>
              {selected.blockReason && (
                <div className="mt-3 border-t border-white/8 pt-3">
                  <p className="text-[10px] font-700 uppercase tracking-wider text-[#8A9BC4]">Blok Nedeni</p>
                  <p className="mt-0.5 text-sm text-red-400">{selected.blockReason}</p>
                </div>
              )}
            </div>

            {selected.status === 'AVAILABLE' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-700 uppercase tracking-wider text-[#8A9BC4]">Blok Nedeni</label>
                  <input
                    value={blockReason}
                    onChange={e => setBlockReason(e.target.value)}
                    placeholder="İzin, toplantı, özel..."
                    className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-[#F0F4FF] outline-none placeholder:text-[#8A9BC4]/60 focus:border-[#EE7436]/50"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setSelected(null)} className="flex-1">İptal</Button>
                  <Button variant="danger" onClick={handleBlock} loading={actionLoading} disabled={!blockReason.trim()} className="flex-1">
                    <Lock size={13} /> Blokla
                  </Button>
                </div>
              </>
            )}
            {selected.status === 'BLOCKED' && (
              <Button variant="success" onClick={() => { handleUnblock(selected); setSelected(null); }} loading={actionLoading}>
                <Unlock size={13} /> Bloğu Kaldır
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* Slot oluşturma modal */}
      <Modal open={genModal} onClose={() => setGenModal(false)} title="Slot Oluştur" width="max-w-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-700 uppercase tracking-wider text-[#8A9BC4]">Başlangıç Tarihi</label>
            <input
              type="date"
              value={genDate}
              onChange={e => setGenDate(e.target.value)}
              min={toISO(new Date())}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-[#F0F4FF] outline-none focus:border-[#EE7436]/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-700 uppercase tracking-wider text-[#8A9BC4]">Seans Süresi</label>
            <select
              value={genDuration}
              onChange={e => setGenDuration(Number(e.target.value))}
              className="h-10 rounded-xl border border-white/10 bg-[#162040] px-4 text-sm text-[#F0F4FF] outline-none focus:border-[#EE7436]/50"
            >
              {[15, 20, 30, 45, 60].map(d => (
                <option key={d} value={d}>{d} dakika</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white/4 p-3">
            <input
              type="checkbox"
              id="weekly"
              checked={genWeekly}
              onChange={e => setGenWeekly(e.target.checked)}
              className="h-4 w-4 rounded accent-[#EE7436]"
            />
            <label htmlFor="weekly" className="text-sm text-[#B8C6E0] cursor-pointer">
              Haftalık oluştur (seçilen tarihten 7 gün)
            </label>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="ghost" onClick={() => setGenModal(false)} className="flex-1">İptal</Button>
            <Button variant="primary" onClick={handleGenerate} loading={genLoading} className="flex-1">
              <Plus size={14} /> Oluştur
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
