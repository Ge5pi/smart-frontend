// src/pages/ReportPage.tsx - обновленный для DataFrame отчетов
import { useState, useEffect } from 'react';
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
  Target
} from 'lucide-react';
import api from '../api';

// Типы для DataFrame отчетов
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
  additional_info?: {
    basic_info?: any;
    numeric_stats?: any;
    categorical_stats?: any;
    correlations?: any[];
    anomalies?: any[];
  };
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
    analysis_stats: {
      questions_processed: number;
      successful_analyses: number;
      tables_analyzed: number;
      relations_found: number;
      total_memory_mb: number;
    };
    recommendations: string[];
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
        const response = await api.get(`/analytics/reports/${id}`);
        const currentReport = response.data;

        console.log('Fetched report status:', currentReport.status);

        if (currentReport.status === 'PENDING' || currentReport.status === 'PROCESSING') {
          setTimeout(fetchReport, 3000);
        } else {
          setReport(currentReport);
          setIsLoading(false);
          if (currentReport.status === 'FAILED') {
            setError(currentReport.results?.error || 'Произошла ошибка при генерации отчета');
          }
        }
      } catch (err: any) {
        console.error('Error fetching report:', err);
        setError(err.response?.data?.detail || 'Ошибка загрузки отчета');
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const renderChart = (chartData: any) => {
    if (!chartData) return null;

    // Простая визуализация данных (в реальном приложении используйте Chart.js или Recharts)
    return (
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h4 className="text-sm font-medium text-gray-700 mb-2">{chartData.title || 'График'}</h4>
        <div className="text-xs text-gray-600">
          Тип: {chartData.type} | Данные: {chartData.x?.length || chartData.values?.length || 0} точек
        </div>
        {/* Здесь должна быть интеграция с библиотекой графиков */}
        <div className="mt-2 h-32 bg-gradient-to-r from-blue-100 to-blue-200 rounded flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <span className="ml-2 text-blue-700 font-medium">График будет здесь</span>
        </div>
      </div>
    );
  };

  const renderDataTable = (data: any[]) => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.slice(0, 10).map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2 text-gray-900 max-w-xs truncate">
                    {String(row[col]) || 'N/A'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 10 && (
          <div className="text-center py-2 text-xs text-gray-500">
            Показано 10 из {data.length} записей
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Загрузка DataFrame отчета...</h2>
          <p className="text-gray-600">Обработка результатов анализа</p>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Отчет не найден</h2>
          <p className="text-gray-600">DataFrame анализ не завершился или недоступен</p>
        </div>
      </div>
    );
  }

  const { results } = report;
  const isDataFrameReport = results.method === 'pure_dataframe';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Database className="w-8 h-8 text-blue-600" />
                DataFrame Анализ #{report.id}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Создан: {new Date(report.created_at).toLocaleString('ru-RU')} | 
                Метод: {isDataFrameReport ? 'DataFrame' : 'Hybrid'} | 
                Статус: <span className="text-green-600 font-medium">{report.status}</span>
              </p>
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
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Обзор', icon: Eye },
                { id: 'findings', label: 'Результаты', icon: BarChart3 },
                { id: 'insights', label: 'Инсайты', icon: Brain },
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Резюме анализа</h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <p className="text-blue-900 leading-relaxed">{results.executive_summary}</p>
                  </div>
                </div>

                {/* Stats Cards */}
                {results.analysis_stats && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Статистика анализа</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{results.analysis_stats.questions_processed}</div>
                        <div className="text-sm text-gray-600">Вопросов обработано</div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{results.analysis_stats.successful_analyses}</div>
                        <div className="text-sm text-gray-600">Успешных анализов</div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{results.analysis_stats.tables_analyzed}</div>
                        <div className="text-sm text-gray-600">Таблиц проанализировано</div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">{results.analysis_stats.relations_found}</div>
                        <div className="text-sm text-gray-600">Связей найдено</div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{results.analysis_stats.total_memory_mb?.toFixed(1)}MB</div>
                        <div className="text-sm text-gray-600">Данных в памяти</div>
                      </div>
                    </div>
                  </div>
                )}

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
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {Object.entries(results.tables_info).map(([tableName, info]: [string, any]) => (
                            <tr key={tableName}>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{tableName}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{info.rows?.toLocaleString()}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{info.columns}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{info.memory_mb?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Findings Tab */}
            {activeTab === 'findings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Детальные результаты</h2>
                
                {results.detailed_findings && results.detailed_findings.length > 0 ? (
                  <div className="space-y-6">
                    {results.detailed_findings.map((finding, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{finding.question}</h3>
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            DataFrame
                          </span>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-gray-700 leading-relaxed">{finding.summary}</p>
                        </div>

                        {finding.analyzed_tables && finding.analyzed_tables.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600">
                              Проанализированы таблицы: {finding.analyzed_tables.join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Chart */}
                        {finding.chart_data && (
                          <div className="mb-4">
                            {renderChart(finding.chart_data)}
                          </div>
                        )}

                        {/* Data Preview */}
                        {finding.data_preview && finding.data_preview.length > 0 && (
                          <div>
                            <h4 className="text-md font-medium text-gray-900 mb-2">Данные:</h4>
                            {renderDataTable(finding.data_preview)}
                          </div>
                        )}

                        {/* Additional Info */}
                        {finding.additional_info && (
                          <div className="mt-4 space-y-3">
                            {finding.additional_info.correlations && finding.additional_info.correlations.length > 0 && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <h5 className="text-sm font-medium text-yellow-800 mb-1">Корреляции:</h5>
                                <ul className="text-sm text-yellow-700 space-y-1">
                                  {finding.additional_info.correlations.map((corr: any, idx: number) => (
                                    <li key={idx}>
                                      {corr.column1} ↔ {corr.column2}: {corr.correlation?.toFixed(3)} ({corr.strength})
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {finding.additional_info.anomalies && finding.additional_info.anomalies.length > 0 && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <h5 className="text-sm font-medium text-red-800 mb-1">Аномалии:</h5>
                                <ul className="text-sm text-red-700 space-y-1">
                                  {finding.additional_info.anomalies.map((anomaly: any, idx: number) => (
                                    <li key={idx}>
                                      {anomaly.column}: {anomaly.count} аномалий ({anomaly.percentage?.toFixed(1)}%)
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Детальные результаты недоступны</p>
                  </div>
                )}
              </div>
            )}

            {/* Insights Tab */}
            {activeTab === 'insights' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Ключевые инсайты</h2>
                
                {/* Insights from findings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Паттерны данных
                    </h3>
                    <ul className="text-blue-800 space-y-2 text-sm">
                      <li>• Данные загружены полностью в память для быстрого анализа</li>
                      <li>• Обнаружены связи между таблицами через pandas merge</li>
                      <li>• Выполнен поиск корреляций и аномалий</li>
                      <li>• Создана оптимизированная структура для анализа</li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Технические инсайты
                    </h3>
                    <ul className="text-green-800 space-y-2 text-sm">
                      <li>• DataFrame подход устранил проблемы с SQL</li>
                      <li>• Все операции выполнены через pandas API</li>
                      <li>• Гарантированные результаты без пустых ответов</li>
                      <li>• Сохранены все реляционные связи</li>
                    </ul>
                  </div>
                </div>

                {/* Relations visualization */}
                {results.relations_info && results.relations_info.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Схема связей</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="space-y-2">
                        {results.relations_info.map((relation: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-4 text-sm">
                            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-medium">
                              {relation.from_table}
                            </div>
                            <div className="text-gray-400">→</div>
                            <div className="bg-green-100 text-green-800 px-3 py-1 rounded font-medium">
                              {relation.to_table}
                            </div>
                            <div className="text-gray-600 text-xs">
                              ({relation.from_column} → {relation.to_column})
                            </div>
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
                <h2 className="text-2xl font-bold text-gray-900">Рекомендации</h2>
                
                {results.recommendations && results.recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {results.recommendations.map((recommendation, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 flex items-start gap-4">
                        <div className="bg-yellow-100 text-yellow-600 rounded-full p-2 flex-shrink-0">
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
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

                {/* General DataFrame recommendations */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Общие рекомендации по DataFrame-анализу</h3>
                  <ul className="text-blue-800 space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Регулярно обновляйте DataFrame-анализ для отслеживания изменений в данных</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Используйте найденные корреляции для создания предиктивных моделей</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Настройте мониторинг аномалий для раннего обнаружения проблем</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Создайте дашборды на основе выявленных ключевых метрик</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
