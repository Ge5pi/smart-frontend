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

function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<DataCleanerPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="charts" element={<ChartsPage />} />
            <Route path="/connections" element={<ConnectionsPage />} />
            <Route path="/reports/:reportId/:taskId" element={<ReportPage />} />
          </Route>
        </Route>

      </Routes>
    </AppProvider>
  );
}

export default App;