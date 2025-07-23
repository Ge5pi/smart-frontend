// ReportPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api, {EnhancedReport} from '../api';
import type { EnhancedReport } from '../api';

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
        const response = await api.get(`/analytics/reports/${reportId}`);
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

  const results = report.results as any; // Используем тип из api.ts [2]

  // Функция для рендеринга инсайтов из анализа базы данных
  const renderDatabaseInsights = () => {
    if (!results.insights || !results.correlations) return null;
    return (
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-2">Анализ базы данных</h2>
        {Object.entries(results.insights as Record<string, string>).map(([table, insight]) => (
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

  // Рендеринг основных результатов отчета (из существующих типов в api.ts)
  const renderMainReport = () => {
    if ('error' in results) {
      return (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2 text-red-600">Ошибка в отчете</h2>
          <p>{results.error}</p>
          {results.details && <p>Детали: {results.details}</p>}
        </div>
      );
    }

    if ('executive_summary' in results) {
      return (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Краткий обзор</h2>
          <p>{results.executive_summary}</p>

          <h2 className="text-xl font-bold mt-4 mb-2">Детальные находки</h2>
          {results.detailed_findings.map((finding: any, index: number) => (
            <div key={index} className="mb-4 border rounded p-4">
              <h3 className="text-lg font-semibold">{finding.question}</h3>
              <p>{finding.summary}</p>
              {finding.sql_query && <pre className="bg-gray-100 p-2 mt-2">{finding.sql_query}</pre>}
              {finding.chart_url && <img src={finding.chart_url} alt="График" className="mt-2" />}
            </div>
          ))}

          <h2 className="text-xl font-bold mt-4 mb-2">Рекомендации</h2>
          <ul className="list-disc pl-5">
            {results.recommendations.map((rec: string, index: number) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>

          {/* Другие разделы из SuccessResults */}
          <h2 className="text-xl font-bold mt-4 mb-2">Статистика анализа</h2>
          <p>Обработано вопросов: {results.analysis_stats.questions_processed}</p>
          <p>Успешных находок: {results.analysis_stats.successful_findings}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Отчет #{report.id}</h1>
      <p className="text-gray-600 mb-4">Статус: {report.status}</p>
      <p className="text-gray-600 mb-4">Создан: {new Date(report.created_at).toLocaleString()}</p>

      {renderMainReport()}
      {renderDatabaseInsights()}
    </div>
  );
};

export default ReportPage;
