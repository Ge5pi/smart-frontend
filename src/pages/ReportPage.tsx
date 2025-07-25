import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getReport, type EnhancedReport } from '../api';

// --- Типы ---
// Эта структура соответствует данным, которые возвращает API
type CorrelationsForTable = Record<string, Record<string, number | null>>;
type FullCorrelationsObject = Record<string, CorrelationsForTable>;

// Эта структура описывает успешный результат анализа
interface SuccessReportResults {
    insights: Record<string, string>;
    correlations: FullCorrelationsObject;
}


// --- Кастомный хук для загрузки отчета ---
/**
 * Хук для инкапсуляции логики получения отчета по его ID.
 * @param reportId - ID отчета для загрузки.
 */
const useReport = (reportId: string | undefined) => {
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

      setLoading(true);
      setError(null);

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

  return { report, loading, error };
};


// --- UI Компоненты ---
/**
 * Компонент для отображения состояний загрузки, ошибок и информационных сообщений.
 */
const Alert: React.FC<{ message: string; type: 'error' | 'info' }> = ({ message, type }) => {
  const baseClasses = 'p-4 rounded-lg border';
  const typeClasses = {
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
      <p className="font-semibold">{type === 'error' ? 'Ошибка' : 'Информация'}</p>
      <p>{message}</p>
    </div>
  );
};

/**
 * Компонент для отображения анимированного спиннера загрузки.
 */
const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-16">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    <span className="ml-4 text-lg text-gray-600">Загрузка отчета...</span>
  </div>
);

/**
 * Компонент для отображения таблицы с данными о корреляции.
 */
const CorrelationTable: React.FC<{ correlations: CorrelationsForTable }> = ({ correlations }) => {
    // Преобразуем вложенную структуру в плоский список для удобного рендеринга
    const correlationPairs = Object.entries(correlations).flatMap(([columnName, correlationData]) =>
        Object.entries(correlationData).map(([withColumn, coefficient]) => ({
            id: `${columnName}-${withColumn}`,
            columnName,
            withColumn,
            coefficient,
        }))
    );

    if (correlationPairs.length === 0) {
        return <p className="text-sm text-gray-500 italic mt-2">Нет данных о корреляции.</p>;
    }

    return (
        <div className="overflow-x-auto mt-4">
            <table className="min-w-full bg-white border border-gray-200 rounded-md">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Столбец</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Коррелирует с</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Коэффициент</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {correlationPairs.map(({ id, columnName, withColumn, coefficient }) => (
                        <tr key={id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{columnName}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{withColumn}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right font-mono">
                                {coefficient !== null ? coefficient.toFixed(4) : 'N/A'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

/**
 * Компонент для отображения анализа базы данных.
 */
const DatabaseInsightsView: React.FC<{ results: SuccessReportResults }> = ({ results }) => {
    if (!results.insights) {
        return <Alert message="В отчете отсутствуют данные анализа." type="info" />;
    }
    return (
        <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Анализ базы данных 📈</h2>
            <div className="space-y-6">
                {Object.entries(results.insights).map(([table, insight]) => (
                    <div key={table} className="bg-white p-6 rounded-lg shadow-md border border-gray-100 transition-shadow hover:shadow-lg">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            Таблица: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-blue-600">{table}</span>
                        </h3>
                        <p className="text-gray-700 mb-4">{insight}</p>
                        <CorrelationTable correlations={results.correlations?.[table] || {}} />
                    </div>
                ))}
            </div>
        </section>
    );
};

/**
 * Компонент для шапки отчета.
 */
const ReportHeader: React.FC<{ report: EnhancedReport }> = ({ report }) => (
    <header className="mb-8 pb-4 border-b border-gray-200">
        <h1 className="text-4xl font-bold text-gray-900">Отчет #{report.id}</h1>
        <div className="flex items-center space-x-6 mt-2 text-base text-gray-500">
            <span>Статус: <span className="font-semibold text-gray-800 capitalize">{report.status}</span></span>
            <span>Создан: <span className="font-semibold text-gray-800">{new Date(report.created_at).toLocaleString('ru-RU')}</span></span>
        </div>
    </header>
);


// --- Основной компонент страницы ---
const ReportPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const { report, loading, error } = useReport(reportId);

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    if (error) {
      return <Alert message={error} type="error" />;
    }

    if (!report || !report.results) {
      return <Alert message="Отчет не содержит данных для отображения." type="info" />;
    }

    if ('error' in report.results) {
        const reportError = report.results.error;
        const errorDetails = report.results.details ? ` Детали: ${report.results.details}` : '';
        return (
            <>
                <ReportHeader report={report} />
                <Alert message={`${reportError}${errorDetails}`} type="error" />
            </>
        );
    }
    return (
      <>
        <ReportHeader report={report} />
        <main>
          <DatabaseInsightsView results={report.results as SuccessReportResults} />
        </main>
      </>
    );
  };

  return (
    <div className="container mx-auto p-6 md:p-8 bg-gray-50 min-h-screen">
      {renderContent()}
    </div>
  );
};

export default ReportPage;