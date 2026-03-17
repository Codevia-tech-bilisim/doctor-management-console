// src/api/endpoints/admin.ts
import { api } from '../client';
import type { ApiResponse, Admin, Lead, LeadStatus, LeadPriority, Page, Patient } from '../types';

// ─── Admin profili ────────────────────────────────────────────────────────────
export const getMyAdminProfile = () =>
  api.get<ApiResponse<Admin>>('/api/admin/me');

export const setAvailability = (available: boolean) =>
  api.patch<ApiResponse<Admin>>(`/api/admin/me/availability?available=${available}`);

export const getAvailableAgents = () =>
  api.get<ApiResponse<Admin[]>>('/api/admin/agents/available');

// ─── Kullanıcı yönetimi ───────────────────────────────────────────────────────
export const getAllPatients = (page = 0, size = 20) =>
  api.get<ApiResponse<Page<Patient>>>(`/api/patients?page=${page}&size=${size}`);

export const getPatientById = (id: string) =>
  api.get<ApiResponse<Patient>>(`/api/patients/${id}`);

// ─── Lead yönetimi ────────────────────────────────────────────────────────────
export const getAllLeads = (page = 0, size = 20) =>
  api.get<ApiResponse<Page<Lead>>>(`/api/v1/leads?page=${page}&size=${size}`);

export const getMyLeads = (page = 0) =>
  api.get<ApiResponse<Page<Lead>>>(`/api/v1/leads/my?page=${page}`);

export const getUnassignedLeads = () =>
  api.get<ApiResponse<Lead[]>>('/api/v1/leads/unassigned');

export const getLeadsByStatus = (status: LeadStatus, page = 0) =>
  api.get<ApiResponse<Page<Lead>>>(`/api/v1/leads/status/${status}?page=${page}`);

export const getLeadById = (id: string) =>
  api.get<ApiResponse<Lead>>(`/api/v1/leads/${id}`);

export const searchLeads = (keyword: string, page = 0) =>
  api.get<ApiResponse<Page<Lead>>>(`/api/v1/leads/search?keyword=${encodeURIComponent(keyword)}&page=${page}`);

export const changeLeadStatus = (id: string, status: LeadStatus, reason?: string) =>
  api.patch<ApiResponse<Lead>>(
    `/api/v1/leads/${id}/status?status=${status}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`,
  );

export const assignLead = (id: string, agentId: string) =>
  api.patch<ApiResponse<Lead>>(`/api/v1/leads/${id}/assign?agentId=${agentId}`);

export const autoAssignLead = (id: string) =>
  api.patch<ApiResponse<Lead>>(`/api/v1/leads/${id}/auto-assign`);

export const transferLead = (id: string, newAgentId: string) =>
  api.patch<ApiResponse<Lead>>(`/api/v1/leads/${id}/transfer?newAgentId=${newAgentId}`);

export const convertLead = (id: string, patientId: string, conversionValue?: number) =>
  api.patch<ApiResponse<Lead>>(
    `/api/v1/leads/${id}/convert?patientId=${patientId}${conversionValue ? `&conversionValue=${conversionValue}` : ''}`,
  );

export const markLeadLost = (id: string, reason: string) =>
  api.patch<ApiResponse<Lead>>(`/api/v1/leads/${id}/lost?reason=${encodeURIComponent(reason)}`);

export const scheduleFollowUp = (id: string, followUpAt: string) =>
  api.patch<ApiResponse<Lead>>(`/api/v1/leads/${id}/follow-up?followUpAt=${encodeURIComponent(followUpAt)}`);

export const addTag = (id: string, tag: string) =>
  api.patch<ApiResponse<Lead>>(`/api/v1/leads/${id}/tags/add?tag=${encodeURIComponent(tag)}`);

export const getLeadStatistics = () =>
  api.get<ApiResponse<Record<string, number>>>('/api/v1/leads/statistics');

export const getNeedingFollowUp = () =>
  api.get<ApiResponse<Lead[]>>('/api/v1/leads/needs-follow-up');
