import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Типизация данных ---

// Тип для сохраненного подключения к БД
export interface DatabaseConnection {
  id: number;
  user_id: number;
  connection_string: string;
  db_type: string;
  alias: string;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  messages_used: number;
  reports_used: number;
}


// Упрощенная структура результатов для отчета
interface DatabaseAnalysisResults {
  insights: Record<string, string>;
  correlations: Record<string, Record<string, Record<string, number | null>>>;
}

// Тип для ошибки в результатах отчета
interface ErrorResults {
  error: string;
  details?: string;
}

export interface EnhancedReport {
  id: number;
  status: string;
  created_at: string;
  results: DatabaseAnalysisResults | ErrorResults | null;
}

export interface Report {
  id: number;
  user_id: number;
  status: string;
  created_at: string;
  results: DatabaseAnalysisResults | ErrorResults | null;
  // Добавляем поля для связи с подключением
  connection_alias?: string;
  connection_id?: number;
}


export const getConnections = () => {
  return api.get<DatabaseConnection[]>('/analytics/database/connections');
};

/** Получение данных отчета по ID */
export const getReport = (reportId: string) => {
  return api.get<EnhancedReport>(`/analytics/database/reports/${reportId}`);
};

/**
 * @param connectionString - Строка подключения к БД.
 * @param dbType - Тип базы данных.
 * @param alias - Псевдоним для сохранения подключения.
 */
export const startDatabaseAnalysis = (
    connectionString: string,
    dbType: 'postgres' | 'sqlserver',
    alias: string // Добавлен alias
) => {
  const formData = new FormData();
  formData.append('connectionString', connectionString);
  formData.append('dbType', dbType);
  formData.append('alias', alias); // Добавлен alias

  // Эндпоинт соответствует database_analytics.py
  return api.post('/analytics/database/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getUserReports = () => {
  return api.get('/analytics/database/reports');
};

export const downloadReportPDF = (reportId: number) => {
  const token = localStorage.getItem('authToken');
  return fetch(`${API_URL}/analytics/database/reports/${reportId}/pdf`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
};

export const verifyEmail = (email: string, code: string) => {
  return api.post('/users/verify-email', { email, code });
};

export const requestPasswordReset = (email: string) => {
  return api.post('/users/password-reset/request', { email });
};

export const resetPassword = (token: string, new_password: string) => {
  return api.post('/users/password-reset', { token, new_password });
};

export const getMe = () => {
  return api.get<User>('/users/me');
};

export default api;