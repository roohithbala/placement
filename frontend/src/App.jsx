import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import ProfileSetupPage from './pages/ProfileSetupPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import EditProfilePage from './pages/EditProfilePage.jsx'
import ShareExperienceLanding from './pages/ShareExperienceLanding.jsx'
import ExperienceMetadataForm from './pages/ExperienceMetadataForm.jsx'
import ExperienceRoundsForm from './pages/ExperienceRoundsForm.jsx'
import ExperienceMaterialsForm from './pages/ExperienceMaterialsForm.jsx'
import MentorshipPage from './pages/MentorshipPage.jsx'
import MessagesPage from './pages/MessagesPage.jsx'
import MeetingsPage from './pages/MeetingsPage.jsx'
import QuestionsPage from './pages/QuestionsPage.jsx'
import VideoMeetingPage from './pages/VideoMeetingPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import UnderDevelopmentPage from './pages/UnderDevelopmentPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import './App.css'
import About from './pages/About.jsx'
import OpportunitiesPage from './pages/OpportunitiesPage.jsx'
import ExperiencesPage from './pages/ExperiencesPage.jsx'
import ExperienceDetailPage from './pages/ExperienceDetailPage.jsx'
import SubmitOpportunityPage from './pages/SubmitOpportunityPage.jsx'
import ContactPage from './pages/ContactPage.jsx'
import { Contact } from 'lucide-react'
import ScrollToTop from './components/ScrollToTop.jsx'

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/profile-setup"
          element={<ProtectedRoute><ProfileSetupPage /></ProtectedRoute>}
        />
        <Route
          path="/home"
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
        />
        <Route
          path="/about"
          element={<ProtectedRoute><About /></ProtectedRoute>}
        />
        <Route
          path="/profile"
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />
        <Route
          path="/profile/:id"
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />
        <Route
          path="/edit-profile"
          element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>}
        />
        <Route
          path="/my-experiences"
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />
        <Route
          path="/share-experience"
          element={<ProtectedRoute><ShareExperienceLanding /></ProtectedRoute>}
        />
        <Route
          path="/share-experience/metadata"
          element={<ProtectedRoute><ExperienceMetadataForm /></ProtectedRoute>}
        />
        <Route
          path="/share-experience/rounds"
          element={<ProtectedRoute><ExperienceRoundsForm /></ProtectedRoute>}
        />
        <Route
          path="/share-experience/materials"
          element={<ProtectedRoute><ExperienceMaterialsForm /></ProtectedRoute>}
        />
        <Route
          path="/mentorship"
          element={<ProtectedRoute><MentorshipPage /></ProtectedRoute>}
        />
        <Route
          path="/messages"
          element={<ProtectedRoute><MessagesPage /></ProtectedRoute>}
        />
        <Route
          path="/meetings"
          element={<ProtectedRoute><MeetingsPage /></ProtectedRoute>}
        />
        <Route
          path="/questions"
          element={<ProtectedRoute><QuestionsPage /></ProtectedRoute>}
        />
        <Route
          path="/meeting/:meetingId"
          element={<ProtectedRoute><VideoMeetingPage /></ProtectedRoute>}
        />
        <Route
          path="/opportunities"
          element={<ProtectedRoute><OpportunitiesPage /></ProtectedRoute>}
        />
        <Route
          path="/opportunities/submit"
          element={<ProtectedRoute><SubmitOpportunityPage /></ProtectedRoute>}
        />

        <Route
          path="/admin"
          element={<AdminRoute><AdminDashboardPage /></AdminRoute>}
        />
        <Route
          path="/experiences"
          element={<ProtectedRoute><ExperiencesPage /></ProtectedRoute>}
        />
        <Route
          path="/experiences/:id"
          element={<ProtectedRoute><ExperienceDetailPage /></ProtectedRoute>}
        />

        {/* Under Development Routes */}

        <Route path="/analytics" element={<ProtectedRoute><UnderDevelopmentPage /></ProtectedRoute>} />

        <Route path="/contact" element={<ProtectedRoute><ContactPage /></ProtectedRoute>} />

        <Route path="/" element={
          localStorage.getItem('userRole') === 'admin'
            ? <Navigate to="/admin" replace />
            : <Navigate to="/home" replace />
        } />
      </Routes>
    </Router>
  )
}

export default App
