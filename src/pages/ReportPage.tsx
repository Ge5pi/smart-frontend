import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  TrendingUp,
  Database,
  Brain,
  Download,
  RefreshCcw,
  Star,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface Report {
  id: number;
  status: string;
  results: {
    executive_summary: string;
    detailed_findings: Finding[];
    method: string;
    analysis_stats: AnalysisStats;
    tables_info: Record<string, TableInfo>;
    recommendations: string[];
  };
  created_at: string;
}

interface Finding {
  question: string;
  summary: string;
  data_preview: any[];
  gpt_insights?: {
    business_insights?: string;
    action_items?: string[];
    risk_assessment?: string;
    opportunities?: string[];
    confidence?: string;
  };
  analyzed_tables: string[];
  chart_data?: any;
  success: boolean;
  analysis_type: string;
}

interface AnalysisStats {
  questions_processed: number;
  successful_analyses: number;
  gpt_analyses_count: number;
  tables_analyzed: number;
  relations_found: number;
  total_memory_mb: number;
  success_rate_percent: number;
}

interface TableInfo {
  rows: number;
  columns: number;
  memory_mb: number;
}

interface TaskStatus {
  status: string;
  progress?: string;
  progress_percentage?: number;
  error?: string;
}

export default function ReportPage() {
  const { reportId } = useParams();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('task_id');

  const [report, setReport] = useState<Report | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>({ status: 'PENDING' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [expandedFindings, setExpandedFindings] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (taskId && taskStatus.status !== 'COMPLETED') {
      // Если есть task_id и задача не завершена, опрашиваем статус
      const interval = setInterval(checkTaskStatus, 3000);
      checkTaskStatus(); // Первый запрос сразу
      return () => clearInterval(interval);
    } else if (reportId) {
      // Иначе загружаем готовый отчет
      loadReport();
    }
  }, [taskId, reportId, taskStatus.status]);

  const checkTaskStatus = async () => {
    if (!taskId) return;

    try {
      const response = await fetch(`/analytics/reports/task/${taskId}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const status = await response.json();
        setTaskStatus(status);

        if (status.status === 'SUCCESS' && status.info?.report_id) {
          // Задача завершена успешно, загружаем отчет
          loadReport();
        } else if (status.status === 'FAILURE') {
          setError(status.info?.error || 'Ошибка генерации отчета');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Error checking task status:', err);
    }
  };

  const loadReport = async () => {
    if (!reportId) return;

    try {
      const response = await fetch(`/analytics/reports/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data);
        setTaskStatus({ status: 'COMPLETED' });
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Ошибка загрузки отчета');
      }
    } catch (err) {
      setError('Ошибка загрузки отчета');
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFinding = (index: number) => {
    const newExpanded = new Set(expandedFindings);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFindings(newExpanded);
  };

  const getStatusIcon = () => {
    switch (taskStatus.status) {
      case 'SUCCESS':
      case 'COMPLETED':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'FAILURE':
      case 'FAILED':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Clock className="h-6 w-6 text-blue-600 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    if (taskStatus.status === 'COMPLETED' || taskStatus.status === 'SUCCESS') {
      return 'Анализ завершен';
    } else if (taskStatus.status === 'FAILURE' || taskStatus.status === 'FAILED') {
      return 'Ошибка анализа';
    } else {
      return taskStatus.progress || 'Обработка данных...';
    }
  };

  if (loading && taskStatus.status !== 'PENDING') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка отчета...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md text-center">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Ошибка загрузки
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  // Показываем прогресс если отчет еще генерируется
  if (taskStatus.status !== 'COMPLETED' && taskStatus.status !== 'SUCCESS') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            {getStatusIcon()}
            <h2 className="text-2xl font-semibold text-gray-900 mt-4 mb-2">
              {getStatusText()}
            </h2>

            {taskStatus.progress_percentage && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${taskStatus.progress_percentage}%` }}
                ></div>
              </div>
            )}

            {taskStatus.progress && (
              <p className="text-gray-600 mt-2">{taskStatus.progress}</p>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">SmartGPT DataFrame Analytics в работе</h3>
              <p className="text-blue-800 text-sm">
                Система анализирует ваши данные и генерирует бизнес-инсайты с помощью GPT.
                Это может занять несколько минут в зависимости от объема данных.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Отчет не найден</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon()}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  SmartGPT DataFrame Отчет #{report.id}
                </h1>
                <p className="text-gray-600">
                  Создан: {new Date(report.created_at).toLocaleString('ru-RU')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="h-4 w-4" />
                Скачать
              </button>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        {report.results?.executive_summary && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Executive Summary
            </h2>
            <div className="prose max-w-none">
              {report.results.executive_summary.split('\n').map((paragraph, index) => (
                <p key={index} className="text-gray-700 mb-2">{paragraph}</p>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Stats */}
        {report.results?.analysis_stats && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Статистика анализа
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {report.results.analysis_stats.questions_processed}
                </div>
                <div className="text-sm text-blue-800">Вопросов обработано</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {report.results.analysis_stats.gpt_analyses_count}
                </div>
                <div className="text-sm text-green-800">GPT инсайтов</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {report.results.analysis_stats.tables_analyzed}
                </div>
                <div className="text-sm text-purple-800">Таблиц проанализировано</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {report.results.analysis_stats.success_rate_percent}%
                </div>
                <div className="text-sm text-orange-800">Успешность</div>
              </div>
            </div>
          </div>
        )}

        {/* Tables Info */}
        {report.results?.tables_info && Object.keys(report.results.tables_info).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-600" />
              Информация о таблицах
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Таблица</th>
                    <th className="text-left py-2">Строк</th>
                    <th className="text-left py-2">Колонок</th>
                    <th className="text-left py-2">Память (MB)</th>
                    <th className="text-left py-2">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(report.results.tables_info).map(([tableName, info]) => (
                    <tr key={tableName} className="border-b">
                      <td className="py-2 font-medium">{tableName}</td>
                      <td className="py-2">{info.rows?.toLocaleString()}</td>
                      <td className="py-2">{info.columns}</td>
                      <td className="py-2">{info.memory_mb?.toFixed(2)}</td>
                      <td className="py-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Загружено
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed Findings */}
        {report.results?.detailed_findings && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              Детальные находки ({report.results.detailed_findings.length})
            </h2>

            {report.results.detailed_findings.map((finding, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border">
                <div
                  className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-50"
                  onClick={() => toggleFinding(index)}
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {finding.question}
                    </h3>
                    <p className="text-sm text-gray-600">{finding.summary}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Проанализированы таблицы: {finding.analyzed_tables.map(table => (
                        <span key={table} className="px-2 py-1 bg-gray-100 rounded ml-1">
                          {table}
                        </span>
                      ))}</span>
                      {finding.gpt_insights && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Brain className="h-3 w-3" />
                          GPT анализ
                        </span>
                      )}
                    </div>
                  </div>
                  {expandedFindings.has(index) ?
                    <ChevronDown className="h-5 w-5 text-gray-400" /> :
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  }
                </div>

                {expandedFindings.has(index) && (
                  <div className="border-t p-4">
                    {/* GPT Insights */}
                    {finding.gpt_insights?.business_insights && (
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Brain className="h-4 w-4 text-blue-600" />
                          SmartGPT Бизнес-инсайты
                        </h4>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          {finding.gpt_insights.business_insights.split('\n').map((paragraph, pIndex) => (
                            <p key={pIndex} className="text-blue-900 mb-2 last:mb-0">{paragraph}</p>
                          ))}
                        </div>

                        {/* Action Items */}
                        {finding.gpt_insights.action_items && finding.gpt_insights.action_items.length > 0 && (
                          <div className="mt-3">
                            <h5 className="font-medium text-gray-700 mb-2">Рекомендуемые действия:</h5>
                            <ul className="list-disc list-inside space-y-1">
                              {finding.gpt_insights.action_items.map((action, aIndex) => (
                                <li key={aIndex} className="text-sm text-gray-600">{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Opportunities */}
                        {finding.gpt_insights.opportunities && finding.gpt_insights.opportunities.length > 0 && (
                          <div className="mt-3">
                            <h5 className="font-medium text-gray-700 mb-2">Возможности:</h5>
                            <ul className="list-disc list-inside space-y-1">
                              {finding.gpt_insights.opportunities.map((opp, oIndex) => (
                                <li key={oIndex} className="text-sm text-green-600">{opp}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Data Preview */}
                    {finding.data_preview && finding.data_preview.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Данные:</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b bg-gray-50">
                                {Object.keys(finding.data_preview[0]).map(col => (
                                  <th key={col} className="text-left p-2 font-medium text-gray-700">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {finding.data_preview.slice(0, 5).map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-b hover:bg-gray-50">
                                  {Object.values(row).map((cell, cellIndex) => (
                                    <td key={cellIndex} className="p-2 text-gray-600">
                                      {String(cell) || 'N/A'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {!finding.success && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">
                          {finding.error || 'Результаты анализа недоступны'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {report.results?.recommendations && report.results.recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Рекомендации системы
            </h2>
            <ul className="space-y-2">
              {report.results.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
