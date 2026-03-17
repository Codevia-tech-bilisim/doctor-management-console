// src/routes/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

import Login            from '@/pages/auth/Login';
import PanelLayout      from '@/components/layout/PanelLayout';

// Admin pages
import AdminDashboard   from '@/pages/admin/dashboard/AdminDashboard';
import AdminDoctors     from '@/pages/admin/doctors/AdminDoctors';
import AdminAppointments from '@/pages/admin/appointments/AdminAppointments';
import AdminLeads       from '@/pages/admin/leads/AdminLeads';
import AdminPatients    from '@/pages/admin/patients/AdminPatients';

// Doctor pages
import DoctorDashboard  from '@/pages/doctor/dashboard/DoctorDashboard';
import DoctorSlots      from '@/pages/doctor/slots/DoctorSlots';
import DoctorAppointments from '@/pages/doctor/appointments/DoctorAppointments';
import DoctorProfile    from '@/pages/doctor/profile/DoctorProfile';

// ─── Role Guard ──────────────────────────────────────────────────────────────
function RoleGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (!allowedRoles.includes(user!.role)) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  // Login
  { path: '/auth/login', element: <Login /> },

  // Panel layout — Admin
  {
    path: '/admin',
    element: (
      <RoleGuard allowedRoles={['ADMIN']}>
        <PanelLayout role="ADMIN" />
      </RoleGuard>
    ),
    children: [
      { index: true,              element: <AdminDashboard /> },
      { path: 'doctors',          element: <AdminDoctors /> },
      { path: 'appointments',     element: <AdminAppointments /> },
      { path: 'leads',            element: <AdminLeads /> },
      { path: 'patients',         element: <AdminPatients /> },
    ],
  },

  // Panel layout — Doctor
  {
    path: '/doctor',
    element: (
      <RoleGuard allowedRoles={['DOCTOR']}>
        <PanelLayout role="DOCTOR" />
      </RoleGuard>
    ),
    children: [
      { index: true,              element: <DoctorDashboard /> },
      { path: 'slots',            element: <DoctorSlots /> },
      { path: 'appointments',     element: <DoctorAppointments /> },
      { path: 'profile',          element: <DoctorProfile /> },
    ],
  },

  // Root redirect
  { path: '/', element: <Navigate to="/auth/login" replace /> },
  { path: '*', element: <Navigate to="/auth/login" replace /> },
]);
