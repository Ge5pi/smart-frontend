import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

interface SmartFinding {
  question: string;
  summary: string;
  data_preview: any[];
  chart_data: any;
  analyzed_tables: string[];
  method: string;
  analysis_type: string;

  // SmartGPT данные
  business_insights: string;
  action_items: string[];
  risk_assessment: string;
  opportunities: string[];
  gpt_confidence: string;
  business_context: Record<string, any>;

  // Дополнительные данные
  statistical_insights: any[];
  correlations: any[];
  quality_metrics: any[];
  predictive_patterns: any[];

  timestamp: string;
  success: boolean;
  has_smart_insights: boolean;
}

interface SmartReport {
  executive_summary: string;
  detailed_findings: SmartFinding[];
  method: string;
  tables_info: Record<string, any>;
  relations_info: any[];

  smart_analysis_stats: {
    questions_processed: number;
    successful_analyses: number;
    failed_analyses: number;
    smart_gpt_insights_count: number;
    tables_analyzed: number;
    relations_found: number;
    total_memory_mb: number;
    success_rate_percent: number;
    smart_gpt_coverage_percent: number;
  };

  memory_usage: Record<string, any>;
  smart_recommendations: string[];
  report_metadata: {
    created_at: string;
    report_version: string;
    smart_gpt_enabled: boolean;
    analysis_engine: string;
  };
}

