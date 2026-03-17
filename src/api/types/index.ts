// src/api/types/index.ts

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: { code: string; message: string };
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'DOCTOR' | 'PATIENT';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  role: UserRole;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  requiresAction?: boolean;
  message?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// ─── Doctor ───────────────────────────────────────────────────────────────────
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialty: string;
  subSpecialties?: string[];
  biography?: string;
  yearsOfExperience?: number;
  currentHospital?: string;
  currentClinic?: string;
  verificationStatus: VerificationStatus;
  isAcceptingNewPatients: boolean;
  consultationFee?: number;
  consultationDurationMinutes?: number;
  rating?: number;
  totalRatings?: number;
  workingDays?: string[];
  workingHoursStart?: string;
  workingHoursEnd?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ─── TimeSlot ────────────────────────────────────────────────────────────────
export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'EXPIRED';

export interface TimeSlot {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: SlotStatus;
  appointmentId?: string;
  blockReason?: string;
  blockedBy?: string;
}

// ─── Appointment ─────────────────────────────────────────────────────────────
export type AppointmentStatus =
  | 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS'
  | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED';

export type ConsultationType = 'IN_PERSON' | 'VIDEO_CALL' | 'PHONE_CALL' | 'FOLLOW_UP';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIAL_REFUND';

export interface MeetingInfo {
  meetingId: string;
  meetingUrl?: string;
  joinUrl?: string;
  meetingPassword?: string;
  password?: string;
  startUrl?: string;
  provider?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: AppointmentStatus;
  consultationType: ConsultationType;
  chiefComplaint?: string;
  doctorNotes?: string;
  patientNotes?: string;
  prescriptionId?: string;
  treatmentTypeId?: string;
  consultationFee?: number;
  currency?: string;
  paymentStatus: PaymentStatus;
  meetingInfo?: MeetingInfo;
  confirmedAt?: string;
  confirmedBy?: string;
  consultationStartedAt?: string;
  consultationEndedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  statusChangedAt: string;
  createdAt: string;
}

// ─── Patient ──────────────────────────────────────────────────────────────────
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  maskedTcKimlikNo?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  province?: string;
  district?: string;
  bloodType?: string;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  status: string;
  emailVerified: boolean;
  lastLoginDate?: string;
  createdAt?: string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export type AdminLevel = 'STANDARD' | 'SENIOR' | 'MANAGER' | 'SUPER_ADMIN';

export interface Admin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  adminLevel: AdminLevel;
  isAvailable: boolean;
  currentActiveChats?: number;
  spokenLanguages?: string[];
  specializations?: string[];
  canManageUsers: boolean;
  canManageDoctors: boolean;
  canViewReports: boolean;
  status: string;
}

// ─── Lead ─────────────────────────────────────────────────────────────────────
export type LeadStatus =
  | 'NEW' | 'ASSIGNED' | 'CONTACTED' | 'QUALIFIED'
  | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'APPOINTMENT_SCHEDULED'
  | 'CONVERTED' | 'LOST' | 'SPAM';

export type LeadSource =
  | 'WHATSAPP' | 'INSTAGRAM' | 'EMAIL' | 'WEB_FORM'
  | 'PHONE' | 'LIVE_CHAT' | 'REFERRAL' | 'GOOGLE_ADS'
  | 'FACEBOOK_ADS' | 'PARTNER' | 'WALK_IN' | 'OTHER';

export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Lead {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  nationality?: string;
  preferredLanguage?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedAt?: string;
  interestedTreatmentId?: string;
  interestedTreatments?: string[];
  budgetRange?: string;
  preferredDates?: string;
  initialMessage?: string;
  notes?: string;
  tags?: string[];
  nextFollowUpAt?: string;
  convertedPatientId?: string;
  convertedAt?: string;
  lostReason?: string;
  firstResponseAt?: string;
  lastContactAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Zoom ─────────────────────────────────────────────────────────────────────
export interface ZoomMeetingRequest {
  topic: string;
  startTime: string;
  durationMinutes: number;
  agenda?: string;
}

export interface ZoomMeetingResponse {
  meetingId: string;
  topic: string;
  startTime: string;
  durationMinutes: number;
  joinUrl: string;
  startUrl: string;
  password: string;
  status: string;
}
