import { lazy, Suspense } from 'react';
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
import { useAuth } from './auth/hooks/useAuth';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ChatbotPage = lazy(() => import('./pages/ChatbotPage').then(m => ({ default: m.ChatbotPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const PhotoStoragePage = lazy(() => import('./pages/PhotoStoragePage').then(m => ({ default: m.PhotoStoragePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

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
                  <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" /></div>}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/chat" element={<ChatbotPage />} />
                      <Route path="/calendar" element={<CalendarPage />} />
                      <Route path="/photo-storage" element={<PhotoStoragePage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Routes>
                  </Suspense>
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
