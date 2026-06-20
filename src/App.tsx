import { Navigate, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import type { ReactNode } from 'react'
import { useApp } from './store/appStore'
import { useCurrentUser, useIsMaster } from './store/selectors'
import { PatientLayout } from './layouts/PatientLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { Toaster } from './components/Toast'
import { ConfirmHost } from './components/Confirm'

// shared
import { Splash } from './screens/shared/Splash'
import { Welcome } from './screens/shared/Welcome'
import { Login } from './screens/shared/Login'
import { Register } from './screens/shared/Register'
import { Verify } from './screens/shared/Verify'
import { ForgotPassword } from './screens/shared/ForgotPassword'

// patient
import { PatientHome } from './screens/patient/Home'
import { BookAppointment } from './screens/patient/BookAppointment'
import { MyAppointments } from './screens/patient/MyAppointments'
import { AppointmentDetails } from './screens/patient/AppointmentDetails'
import { MyPackages } from './screens/patient/MyPackages'
import { PackageDetails } from './screens/patient/PackageDetails'
import { Family } from './screens/patient/Family'
import { Clinics } from './screens/patient/Clinics'
import { PatientAnnouncements } from './screens/patient/Announcements'
import { Profile } from './screens/patient/Profile'

// admin
import { AdminDashboard } from './screens/admin/Dashboard'
import { AdminCalendar } from './screens/admin/Calendar'
import { AdminAppointments } from './screens/admin/Appointments'
import { ManualBooking } from './screens/admin/ManualBooking'
import { AdminPatients } from './screens/admin/Patients'
import { AdminPatientProfile } from './screens/admin/PatientProfile'
import { AdminPackages } from './screens/admin/Packages'
import { AdminProducts } from './screens/admin/Products'
import { AdminFollowUps } from './screens/admin/FollowUps'
import { ClinicSettings } from './screens/admin/ClinicSettings'
import { AdminServiceTypes } from './screens/admin/ServiceTypes'
import { AdminTherapists } from './screens/admin/Therapists'
import { AdminCancellationReasons } from './screens/admin/CancellationReasons'
import { AdminSubAdmins } from './screens/admin/SubAdmins'
import { AdminAnnouncements } from './screens/admin/Announcements'
import { AdminReports } from './screens/admin/Reports'
import { AdminSettings } from './screens/admin/Settings'

function RequireRole({ role, children }: { role: 'patient' | 'admin'; children: ReactNode }) {
  const user = useCurrentUser()
  if (!user) return <Navigate to="/welcome" replace />
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/patient/home'} replace />
  return <>{children}</>
}

/** Master-Admin-only routes (core master data & sub-admin management). */
function RequireMaster({ children }: { children: ReactNode }) {
  const isMaster = useIsMaster()
  if (!isMaster) return <Navigate to="/admin/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  const hasSession = useApp((s) => s.currentUserId !== null)

  return (
    <MotionConfig reducedMotion="user">
      <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/welcome" element={hasSession ? <Navigate to="/" replace /> : <Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify/:userId" element={<Verify />} />
      <Route path="/forgot" element={<ForgotPassword />} />

      {/* Patient */}
      <Route
        path="/patient"
        element={
          <RequireRole role="patient">
            <PatientLayout />
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<PatientHome />} />
        <Route path="book" element={<BookAppointment />} />
        <Route path="appointments" element={<MyAppointments />} />
        <Route path="appointment/:id" element={<AppointmentDetails />} />
        <Route path="packages" element={<MyPackages />} />
        <Route path="package/:id" element={<PackageDetails />} />
        <Route path="family" element={<Family />} />
        <Route path="clinics" element={<Clinics />} />
        <Route path="announcements" element={<PatientAnnouncements />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <RequireRole role="admin">
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="calendar" element={<AdminCalendar />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="manual-booking" element={<ManualBooking />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="patients" element={<AdminPatients />} />
        <Route path="patient/:id" element={<AdminPatientProfile />} />
        <Route path="packages" element={<AdminPackages />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="follow-ups" element={<AdminFollowUps />} />
        <Route path="clinic-settings" element={<RequireMaster><ClinicSettings /></RequireMaster>} />
        <Route path="services" element={<RequireMaster><AdminServiceTypes /></RequireMaster>} />
        <Route path="therapists" element={<RequireMaster><AdminTherapists /></RequireMaster>} />
        <Route path="cancellation-reasons" element={<RequireMaster><AdminCancellationReasons /></RequireMaster>} />
        <Route path="sub-admins" element={<RequireMaster><AdminSubAdmins /></RequireMaster>} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
      <ConfirmHost />
    </MotionConfig>
  )
}
