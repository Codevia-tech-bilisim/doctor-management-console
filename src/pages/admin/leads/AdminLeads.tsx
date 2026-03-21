// src/pages/admin/leads/AdminLeads.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Card, Badge, Button, Modal, PageLoader, Empty, Table, Th, Td, Input } from '@/components/ui';
import {
  Search, RefreshCw, UserPlus, ChevronLeft, ChevronRight,
  MessageSquare, Calendar, TrendingUp, Zap, Tag, ArrowRightLeft,
  UserCheck, CalendarClock, X, Plus,
} from 'lucide-react';
import {
  getAllLeads, getLeadsByStatus, getLeadById, searchLeads,
  changeLeadStatus, assignLead, autoAssignLead, transferLead,
  markLeadLost, scheduleFollowUp, addTag, convertLead,
  getAvailableAgents, getNeedingFollowUp,
} from '@/api/endpoints/admin';
import type { Lead, LeadStatus, Admin } from '@/api/types';
import { formatDate, formatRelative } from '@/lib/utils';

const STATUS_FILTERS: { label: string; value: LeadStatus | 'ALL' }[] = [
  { label: 'Tümü',       value: 'ALL' },
  { label: 'Yeni',       value: 'NEW' },
  { label: 'Atandı',     value: 'ASSIGNED' },
  { label: 'İletişim',   value: 'CONTACTED' },
  { label: 'Nitelikli',  value: 'QUALIFIED' },
  { label: 'Teklif',     value: 'PROPOSAL_SENT' },
  { label: 'Dönüştü',    value: 'CONVERTED' },
  { label: 'Kayıp',      value: 'LOST' },
];

const SOURCE_ICONS: Record<string, string> = {
  WHATSAPP: '📱', INSTAGRAM: '📸', EMAIL: '📧',
  WEB_FORM: '🌐', PHONE: '📞', LIVE_CHAT: '💬',
  REFERRAL: '🤝', GOOGLE_ADS: '🔍', FACEBOOK_ADS: '👍',
  PARTNER: '🏥', WALK_IN: '🚶', OTHER: '📌',
};

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: 'bg-red-500',
  HIGH:   'bg-amber-500',
  MEDIUM: 'bg-blue-500',
  LOW:    'bg-white/20',
};

const STATUS_VARIANT: Record<string, 'warn' | 'info' | 'success' | 'danger' | 'orange' | 'muted'> = {
  NEW: 'orange', ASSIGNED: 'info', CONTACTED: 'info', QUALIFIED: 'success',
  PROPOSAL_SENT: 'info', NEGOTIATION: 'warn', APPOINTMENT_SCHEDULED: 'success',
  CONVERTED: 'success', LOST: 'danger', SPAM: 'muted',
};

