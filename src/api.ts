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

interface MLPattern {
  type: string;
  description: string;
  confidence: number;
}

interface DomainContext {
  domain_type: string;
  confidence: number;
  key_entities: string[];
  business_metrics: string[];
}

interface AnalysisStats {
  questions_processed: number;
  successful_findings: number;
  ml_patterns_found: number;
  tables_coverage: number;
  tables_analyzed: number;
}

interface DiversityReport {
  total_tables: number;
  analyzed_tables: number;
  coverage_percentage: number;
  underanalyzed_tables: string[];
}

interface DetailedFinding {
  question: string;
  summary: string;
  sql_query: string;
  chart_url?: string;
  data_preview?: any[];
  data_stats?: any;
  ml_patterns?: MLPattern[];
  validation?: {
    is_valid: boolean;
    message: string;
  };
  confidence_score?: number;
  category?: string;
}

interface SuccessResults {
  executive_summary: string;
  detailed_findings: DetailedFinding[];
  recommendations: string[];
  domain_context: DomainContext;
  ml_insights: {
    total_patterns: number;
    pattern_types: Record<string, MLPattern[]>;
    high_confidence_patterns: any[];
  };
  analysis_stats: AnalysisStats;
  diversity_report: DiversityReport;
  adaptive_strategy?: {
    preferred_question_types: string[];
    generate_charts: boolean;
    detailed_data: boolean;
  };
}

interface ErrorResults {
  error: string;
  details?: string;
  stage?: string;
}

export interface EnhancedReport {
    id: number;
    status: string;
    created_at: string;
    task_id?: string;
    results: SuccessResults | ErrorResults | null;
}

export interface EnhancedTaskStatus {
  task_id: string;
  status: string;
  progress: string;
  stage: string;
  progress_percentage: number;
  current_question: string;
  diversity_report: DiversityReport;
  summary: {
    questions_processed: number;
    findings_count: number;
    ml_patterns_found: number;
    domain_detected: string;
  };
  error?: string;
}

// --- Функции API для ReportPage ---

/** Получение данных отчета по ID */
export const getReport = (reportId: string) => {
    return api.get<EnhancedReport>(`/analytics/reports/${reportId}`);
};

/** Получение статуса задачи Celery */
export const getReportStatus = (taskId: string) => {
    return api.get<EnhancedTaskStatus>(`/analytics/reports/status/${taskId}`);
};

/** Отправка обратной связи по отчету */
export const submitReportFeedback = (reportId: string, feedbackData: { rating: number; comment: string }) => {
    return api.post(`/analytics/reports/feedback/${reportId}`, feedbackData);
};


export const startDatabaseAnalysis = (connectionString: string, dbType: 'postgres' | 'sqlserver') => {
  const formData = new FormData();
  formData.append('connectionString', connectionString);
  formData.append('dbType', dbType);
  return api.post('/analytics/database/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default api;