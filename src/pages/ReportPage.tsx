import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Database,
  BarChart3
} from 'lucide-react';

interface Report {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  results: {
    error?: string;
    details?: string;
    insights?: Array<{
      type: string;
      message: string;
      correlation_data?: Record<string, number>;
    }>;
  };
}

const ReportPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!reportId) {
        setError('Отчет не найден.');
        setLoading(false);
        return;
      }

      try {
        const response = await getReport(reportId);
        setReport(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Произошла ошибка при загрузке отчета.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Завершен';
      case 'failed': return 'Ошибка';
      case 'pending': return 'Обработка';
      default: return 'Неизвестно';
    }
  };

  const renderCorrelationTable = (correlationData: Record<string, number>) => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Столбец
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Корреляция
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Уровень
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(correlationData).map(([column, correlation]) => {
              const level = Math.abs(correlation) > 0.7 ? 'Высокий' :
                          Math.abs(correlation) > 0.4 ? 'Средний' : 'Низкий';
              const levelColor = Math.abs(correlation) > 0.7 ? 'text-red-600' :
                               Math.abs(correlation) > 0.4 ? 'text-yellow-600' : 'text-green-600';

              return (
                <tr key={column}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {column}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {correlation.toFixed(4)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${levelColor}`}>
                    {level}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderInsights = () => {
    if (!report?.results.insights || report.results.insights.length === 0) {
      return null;
    }

    return (
      <div className="space-y-4">
        {report.results.insights.map((insight, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Insight #{index + 1}
                </h3>
                <p className="text-gray-700 mb-4">{insight.message}</p>

                {insight.correlation_data && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Корреляционный анализ
                    </h4>
                    {renderCorrelationTable(insight.correlation_data)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка отчета...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ошибка загрузки</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Отчет не найден</h2>
          <p className="text-gray-600">Отчет с ID {reportId} не существует</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Отчет анализа базы данных
                </h1>
                <p className="text-gray-600">ID: {reportId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(report.status)}
              <span className="text-sm font-medium text-gray-900">
                {getStatusText(report.status)}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            Создан: {new Date(report.created_at).toLocaleString('ru-RU')}
          </div>
        </div>

        {/* Error Section */}
        {report.results.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-red-800 mb-2">Ошибка анализа</h3>
                <p className="text-red-700 mb-2">{report.results.error}</p>
                {report.results.details && (
                  <div className="bg-red-100 rounded p-3 mt-3">
                    <p className="text-sm text-red-800">
                      <strong>Детали:</strong> {report.results.details}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Insights Section */}
        {report.status === 'completed' && !report.results.error && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-indigo-600" />
              Результаты анализа
            </h2>
            {renderInsights()}
          </div>
        )}

        {/* Empty State */}
        {report.status === 'completed' && !report.results.error &&
         (!report.results.insights || report.results.insights.length === 0) && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет данных для отображения</h3>
            <p className="text-gray-600">Анализ завершен, но результаты отсутствуют</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;