export default function AdminLeads() {
  const [leads,     setLeads]     = useState<Lead[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<LeadStatus | 'ALL'>('ALL');
  const [query,     setQuery]     = useState('');
  const [selected,  setSelected]  = useState<Lead | null>(null);
  const [agents,    setAgents]    = useState<Admin[]>([]);
  const [assignModal,    setAssignModal]    = useState<Lead | null>(null);
  const [lostModal,      setLostModal]      = useState<Lead | null>(null);
  const [lostReason,     setLostReason]     = useState('');
  const [followUpModal,  setFollowUpModal]  = useState<Lead | null>(null);
  const [followUpDate,   setFollowUpDate]   = useState('');
  const [convertModal,   setConvertModal]   = useState<Lead | null>(null);
  const [convertPatientId, setConvertPatientId] = useState('');
  const [transferModal,  setTransferModal]  = useState<Lead | null>(null);
  const [tagInput,       setTagInput]       = useState('');
  const [actionLoading,  setActionLoading]  = useState(false);
  const PAGE_SIZE = 15;

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      let res;
      if (query.trim()) {
        res = await searchLeads(query.trim(), p);
      } else if (filter === 'ALL') {
        res = await getAllLeads(p, PAGE_SIZE);
      } else {
        res = await getLeadsByStatus(filter, p);
      }
      setLeads(res.data?.content ?? []);
      setTotal(res.data?.totalElements ?? 0);
      setPage(p);
    } catch { /* ignore */ }
    setLoading(false);
  }, [filter, query]);

  useEffect(() => { load(0); }, [filter]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(() => load(0), 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Agents yükle
  useEffect(() => {
    getAvailableAgents().then(r => setAgents(r.data ?? [])).catch(() => {});
  }, []);

  const handleAutoAssign = async (lead: Lead) => {
    setActionLoading(true);
    try {
      const res = await autoAssignLead(lead.id);
      setLeads(prev => prev.map(l => l.id === lead.id ? res.data : l));
    } catch { /* ignore */ }
    setActionLoading(false);
  };

  const handleAssign = async (agentId: string) => {
    if (!assignModal) return;
    setActionLoading(true);
    try {
      const res = await assignLead(assignModal.id, agentId);
      setLeads(prev => prev.map(l => l.id === assignModal.id ? res.data : l));
    } catch { /* ignore */ }
    setActionLoading(false);
    setAssignModal(null);
  };

  const handleMarkLost = async () => {
    if (!lostModal || !lostReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await markLeadLost(lostModal.id, lostReason);
      setLeads(prev => prev.map(l => l.id === lostModal.id ? res.data : l));
    } catch { /* ignore */ }
    setActionLoading(false);
    setLostModal(null);
    setLostReason('');
  };

  const handleFollowUp = async () => {
    if (!followUpModal || !followUpDate) return;
    setActionLoading(true);
    try {
      const res = await scheduleFollowUp(followUpModal.id, followUpDate);
      setLeads(prev => prev.map(l => l.id === followUpModal.id ? res.data : l));
      if (selected?.id === followUpModal.id) setSelected(res.data);
    } catch { /* ignore */ }
    setActionLoading(false);
    setFollowUpModal(null);
    setFollowUpDate('');
  };

  const handleConvert = async () => {
    if (!convertModal || !convertPatientId.trim()) return;
    setActionLoading(true);
    try {
      const res = await convertLead(convertModal.id, convertPatientId.trim());
      setLeads(prev => prev.map(l => l.id === convertModal.id ? res.data : l));
      if (selected?.id === convertModal.id) setSelected(res.data);
    } catch { /* ignore */ }
    setActionLoading(false);
    setConvertModal(null);
    setConvertPatientId('');
  };

  const handleTransfer = async (newAgentId: string) => {
    if (!transferModal) return;
    setActionLoading(true);
    try {
      const res = await transferLead(transferModal.id, newAgentId);
      setLeads(prev => prev.map(l => l.id === transferModal.id ? res.data : l));
      if (selected?.id === transferModal.id) setSelected(res.data);
    } catch { /* ignore */ }
    setActionLoading(false);
    setTransferModal(null);
  };

  const handleAddTag = async (lead: Lead) => {
    if (!tagInput.trim()) return;
    setActionLoading(true);
    try {
      const res = await addTag(lead.id, tagInput.trim());
      setLeads(prev => prev.map(l => l.id === lead.id ? res.data : l));
      if (selected?.id === lead.id) setSelected(res.data);
      setTagInput('');
    } catch { /* ignore */ }
    setActionLoading(false);
  };

  const handleStatusChange = async (lead: Lead, status: LeadStatus) => {
    setActionLoading(true);
    try {
      const res = await changeLeadStatus(lead.id, status);
      setLeads(prev => prev.map(l => l.id === lead.id ? res.data : l));
      if (selected?.id === lead.id) setSelected(res.data);
    } catch { /* ignore */ }
    setActionLoading(false);
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-800 text-[#F0F4FF]">Lead Yönetimi</h1>
          <p className="text-sm text-[#8A9BC4] mt-0.5">Toplam {total} lead</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Arama kutusu */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9BC4]" />
            <input
              type="text"
              placeholder="Lead ara..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="h-9 w-56 rounded-xl border border-white/10 bg-white/5 pl-9 pr-8 text-sm text-[#F0F4FF] outline-none placeholder:text-[#8A9BC4]/60 focus:border-[#EE7436]/50 transition-colors"
            />
            {query && (
              <button onClick={() => { setQuery(''); load(0); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A9BC4] hover:text-[#F0F4FF]">
                <X size={13} />
              </button>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={() => load(0)} loading={loading}>
            <RefreshCw size={13} /> Yenile
          </Button>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-600 transition-all ${
              filter === f.value
                ? 'bg-[#EE7436] text-white'
                : 'bg-white/6 text-[#8A9BC4] hover:bg-white/10 hover:text-[#B8C6E0]'
            }`}
          >
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
                  <Th>Lead</Th>
                  <Th>Kaynak</Th>
                  <Th>Öncelik</Th>
                  <Th>Durum</Th>
                  <Th>Atanmış Agent</Th>
                  <Th>Tarih</Th>
                  <Th className="text-right">İşlem</Th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0
                  ? <tr><td colSpan={7}><Empty icon={MessageSquare} message="Lead bulunamadı" /></td></tr>
                  : leads.map(lead => (
                    <tr
                      key={lead.id}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors cursor-pointer"
                      onClick={() => setSelected(lead)}
                    >
                      <Td>
                        <div>
                          <p className="font-600 text-[#F0F4FF]">
                            {lead.firstName} {lead.lastName ?? ''}
                          </p>
                          <p className="text-xs text-[#8A9BC4]">{lead.phone ?? lead.email ?? '—'}</p>
                        </div>
                      </Td>
                      <Td>
                        <span className="flex items-center gap-1.5 text-[#B8C6E0]">
                          <span>{SOURCE_ICONS[lead.source] ?? '📌'}</span>
                          <span className="text-xs">{lead.source}</span>
                        </span>
                      </Td>
                      <Td>
                        <span className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${PRIORITY_COLOR[lead.priority]}`} />
                          <span className="text-xs text-[#B8C6E0]">{lead.priority}</span>
                        </span>
                      </Td>
                      <Td><Badge variant={STATUS_VARIANT[lead.status] ?? 'muted'}>{lead.status}</Badge></Td>
                      <Td className="text-[#8A9BC4] text-xs">
                        {lead.assignedAgentName ?? <span className="text-amber-400">Atanmamış</span>}
                      </Td>
                      <Td className="text-[#8A9BC4] text-xs">{formatRelative(lead.createdAt)}</Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          {!lead.assignedAgentId && (
                            <Button variant="orange" size="sm" onClick={() => handleAutoAssign(lead)} loading={actionLoading}>
                              <Zap size={11} /> Oto-Ata
                            </Button>
                          )}
                          <Button variant="secondary" size="sm" onClick={() => setAssignModal(lead)}>
                            <UserPlus size={11} /> Ata
                          </Button>
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

      {/* Lead detay modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Lead Detayı" width="max-w-xl">
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#EE7436]/15 text-base font-800 text-[#EE7436]">
                {(selected.firstName[0] ?? '?').toUpperCase()}
              </div>
              <div>
                <h3 className="font-700 text-[#F0F4FF]">{selected.firstName} {selected.lastName ?? ''}</h3>
                <p className="text-xs text-[#8A9BC4]">{selected.phone ?? selected.email ?? '—'}</p>
                <div className="mt-1 flex gap-1.5">
                  <Badge variant={STATUS_VARIANT[selected.status] ?? 'muted'}>{selected.status}</Badge>
                  <Badge variant="muted">{selected.source}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl bg-white/4 p-4">
              {[
                { l: 'Öncelik',       v: selected.priority },
                { l: 'Dil',           v: selected.preferredLanguage ?? '—' },
                { l: 'Uyruk',         v: selected.nationality ?? '—' },
                { l: 'Bütçe',         v: selected.budgetRange ?? '—' },
                { l: 'Tarih Tercihi', v: selected.preferredDates ?? '—' },
                { l: 'Atanan Agent',  v: selected.assignedAgentName ?? 'Atanmamış' },
                { l: 'Oluşturulma',   v: formatDate(selected.createdAt) },
                { l: 'Son İletişim',  v: selected.lastContactAt ? formatRelative(selected.lastContactAt) : '—' },
              ].map(({ l, v }) => (
                <div key={l}>
                  <p className="text-[10px] font-700 uppercase tracking-wider text-[#8A9BC4]">{l}</p>
                  <p className="mt-0.5 text-sm text-[#F0F4FF]">{v}</p>
                </div>
              ))}
            </div>

            {selected.initialMessage && (
              <div className="rounded-xl bg-white/4 p-4">
                <p className="text-[10px] font-700 uppercase tracking-wider text-[#8A9BC4] mb-2">İlk Mesaj</p>
                <p className="text-sm text-[#B8C6E0] leading-relaxed">{selected.initialMessage}</p>
              </div>
            )}

            {/* Tags */}
            <div>
              <p className="text-[10px] font-700 uppercase tracking-wider text-[#8A9BC4] mb-2">Etiketler</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(selected.tags ?? []).map(t => (
                  <span key={t} className="flex items-center gap-1 rounded-lg bg-[#EE7436]/15 px-2 py-0.5 text-[10px] font-600 text-[#EE7436]">
                    <Tag size={9} /> {t}
                  </span>
                ))}
                {(!selected.tags || selected.tags.length === 0) && (
                  <span className="text-xs text-[#8A9BC4]/60">Etiket yok</span>
                )}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Etiket ekle..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTag(selected)}
                  className="flex-1 h-8 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-[#F0F4FF] outline-none placeholder:text-[#8A9BC4]/60 focus:border-[#EE7436]/50"
                />
                <Button variant="orange" size="sm" onClick={() => handleAddTag(selected)} disabled={!tagInput.trim()} loading={actionLoading}>
                  <Plus size={11} />
                </Button>
              </div>
            </div>

            {/* Follow-up bilgisi */}
            {selected.nextFollowUpAt && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5">
                <CalendarClock size={14} className="text-amber-400" />
                <p className="text-xs text-amber-300">
                  Takip: <span className="font-600">{formatDate(selected.nextFollowUpAt)}</span>
                </p>
              </div>
            )}

            {/* Durum değiştirme */}
            <div>
              <p className="text-[10px] font-700 uppercase tracking-wider text-[#8A9BC4] mb-2">Durum Değiştir</p>
              <div className="flex flex-wrap gap-1.5">
                {(['CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'APPOINTMENT_SCHEDULED', 'CONVERTED'] as LeadStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(selected, s)}
                    disabled={selected.status === s || actionLoading}
                    className={`rounded-lg px-2.5 py-1 text-xs font-600 transition-all disabled:opacity-40 ${
                      selected.status === s
                        ? 'bg-[#EE7436] text-white'
                        : 'bg-white/8 text-[#B8C6E0] hover:bg-white/15'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Aksiyonlar */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => { setSelected(null); setAssignModal(selected); }}>
                <UserPlus size={12} /> Agent Ata
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { setSelected(null); setFollowUpModal(selected); }}>
                <CalendarClock size={12} /> Takip Planla
              </Button>
              {selected.assignedAgentId && (
                <Button variant="secondary" size="sm" onClick={() => { setSelected(null); setTransferModal(selected); }}>
                  <ArrowRightLeft size={12} /> Transfer
                </Button>
              )}
              {selected.status !== 'CONVERTED' && (
                <Button variant="primary" size="sm" onClick={() => { setSelected(null); setConvertModal(selected); }}>
                  <UserCheck size={12} /> Hastaya Dönüştür
                </Button>
              )}
              <Button variant="danger" size="sm" onClick={() => { setSelected(null); setLostModal(selected); }} className="col-span-2">
                Kayıp İşaretle
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Agent atama modal */}
      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title="Agent Ata" width="max-w-sm">
        {assignModal && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[#8A9BC4]">
              <span className="font-600 text-[#F0F4FF]">{assignModal.firstName}</span> için agent seç:
            </p>
            {agents.length === 0
              ? <p className="text-sm text-amber-400">Şu an müsait agent yok.</p>
              : agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => handleAssign(agent.id)}
                  disabled={actionLoading}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EE7436]/15 text-xs font-700 text-[#EE7436]">
                    {(agent.firstName[0] ?? '').toUpperCase()}{(agent.lastName?.[0] ?? '').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-600 text-[#F0F4FF]">{agent.firstName} {agent.lastName ?? ''}</p>
                    <p className="text-xs text-[#8A9BC4]">{agent.department ?? agent.jobTitle ?? 'Agent'}</p>
                  </div>
                  <span className="ml-auto text-[10px] text-emerald-400 font-600">Müsait</span>
                </button>
              ))
            }
          </div>
        )}
      </Modal>

      {/* Kayıp reason modal */}
      <Modal open={!!lostModal} onClose={() => { setLostModal(null); setLostReason(''); }} title="Kayıp Nedeni" width="max-w-sm">
        {lostModal && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[#8A9BC4]">
              <span className="font-600 text-[#F0F4FF]">{lostModal.firstName}</span> neden kaybedildi?
            </p>
            <textarea
              value={lostReason}
              onChange={e => setLostReason(e.target.value)}
              rows={3}
              placeholder="Neden açıklayın..."
              className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-[#F0F4FF] outline-none placeholder:text-[#8A9BC4]/60 focus:border-[#EE7436]/50 resize-none"
            />
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => { setLostModal(null); setLostReason(''); }} className="flex-1">İptal</Button>
              <Button variant="danger" onClick={handleMarkLost} loading={actionLoading} disabled={!lostReason.trim()} className="flex-1">
                Kayıp İşaretle
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Follow-up zamanlama modal */}
      <Modal open={!!followUpModal} onClose={() => { setFollowUpModal(null); setFollowUpDate(''); }} title="Takip Planla" width="max-w-sm">
        {followUpModal && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[#8A9BC4]">
              <span className="font-600 text-[#F0F4FF]">{followUpModal.firstName}</span> için takip tarihi seç:
            </p>
            <input
              type="datetime-local"
              value={followUpDate}
              onChange={e => setFollowUpDate(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-[#F0F4FF] outline-none focus:border-[#EE7436]/50"
            />
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => { setFollowUpModal(null); setFollowUpDate(''); }} className="flex-1">İptal</Button>
              <Button variant="primary" onClick={handleFollowUp} loading={actionLoading} disabled={!followUpDate} className="flex-1">
                <CalendarClock size={13} /> Planla
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Lead dönüşüm modal */}
      <Modal open={!!convertModal} onClose={() => { setConvertModal(null); setConvertPatientId(''); }} title="Hastaya Dönüştür" width="max-w-sm">
        {convertModal && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[#8A9BC4]">
              <span className="font-600 text-[#F0F4FF]">{convertModal.firstName}</span> hastaya dönüştürülecek.
            </p>
            <input
              type="text"
              placeholder="Hasta ID (kayıtlı hasta ise)"
              value={convertPatientId}
              onChange={e => setConvertPatientId(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-[#F0F4FF] outline-none placeholder:text-[#8A9BC4]/60 focus:border-[#EE7436]/50"
            />
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => { setConvertModal(null); setConvertPatientId(''); }} className="flex-1">İptal</Button>
              <Button variant="primary" onClick={handleConvert} loading={actionLoading} disabled={!convertPatientId.trim()} className="flex-1">
                <UserCheck size={13} /> Dönüştür
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Lead transfer modal */}
      <Modal open={!!transferModal} onClose={() => setTransferModal(null)} title="Lead Transfer" width="max-w-sm">
        {transferModal && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[#8A9BC4]">
              <span className="font-600 text-[#F0F4FF]">{transferModal.firstName}</span> başka bir agent'a transfer et:
            </p>
            {transferModal.assignedAgentName && (
              <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                <span className="text-xs text-[#8A9BC4]">Mevcut:</span>
                <span className="text-xs font-600 text-[#F0F4FF]">{transferModal.assignedAgentName}</span>
              </div>
            )}
            {agents.length === 0
              ? <p className="text-sm text-amber-400">Şu an müsait agent yok.</p>
              : agents.filter(a => a.id !== transferModal.assignedAgentId).map(agent => (
                <button
                  key={agent.id}
                  onClick={() => handleTransfer(agent.id)}
                  disabled={actionLoading}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EE7436]/15 text-xs font-700 text-[#EE7436]">
                    {(agent.firstName[0] ?? '').toUpperCase()}{(agent.lastName?.[0] ?? '').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-600 text-[#F0F4FF]">{agent.firstName} {agent.lastName ?? ''}</p>
                    <p className="text-xs text-[#8A9BC4]">{agent.department ?? agent.jobTitle ?? 'Agent'}</p>
                  </div>
                  <span className="ml-auto text-[10px] text-emerald-400 font-600">Müsait</span>
                </button>
              ))
            }
          </div>
        )}
      </Modal>
    </div>
  );
}
