// api.ts
import axios from 'axios';

// --- Конфигурация экземпляра Axios ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
console.log("🚀 VITE_API_URL:", import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Интерцептор для автоматического добавления токена авторизации
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

// --- Типизация данных для ReportPage ---

// Упрощенная структура результатов, соответствующая бэкенду
interface DatabaseAnalysisResults {
  insights: Record<string, string>;
  correlations: Record<string, Record<string, Record<string, number | null>>>;
}

// Тип для ошибки, если бэкенд вернет ее в поле results
// (хотя текущая реализация бэка так не делает, это хорошая практика)
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


// --- Функции API ---

/** Получение данных отчета по ID */
export const getReport = (reportId: string) => {
  // Эндпоинт соответствует database_analytics.py
  return api.get<EnhancedReport>(`/analytics/database/reports/${reportId}`);
};

/** Запуск анализа базы данных (используем FormData для совместимости с Form на бэкенде) */
export const startDatabaseAnalysis = (connectionString: string, dbType: 'postgres' | 'sqlserver') => {
  const formData = new FormData();
  formData.append('connectionString', connectionString);
  formData.append('dbType', dbType);
  // Эндпоинт соответствует database_analytics.py
  return api.post('/analytics/database/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default api;