// src/App.tsx

import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';

// Компоненты и страницы
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ChartsPage from './pages/ChartsPage';
import DataCleanerPage from './pages/DataCleanerPage';
import ChatPage from './pages/ChatPage';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';
import ConnectionsPage from './pages/ConnectionsPage';
import ReportPage from './pages/ReportPage'
import EmailVerificationPage from './pages/EmailVerificationPage'
import RequestPasswordResetPage from './pages/RequestPasswordResetPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import LandingPage from './pages/LandingPage'

function App() {
  return (
    <AppProvider>
      <Routes>
        <Route index element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route path="/main" element={<DataCleanerPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="charts" element={<ChartsPage />} />
            <Route path="/connections" element={<ConnectionsPage />} />
            <Route path="/reports/:reportId" element={<ReportPage />} />
            <Route path="/subscribe" element={<SubscriptionPage />} />
          </Route>
        </Route>

      </Routes>
    </AppProvider>
  );
}

export default App;