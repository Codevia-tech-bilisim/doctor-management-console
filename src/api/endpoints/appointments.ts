// src/api/endpoints/appointments.ts
import { api } from '../client';
import type { ApiResponse, Appointment, Page, ZoomMeetingRequest, ZoomMeetingResponse } from '../types';

// ─── CRUD ────────────────────────────────────────────────────────────────────
export const getAppointmentById = (id: string) =>
  api.get<ApiResponse<Appointment>>(`/api/v1/appointments/${id}`);

export const getAppointmentsByDoctor = (doctorId: string, page = 0, size = 20, date?: string) =>
  api.get<ApiResponse<Page<Appointment>>>(
    `/api/v1/appointments/doctor/${doctorId}?page=${page}&size=${size}${date ? `&date=${date}` : ''}`
  );

export const getTodayAppointments = (doctorId: string) =>
  api.get<ApiResponse<Appointment[]>>(`/api/v1/appointments/doctor/${doctorId}/today`);

export const getAppointmentsByPatient = (patientId: string, page = 0) =>
  api.get<ApiResponse<Page<Appointment>>>(`/api/v1/appointments/patient/${patientId}?page=${page}`);

// Admin: tüm randevular — gerçek endpoint /admin/all
export const getAllAppointments = (page = 0, size = 20, status?: string) =>
  api.get<ApiResponse<Page<Appointment>>>(
    `/api/v1/appointments/admin/all?page=${page}&size=${size}${status ? `&status=${status}` : ''}`
  );

// ─── Status lifecycle ─────────────────────────────────────────────────────────
// PENDING → CONFIRMED
export const confirmAppointment = (id: string, confirmedBy: string) =>
  api.patch<ApiResponse<Appointment>>(`/api/v1/appointments/${id}/confirm?confirmedBy=${confirmedBy}`);

// CONFIRMED → CHECKED_IN
export const checkInAppointment = (id: string) =>
  api.patch<ApiResponse<Appointment>>(`/api/v1/appointments/${id}/check-in`);

// CONFIRMED/CHECKED_IN → IN_PROGRESS
export const startConsultation = (id: string, doctorId: string) =>
  api.patch<ApiResponse<Appointment>>(`/api/v1/appointments/${id}/start?doctorId=${doctorId}`);

// IN_PROGRESS → COMPLETED (notes + prescriptionId opsiyonel)
export const completeAppointment = (id: string, doctorId: string, notes?: string, prescriptionId?: string) => {
  const params = new URLSearchParams({ doctorId });
  if (notes)          params.append('notes', notes);
  if (prescriptionId) params.append('prescriptionId', prescriptionId);
  return api.patch<ApiResponse<Appointment>>(`/api/v1/appointments/${id}/complete?${params}`);
};

// → CANCELLED
export const cancelAppointment = (id: string, cancelledBy: string, reason?: string) =>
  api.patch<ApiResponse<Appointment>>(
    `/api/v1/appointments/${id}/cancel?cancelledBy=${cancelledBy}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`
  );

// → NO_SHOW
export const markNoShow = (id: string) =>
  api.patch<ApiResponse<Appointment>>(`/api/v1/appointments/${id}/no-show`);

// ─── Video (Zoom) ─────────────────────────────────────────────────────────────
export const getMeetingLink = (id: string) =>
  api.get<ApiResponse<{ joinUrl: string; startUrl?: string; meetingId: string }>>(
    `/api/v1/appointments/${id}/meeting-link`
  );

export const cancelVideoAppointment = (id: string, cancelledBy: string, reason?: string) =>
  api.patch<ApiResponse<Appointment>>(
    `/api/v1/appointments/${id}/cancel-video?cancelledBy=${cancelledBy}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`
  );

// ─── Zoom doğrudan ────────────────────────────────────────────────────────────
export const createZoomMeeting = (req: ZoomMeetingRequest) =>
  api.post<ApiResponse<ZoomMeetingResponse>>('/api/zoom/meetings', req);

export const getZoomMeeting = (meetingId: string) =>
  api.get<ApiResponse<ZoomMeetingResponse>>(`/api/zoom/meetings/${meetingId}`);

export const deleteZoomMeeting = (meetingId: string) =>
  api.delete<ApiResponse<void>>(`/api/zoom/meetings/${meetingId}`);
