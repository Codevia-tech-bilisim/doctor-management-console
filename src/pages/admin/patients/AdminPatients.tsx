// src/pages/admin/patients/AdminPatients.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Card, Badge, PageLoader, Empty, Table, Th, Td, Button } from '@/components/ui';
import { Users, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllPatients } from '@/api/endpoints/admin';
import type { Patient } from '@/api/types';
import { formatDate, initials } from '@/lib/utils';

const PAGE_SIZE = 15;

export default function AdminPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(0);
  const [loading,  setLoading]  = useState(true);

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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-800 text-[#F0F4FF]">Hasta Listesi</h1>
          <p className="text-sm text-[#8A9BC4] mt-0.5">Toplam {total} hasta</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => load(0)} loading={loading}>
          <RefreshCw size={13} /> Yenile
        </Button>
      </div>

      <Card padding={false}>
        {loading ? <PageLoader /> : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Hasta</Th>
                  <Th>TC (Maskeli)</Th>
                  <Th>Doğum Tarihi</Th>
                  <Th>Kan Grubu</Th>
                  <Th>Email Doğrulama</Th>
                  <Th>Durum</Th>
                  <Th>Kayıt</Th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0
                  ? <tr><td colSpan={7}><Empty icon={Users} message="Hasta bulunamadı" /></td></tr>
                  : patients.map(p => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
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
                      <Td className="font-mono text-xs text-[#8A9BC4]">{p.maskedTcKimlikNo ?? '—'}</Td>
                      <Td className="text-[#8A9BC4] text-xs">{p.birthDate ? formatDate(p.birthDate) : '—'}</Td>
                      <Td>
                        {p.bloodType
                          ? <Badge variant="info">{p.bloodType}</Badge>
                          : <span className="text-[#8A9BC4]">—</span>}
                      </Td>
                      <Td>
                        <Badge variant={p.emailVerified ? 'success' : 'warn'}>
                          {p.emailVerified ? 'Doğrulandı' : 'Bekliyor'}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge variant={p.status === 'ACTIVE' ? 'success' : 'muted'}>{p.status}</Badge>
                      </Td>
                      <Td className="text-[#8A9BC4] text-xs">—</Td>
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
    </div>
  );
}
