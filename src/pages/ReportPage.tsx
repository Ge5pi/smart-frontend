// src/pages/ReportPage.tsx - обновленный для GPT отчетов
import{ useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText,
  Loader,
  AlertCircle,
  Download,
  BarChart3,
  Database,
  TrendingUp,
  Eye,
  Brain,
  Target,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  Lightbulb
} from 'lucide-react';
import api from '../api';

// Типы для GPT-enhanced отчетов
type GPTInsights = {
  gpt_analysis: string;
  gpt_type: string;
  confidence: string;
};

type DataFrameFinding = {
  question: string;
  summary: string;
  data_preview: any[];
  chart_data?: {
    type: string;
    x?: any[];
    y?: any[];
    labels?: string[];
    values?: any[];
    title?: string;
  };
  analyzed_tables: string[];
  method: string;
  analysis_type: string;
  gpt_insights?: GPTInsights;
  additional_info?: any;
  success: boolean;
  timestamp: string;
};

type AnalysisStats = {
  questions_processed: number;
  successful_analyses: number;
  failed_analyses: number;
  gpt_analyses_count: number;
  tables_analyzed: number;
  relations_found: number;
  total_memory_mb: number;
  success_rate_percent: number;
  gpt_integration: boolean;
};

type DataFrameReport = {
  id: number;
  status: string;
  results: {
    executive_summary: string;
    detailed_findings: DataFrameFinding[];
    method: string;
    tables_info: Record<string, any>;
    relations_info: any[];
    analysis_stats: AnalysisStats;
    recommendations: string[];
    report_metadata: {
      created_at: string;
      report_version: string;
      gpt_enabled: boolean;
    };
  };
  created_at: string;
};

const ReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<DataFrameReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'findings' | 'insights' | 'recommendations'>('overview');

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const response = await api.get(`/analytics/reports/${id}`);
        setReport(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Ошибка загрузки отчета');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const renderGPTInsights = (gptInsights: GPTInsights) => {
    if (!gptInsights?.gpt_analysis) return null;

    const confidenceColor = {
      high: 'bg-green-50 border-green-200 text-green-900',
      medium: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      low: 'bg-red-50 border-red-200 text-red-900'
    }[gptInsights.confidence] || 'bg-gray-50 border-gray-200 text-gray-900';

    return (
      <div className={`p-4 rounded-lg border ${confidenceColor} mt-4`}>
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">GPT-4 Анализ</h4>
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                gptInsights.confidence === 'high' ? 'bg-green-100 text-green-800' :
                gptInsights.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {gptInsights.confidence === 'high' ? 'Высокая точность' :
                 gptInsights.confidence === 'medium' ? 'Средняя точность' : 'Низкая точность'}
              </span>
            </div>
            <div className="prose prose-sm max-w-none">
              {gptInsights.gpt_analysis.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-2 last:mb-0">{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderChart = (chartData: any) => {
    if (!chartData) return null;

    return (
      <div className="bg-gray-50 p-4 rounded-lg border mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          {chartData.title || 'График'}
        </h4>
        <div className="text-xs text-gray-600 mb-3">
          Тип: {chartData.type} | Данных: {chartData.x?.length || chartData.values?.length || 0} точек
        </div>
        <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <span className="text-blue-700 font-medium text-sm">Интерактивный график</span>
            <p className="text-xs text-blue-600 mt-1">В разработке</p>
          </div>
        </div>
      </div>
    );
  };

  const renderDataTable = (data: any[]) => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);

    return (
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.slice(0, 6).map((col) => (
                <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.slice(0, 5).map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {columns.slice(0, 6).map((col) => (
                  <td key={col} className="px-4 py-3 text-gray-900 max-w-xs truncate">
                    {String(row[col]) || 'N/A'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-center py-2 text-xs text-gray-500 bg-gray-50">
          Показано {Math.min(5, data.length)} из {data.length} записей
          {columns.length > 6 && `, ${columns.length - 6} колонок скрыто`}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Загрузка AI-анализа...</h2>
          <p className="text-gray-600">Обработка результатов GPT анализа</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ошибка загрузки</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!report || !report.results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Отчет недоступен</h2>
          <p className="text-gray-600">AI-анализ не завершился или недоступен</p>
        </div>
      </div>
    );
  }

  const { results } = report;
  const isGPTReport = results.analysis_stats?.gpt_integration;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="relative">
                  <Database className="w-8 h-8 text-blue-600" />
                  {isGPTReport && (
                    <Brain className="w-4 h-4 text-purple-600 absolute -top-1 -right-1 bg-white rounded-full p-0.5" />
                  )}
                </div>
                AI DataFrame Анализ #{report.id}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Создан: {new Date(report.created_at).toLocaleString('ru-RU')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Версия: {results.report_metadata?.report_version || '3.0'}</span>
                </div>
                <div className="flex items-center gap-1">
                  {isGPTReport ? (
                    <>
                      <Brain className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-600 font-medium">GPT-Enhanced</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      <span>DataFrame</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
                <Download className="w-4 h-4" />
                Экспорт
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Performance Dashboard */}
        {results.analysis_stats && (
          <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Статистика анализа</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{results.analysis_stats.successful_analyses}</div>
                <div className="text-xs text-gray-600">Успешных анализов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{results.analysis_stats.gpt_analyses_count || 0}</div>
                <div className="text-xs text-gray-600">GPT анализов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.analysis_stats.tables_analyzed}</div>
                <div className="text-xs text-gray-600">Таблиц</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{results.analysis_stats.relations_found}</div>
                <div className="text-xs text-gray-600">Связей</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{results.analysis_stats.total_memory_mb?.toFixed(1)}MB</div>
                <div className="text-xs text-gray-600">В памяти</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{results.analysis_stats.success_rate_percent}%</div>
                <div className="text-xs text-gray-600">Успешность</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Обзор', icon: Eye },
                { id: 'findings', label: 'AI Результаты', icon: Brain },
                { id: 'insights', label: 'Инсайты', icon: Lightbulb },
                { id: 'recommendations', label: 'Рекомендации', icon: Target }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {id === 'findings' && isGPTReport && (
                    <Sparkles className="w-3 h-3 text-purple-500" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Executive Summary */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    {isGPTReport && <Brain className="w-6 h-6 text-purple-600" />}
                    Executive Summary
                  </h2>
                  <div className={`p-6 rounded-lg border ${isGPTReport ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="prose prose-sm max-w-none">
                      {results.executive_summary.split('\n').map((paragraph, idx) => (
                        <p key={idx} className={`mb-3 leading-relaxed ${isGPTReport ? 'text-purple-900' : 'text-blue-900'}`}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tables Info */}
                {results.tables_info && Object.keys(results.tables_info).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация о таблицах</h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Таблица</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Строк</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Колонок</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Память (MB)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {Object.entries(results.tables_info).map(([tableName, info]: [string, any]) => (
                            <tr key={tableName}>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{tableName}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{info.rows?.toLocaleString()}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{info.columns}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{info.memory_mb?.toFixed(2)}</td>
                              <td className="px-6 py-4">
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
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
              </div>
            )}

            {/* AI Findings Tab */}
            {activeTab === 'findings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-600" />
                    AI-Результаты анализа
                  </h2>
                  {isGPTReport && (
                    <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                      <Sparkles className="w-4 h-4" />
                      GPT-Enhanced
                    </div>
                  )}
                </div>

                {results.detailed_findings && results.detailed_findings.length > 0 ? (
                  <div className="space-y-6">
                    {results.detailed_findings.map((finding, index) => (
                      <div key={index} className={`bg-white border rounded-lg p-6 ${
                        finding.success ? 'border-green-200' : 'border-red-200'
                      }`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{finding.question}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Database className="w-4 h-4" />
                                {finding.method}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(finding.timestamp).toLocaleString('ru-RU')}
                              </span>
                              <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                finding.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {finding.success ? (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    Успешно
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3" />
                                    Ошибка
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-gray-700 leading-relaxed">{finding.summary}</p>
                        </div>

                        {finding.analyzed_tables && finding.analyzed_tables.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600">
                              Проанализированы таблицы:
                              {finding.analyzed_tables.map(table => (
                                <span key={table} className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                  {table}
                                </span>
                              ))}
                            </p>
                          </div>
                        )}

                        {/* GPT Insights */}
                        {finding.gpt_insights && renderGPTInsights(finding.gpt_insights)}

                        {/* Chart */}
                        {finding.chart_data && renderChart(finding.chart_data)}

                        {/* Data Preview */}
                        {finding.data_preview && finding.data_preview.length > 0 && (
                          <div>
                            <h4 className="text-md font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <BarChart3 className="w-4 h-4" />
                              Данные:
                            </h4>
                            {renderDataTable(finding.data_preview)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Результаты анализа недоступны</p>
                  </div>
                )}
              </div>
            )}

            {/* Insights Tab */}
            {activeTab === 'insights' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-yellow-600" />
                  Ключевые инсайты
                </h2>

                {/* GPT Insights Summary */}
                {isGPTReport && results.detailed_findings && (
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      GPT-4 Ключевые находки
                    </h3>
                    <div className="space-y-4">
                      {results.detailed_findings
                        .filter(f => f.gpt_insights?.gpt_analysis)
                        .slice(0, 3)
                        .map((finding, idx) => (
                          <div key={idx} className="bg-white p-4 rounded border border-purple-100">
                            <h4 className="font-medium text-purple-900 mb-2">{finding.question}</h4>
                            <p className="text-purple-800 text-sm line-clamp-3">
                              {finding.gpt_insights!.gpt_analysis.substring(0, 200)}...
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Relations visualization */}
                {results.relations_info && results.relations_info.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Схема связей данных</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="space-y-3">
                        {results.relations_info.map((relation: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-medium text-sm">
                                {relation.from_table || relation.from}
                              </span>
                              <TrendingUp className="w-4 h-4 text-gray-400" />
                              <span className="bg-green-100 text-green-800 px-3 py-1 rounded font-medium text-sm">
                                {relation.to_table || relation.to}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {relation.on || `${relation.from_column} → ${relation.to_column}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Target className="w-6 h-6 text-green-600" />
                  Рекомендации
                </h2>

                {results.recommendations && results.recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {results.recommendations.map((recommendation, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 flex items-start gap-4">
                        <div className="bg-green-100 text-green-600 rounded-full p-2 flex-shrink-0">
                          <Target className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 leading-relaxed">{recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Рекомендации формируются...</p>
                  </div>
                )}

                {/* AI Enhancement Notice */}
                {isGPTReport && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      AI-Enhanced Рекомендации
                    </h3>
                    <ul className="text-blue-800 space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Используйте GPT-инсайты для создания персонализированных дашбордов</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Настройте автоматические AI-отчеты для регулярного мониторинга</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Интегрируйте найденные паттерны в бизнес-процессы</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
