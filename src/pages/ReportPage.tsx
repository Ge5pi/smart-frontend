import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getReport, type EnhancedReport } from '../api';

const ReportPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<EnhancedReport | null>(null);
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

  if (loading) {
    return <div className="container mx-auto p-6">Загрузка отчета...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-6 text-red-600">{error}</div>;
  }

  if (!report || !report.results) {
    return <div className="container mx-auto p-6">Отчет не содержит данных.</div>;
  }

  // Проверяем, есть ли в отчете ошибка (согласно типам)
  if ('error' in report.results) {
      return (
        <div className="container mx-auto p-6">
            <h2 className="text-xl font-bold mb-2 text-red-600">Ошибка в отчете</h2>
            <p>{report.results.error}</p>
            {report.results.details && <p>Детали: {report.results.details}</p>}
        </div>
      );
  }

  // Типизация `results` теперь соответствует `DatabaseAnalysisResults`
  const results = report.results;

  // Функция для рендеринга инсайтов из анализа базы данных (без изменений, т.к. она соответствует бэкенду)
  const renderDatabaseInsights = () => {
    if (!results.insights || !results.correlations) return null;
    return (
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-2">Анализ базы данных</h2>
        {Object.entries(results.insights).map(([table, insight]) => (
          <div key={table} className="mb-4 border rounded p-4">
            <h3 className="text-lg font-semibold">Таблица: {table}</h3>
            <p className="text-gray-700 mb-2">{insight}</p>
            <h4 className="text-md font-medium mt-2">Корреляции:</h4>
            <table className="min-w-full border mt-2">
              <thead>
                <tr>
                  <th className="border p-2 text-left">Столбец</th>
                  <th className="border p-2 text-left">Корреляция</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(results.correlations[table] || {}).map(([col, corr]: [string, any]) => (
                  <tr key={col}>
                    <td className="border p-2">{col}</td>
                    <td className="border p-2">{JSON.stringify(corr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Отчет #{report.id}</h1>
      <p className="text-gray-600 mb-4">Статус: {report.status}</p>
      <p className="text-gray-600 mb-4">Создан: {new Date(report.created_at).toLocaleString()}</p>

      {renderDatabaseInsights()}
    </div>
  );
};

export default ReportPage;