import { Navigate, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import type { ReactNode } from 'react'
import { useApp } from './store/appStore'
import { useCurrentUser, useIsMaster, useIsPhysiotherapist, useCanAny } from './store/selectors'
import type { Capability } from './data/types'
import { PatientLayout } from './layouts/PatientLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { PhysiotherapistLayout } from './layouts/PhysiotherapistLayout'
import { Toaster } from './components/Toast'
import { ConfirmHost } from './components/Confirm'

// shared
import { Splash } from './screens/shared/Splash'
import { Welcome } from './screens/shared/Welcome'
import { Login } from './screens/shared/Login'
import { Register } from './screens/shared/Register'
import { Verify } from './screens/shared/Verify'
import { VerifyEmail } from './screens/shared/VerifyEmail'
import { ForgotPassword } from './screens/shared/ForgotPassword'

// patient
import { PatientHome } from './screens/patient/Home'
import { BookAppointment } from './screens/patient/BookAppointment'
import { MyAppointments } from './screens/patient/MyAppointments'
import { AppointmentDetails } from './screens/patient/AppointmentDetails'
import { MyPackages } from './screens/patient/MyPackages'
import { PackageDetails } from './screens/patient/PackageDetails'
import { Family } from './screens/patient/Family'
import { Friends } from './screens/patient/Friends'
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
import { AdminAuditLog } from './screens/admin/AuditLog'
import { AdminHouseholdReport } from './screens/admin/HouseholdReport'
import { AdminAnnouncements } from './screens/admin/Announcements'
import { AdminReports } from './screens/admin/Reports'
import { AdminSettings } from './screens/admin/Settings'

// physiotherapist
import { PhysioMySchedule } from './screens/physio/MySchedule'
import { APP_VERSION } from './version'

function RequireRole({ role, children }: { role: 'patient' | 'admin'; children: ReactNode }) {
  const user = useCurrentUser()
  if (!user) return <Navigate to="/welcome" replace />
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/patient/home'} replace />
  return <>{children}</>
}

/** Master-Admin-only routes (sub-admin management & audit log). */
function RequireMaster({ children }: { children: ReactNode }) {
  const isMaster = useIsMaster()
  if (!isMaster) return <Navigate to="/admin/dashboard" replace />
  return <>{children}</>
}

/** Routes gated by sub-admin capability (master always allowed). */
function RequireCap({ caps, children }: { caps: Capability[]; children: ReactNode }) {
  const allowed = useCanAny(caps)
  if (!allowed) return <Navigate to="/admin/dashboard" replace />
  return <>{children}</>
}

/** Physiotherapist-only routes. */
function RequirePhysio({ children }: { children: ReactNode }) {
  const user = useCurrentUser()
  const isPhysio = useIsPhysiotherapist()
  if (!user) return <Navigate to="/welcome" replace />
  if (!isPhysio) return <Navigate to="/patient/home" replace />
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
      <Route path="/verify-email/:email" element={<VerifyEmail />} />
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
        <Route path="friends" element={<Friends />} />
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
        <Route path="manual-booking" element={<RequireCap caps={['appointmentManagement']}><ManualBooking /></RequireCap>} />
        <Route path="announcements" element={<RequireCap caps={['manageAnnouncements']}><AdminAnnouncements /></RequireCap>} />
        <Route path="reports" element={<RequireCap caps={['reportsServices', 'reportsProducts']}><AdminReports /></RequireCap>} />
        <Route path="household" element={<RequireCap caps={['managePatients']}><AdminHouseholdReport /></RequireCap>} />
        <Route path="patients" element={<RequireCap caps={['managePatients']}><AdminPatients /></RequireCap>} />
        <Route path="patient/:id" element={<RequireCap caps={['managePatients']}><AdminPatientProfile /></RequireCap>} />
        <Route path="packages" element={<RequireCap caps={['managePatients']}><AdminPackages /></RequireCap>} />
        <Route path="products" element={<RequireCap caps={['manageProducts']}><AdminProducts /></RequireCap>} />
        <Route path="follow-ups" element={<RequireCap caps={['manageFollowUp']}><AdminFollowUps /></RequireCap>} />
        <Route path="clinic-settings" element={<RequireCap caps={['manageClinics']}><ClinicSettings /></RequireCap>} />
        <Route path="services" element={<RequireCap caps={['manageServices']}><AdminServiceTypes /></RequireCap>} />
        <Route path="therapists" element={<RequireCap caps={['manageTherapists']}><AdminTherapists /></RequireCap>} />
        <Route path="cancellation-reasons" element={<RequireCap caps={['manageCancellationReasons']}><AdminCancellationReasons /></RequireCap>} />
        <Route path="sub-admins" element={<RequireMaster><AdminSubAdmins /></RequireMaster>} />
        <Route path="audit" element={<RequireMaster><AdminAuditLog /></RequireMaster>} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Physiotherapist */}
      <Route
        path="/physio"
        element={
          <RequirePhysio>
            <PhysiotherapistLayout />
          </RequirePhysio>
        }
      >
        <Route index element={<Navigate to="schedule" replace />} />
        <Route path="schedule" element={<PhysioMySchedule />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
      <ConfirmHost />
      <div className="pointer-events-none fixed right-1 top-1 z-[9999] select-none rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
        {APP_VERSION}
      </div>
    </MotionConfig>
  )
}