const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<SmartReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'insights' | 'actions' | 'technical'>('overview');

  useEffect(() => {
    // Убедимся, что ID существует
    if (!id) {
      setLoading(false);
      setError("ID отчета не найден в URL.");
      return;
    }

    // Запускаем интервал для опроса статуса
    const intervalId = setInterval(async () => {
      try {
        console.log(`[${new Date().toLocaleTimeString()}] Проверяем статус отчета...`);
        const response = await api.get(`/analytics/reports/${id}`);
        const currentReport = response.data;

        // Если отчет готов (COMPLETED) или произошла ошибка (FAILED)
        if (currentReport.status === 'COMPLETED' || currentReport.status === 'FAILED') {
          console.log("Получен финальный статус:", currentReport.status);
          clearInterval(intervalId); // Останавливаем опрос
          setReport(currentReport);
          setLoading(false); // Выключаем загрузчик

          if (currentReport.status === 'FAILED') {
            setError(currentReport.results?.error || 'Произошла ошибка при генерации отчета');
          }
        }
        // Если статус все еще PENDING или PROCESSING, ничего не делаем и ждем следующей проверки
      } catch (err: any) {
        console.error("Критическая ошибка при опросе отчета:", err);
        clearInterval(intervalId); // Останавливаем опрос при ошибке
        setError(err.response?.data?.detail || 'Не удалось загрузить отчет');
        setLoading(false);
      }
    }, 3000); // Проверяем каждые 3 секунды

    // Функция очистки: будет вызвана, когда пользователь уходит со страницы
    return () => {
      console.log("Очистка интервала...");
      clearInterval(intervalId);
    };

  }, [id]);

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return '🎯';
      case 'medium': return '⚡';
      case 'low': return '⚠️';
      default: return '📊';
    }
  };

  const getAnalysisTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'overview': '🏠',
      'business_insights': '💼',
      'data_quality': '🔍',
      'statistical_insights': '📈',
      'predictive_analysis': '🔮',
      'correlation': '🔗',
      'anomalies': '🚨',
      'comparison': '⚖️',
      'relationship_analysis': '🌐'
    };
    return icons[type] || '📊';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 text-xl font-semibold mb-2">Ошибка загрузки отчета</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/connections')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Вернуться к подключениям
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">Отчет не найден</p>
          </div>
        </div>
      </div>
    );
  }

  const smartFindings = report.results?.detailed_findings?.filter(f => f.has_smart_insights) || [];
  const allActionItems = smartFindings.flatMap(f => f.smartgpt_insights?.action_items || []);
  const allOpportunities = smartFindings.flatMap(f => f.opportunities || []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SmartGPT Анализ отчет</h1>
            <p className="text-gray-600 mt-1">
              {report.results?.report_metadata?.analysis_engine || 'SmartGPTAnalyzer'} •
              {new Date(report.results?.report_metadata?.created_at).toLocaleDateString('ru-RU')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              🤖 SmartGPT
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              v{report.result?.report_metadata?.report_version}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">SmartGPT Инсайты</p>
                <p className="text-2xl font-bold text-blue-600">
                  {report.result?.smart_analysis_stats?.smart_gpt_insights_count}
                </p>
              </div>
              <div className="text-2xl">🤖</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Покрытие: {report.results?.smart_analysis_stats?.smart_gpt_coverage_percent}%
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Успешные анализы</p>
                <p className="text-2xl font-bold text-green-600">
                  {report.results?.smart_analysis_stats?.successful_analyses}
                </p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Из {report.results?.smart_analysis_stats?.questions_processed} запланированных
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Таблиц проанализировано</p>
                <p className="text-2xl font-bold text-purple-600">
                  {report.results?.smart_analysis_stats?.tables_analyzed}
                </p>
              </div>
              <div className="text-2xl">🗂️</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {report.results?.smart_analysis_stats?.total_memory_mb.toFixed(1)} MB данных
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Связей найдено</p>
                <p className="text-2xl font-bold text-orange-600">
                  {report.results?.smart_analysis_stats?.relations_found}
                </p>
              </div>
              <div className="text-2xl">🔗</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Между таблицами</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Обзор', icon: '📋' },
                { id: 'insights', label: 'Бизнес-инсайты', icon: '💡' },
                { id: 'actions', label: 'Действия', icon: '🎯' },
                { id: 'technical', label: 'Технические детали', icon: '⚙️' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {selectedTab === 'overview' && (
            <>
              {/* Executive Summary */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📊</span>
                  Executive Summary
                </h2>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {report.results?.executive_summary}
                  </div>
                </div>
              </div>

              {/* Smart Recommendations */}
              {report.results?.smart_recommendations && report.results?.smart_recommendations.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">💡</span>
                    Умные рекомендации
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.results?.smart_recommendations.map((recommendation, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {selectedTab === 'insights' && (
            <div className="space-y-6">
              {smartFindings.map((finding, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm">
                  <div className="border-b border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-2">
                          <span className="mr-2">{getAnalysisTypeIcon(finding.analysis_type)}</span>
                          {finding.question}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            {getConfidenceIcon(finding.gpt_confidence)}
                            <span className="ml-1 capitalize">{finding.gpt_confidence} confidence</span>
                          </span>
                          <span>Таблицы: {finding.analyzed_tables.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Business Insights */}
                    {finding.business_insights && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="mr-2">🎯</span>
                          Бизнес-инсайты
                        </h4>
                        <div className="bg-green-50 border-l-4 border-green-400 p-4">
                          <div className="whitespace-pre-wrap text-green-800 text-sm leading-relaxed">
                            {finding.business_insights}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Items */}
                    {finding.action_items && finding.action_items.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="mr-2">✅</span>
                          Рекомендуемые действия
                        </h4>
                        <ul className="space-y-2">
                          {finding.action_items.map((action, actionIndex) => (
                            <li key={actionIndex} className="flex items-start">
                              <span className="text-blue-500 mr-2 mt-1">▶</span>
                              <span className="text-gray-700 text-sm">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Risk Assessment */}
                    {finding.risk_assessment && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="mr-2">⚠️</span>
                          Оценка рисков
                        </h4>
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                          <div className="whitespace-pre-wrap text-yellow-800 text-sm leading-relaxed">
                            {finding.risk_assessment}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Opportunities */}
                    {finding.opportunities && finding.opportunities.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="mr-2">🚀</span>
                          Возможности
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {finding.opportunities.map((opportunity, oppIndex) => (
                            <div key={oppIndex} className="bg-purple-50 border border-purple-200 rounded p-3">
                              <p className="text-purple-800 text-sm">{opportunity}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Data Preview */}
                    {finding.data_preview && finding.data_preview.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="mr-2">📋</span>
                          Данные
                        </h4>
                        <div className="bg-gray-50 rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-100">
                                <tr>
                                  {Object.keys(finding.data_preview[0] || {}).map(key => (
                                    <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {finding.data_preview.slice(0, 5).map((row, rowIndex) => (
                                  <tr key={rowIndex}>
                                    {Object.values(row).map((value, colIndex) => (
                                      <td key={colIndex} className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                        {String(value) || 'N/A'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedTab === 'actions' && (
            <div className="space-y-6">
              {/* All Action Items */}
              {allActionItems.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🎯</span>
                    Все рекомендуемые действия
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allActionItems.map((action, index) => (
                      <div key={index} className="bg-blue-50 border-l-4 border-blue-400 p-4">
                        <p className="text-blue-800 text-sm">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Opportunities */}
              {allOpportunities.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🚀</span>
                    Все возможности для роста
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allOpportunities.map((opportunity, index) => (
                      <div key={index} className="bg-green-50 border-l-4 border-green-400 p-4">
                        <p className="text-green-800 text-sm">{opportunity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'technical' && (
            <div className="space-y-6">
              {/* Tables Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🗂️</span>
                  Информация о таблицах
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Таблица</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Строк</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Колонок</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Память (MB)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(report.results?.tables_info || {}).map(([tableName, info]: [string, any]) => (
                        <tr key={tableName}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tableName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{info.rows?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{info.columns}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{info.memory_mb?.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Загружено
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Relations Info */}
              {report.results?.relations_info && report.results?.relations_info.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🔗</span>
                    Связи между таблицами
                  </h2>
                  <div className="space-y-3">
                    {report.results?.relations_info.map((relation: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">{relation.from_table}</span>
                          <span className="text-gray-500 mx-2">→</span>
                          <span className="font-medium">{relation.to_table}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {relation.from_column} → {relation.to_column} ({relation.type})
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
