import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from './components/ui/sonner';
import { store } from './auth/store';
import { SessionRestorer } from './auth/SessionRestorer';
import { Sidebar } from './pages/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { LandingPage } from './pages/LandingPage';
import { OnboardingWizard } from './pages/OnboardingWizard';
import { DashboardPage } from './pages/DashboardPage';
import { ChatbotPage } from './pages/ChatbotPage';
import { CalendarPage } from './pages/CalendarPage';
import { PhotoStoragePage } from './pages/PhotoStoragePage';
import { SettingsPage } from './pages/SettingsPage';
import { useAuth } from './auth/hooks/useAuth';

function AppContent() {
  const { isAuthenticated, needsOnboarding, hasCompletedOnboarding } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/onboarding" element={<OnboardingWizard />} />

        {/* Protected routes */}
        <Route
          path="/app/*"
          element={
            isAuthenticated ? (
              needsOnboarding && !hasCompletedOnboarding ? (
                <OnboardingWizard />
              ) : (
                <Sidebar>
                  <Routes>
                    <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/chat" element={<ChatbotPage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/photo-storage" element={<PhotoStoragePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </Sidebar>
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Default redirect */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/app/dashboard" : "/"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      {/* SessionRestorer runs once on mount: if tokens exist in localStorage
          but Redux user is null (page refresh), it re-hydrates profile +
          businesses before rendering any child routes. */}
      <SessionRestorer>
        <AppContent />
      </SessionRestorer>
      <Toaster />
    </Provider>
  );
}
