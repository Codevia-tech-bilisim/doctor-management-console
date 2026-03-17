// src/api/endpoints/doctors.ts
import { api } from '../client';
import type { ApiResponse, Doctor, Page, TimeSlot, VerificationStatus } from '../types';

// ─── Admin: Doktor listesi ───────────────────────────────────────────────────
export const getAllDoctors = (page = 0, size = 20) =>
  api.get<ApiResponse<Page<Doctor>>>(`/api/doctors?page=${page}&size=${size}`);

export const searchDoctors = (term: string, page = 0) =>
  api.get<ApiResponse<Page<Doctor>>>(`/api/doctors/search?searchTerm=${encodeURIComponent(term)}&page=${page}`);

export const getDoctorById = (id: string) =>
  api.get<ApiResponse<Doctor>>(`/api/doctors/${id}`);

// ─── Admin: Doktor onay / red ────────────────────────────────────────────────
export const updateVerificationStatus = (id: string, status: VerificationStatus) =>
  api.patch<ApiResponse<Doctor>>(`/api/doctors/${id}/verification?status=${status}`);

export const deleteDoctor = (id: string) =>
  api.delete<ApiResponse<void>>(`/api/doctors/${id}`);

// ─── Admin: İstatistikler ────────────────────────────────────────────────────
export const getVerifiedDoctorsCount = () =>
  api.get<ApiResponse<number>>('/api/doctors/statistics/count-verified');

export const getDoctorsCountBySpecialty = (specialty: string) =>
  api.get<ApiResponse<number>>(`/api/doctors/statistics/count-by-specialty?specialty=${encodeURIComponent(specialty)}`);

// ─── Doctor: Kendi profili ───────────────────────────────────────────────────
export const getMyProfile = () =>
  api.get<ApiResponse<Doctor>>('/api/doctors/me');

export const updateMyProfile = (biography?: string, curriculum?: string) =>
  api.patch<ApiResponse<Doctor>>(
    `/api/doctors/me/profile?${biography ? `biography=${encodeURIComponent(biography)}` : ''}${curriculum ? `&curriculum=${encodeURIComponent(curriculum)}` : ''}`,
  );

export const updateWorkingHours = (
  workingDays: string[],
  startTime: string,
  endTime: string,
) =>
  api.patch<ApiResponse<Doctor>>(
    `/api/doctors/me/working-hours?workingDays=${workingDays.join(',')}&startTime=${startTime}&endTime=${endTime}`,
  );

export const updateConsultationInfo = (fee: number, duration: number) =>
  api.patch<ApiResponse<Doctor>>(`/api/doctors/me/consultation?fee=${fee}&duration=${duration}`);

// ─── TimeSlots ───────────────────────────────────────────────────────────────
export const getAvailableSlots = (doctorId: string, date: string) =>
  api.get<ApiResponse<TimeSlot[]>>(`/api/v1/slots/available?doctorId=${doctorId}&date=${date}`);

export const getSlotsInRange = (doctorId: string, startDate: string, endDate: string) =>
  api.get<ApiResponse<TimeSlot[]>>(
    `/api/v1/slots/doctor/${doctorId}?startDate=${startDate}&endDate=${endDate}`,
  );

export const generateDailySlots = (doctorId: string, date: string, durationMinutes = 30) =>
  api.post<ApiResponse<TimeSlot[]>>(
    `/api/v1/slots/generate?doctorId=${doctorId}&date=${date}&durationMinutes=${durationMinutes}`,
    {},
  );

export const generateWeeklySlots = (doctorId: string, startDate: string, durationMinutes = 30) =>
  api.post<ApiResponse<TimeSlot[]>>(
    `/api/v1/slots/generate/week?doctorId=${doctorId}&startDate=${startDate}&durationMinutes=${durationMinutes}`,
    {},
  );

export const blockSlot = (id: string, reason: string, blockedBy: string) =>
  api.patch<ApiResponse<TimeSlot>>(`/api/v1/slots/${id}/block?reason=${encodeURIComponent(reason)}&blockedBy=${blockedBy}`);

export const unblockSlot = (id: string) =>
  api.patch<ApiResponse<TimeSlot>>(`/api/v1/slots/${id}/unblock`);

export const deleteSlot = (id: string, deletedBy: string) =>
  api.delete<ApiResponse<void>>(`/api/v1/slots/${id}?deletedBy=${deletedBy}`);

export const countAvailableSlots = (doctorId: string, date: string) =>
  api.get<ApiResponse<number>>(`/api/v1/slots/count-available?doctorId=${doctorId}&date=${date}`);

// Randevu kabul durumu toggle — updateConsultationInfo üzerinden fee/duration ile birlikte
// Backend'de ayrı endpoint yok, profile update ile yapılıyor
export const toggleAcceptingPatients = (accepting: boolean, fee: number, duration: number) =>
  api.patch<ApiResponse<Doctor>>(`/api/doctors/me/consultation?fee=${fee}&duration=${duration}&accepting=${accepting}`);

// Sadece accepting durumunu güncelle (consultation endpoint)
export const setAcceptingPatients = (accepting: boolean) =>
  api.patch<ApiResponse<Doctor>>(`/api/doctors/me/profile?isAcceptingNewPatients=${accepting}`);
