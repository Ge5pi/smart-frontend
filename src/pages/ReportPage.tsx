import React, { useState, useEffect, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { getReport, type EnhancedReport } from '../api';
import { Link, Database, BarChart2, ChevronDown } from 'lucide-react';

// --- Типы ---
type CorrelationsForTable = Record<string, Record<string, number | null>>;

interface AnalysisResult {
    insight: string;
    correlations: CorrelationsForTable;
}

interface SuccessReportResults {
    single_table_insights: Record<string, AnalysisResult>;
    joint_table_insights: Record<string, AnalysisResult>;
}

// --- Кастомный хук для загрузки отчета ---
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

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-lg text-gray-600">Загрузка отчета...</span>
    </div>
);

const CorrelationTable: React.FC<{ correlations: CorrelationsForTable }> = ({ correlations }) => {
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

const AnalysisCard: React.FC<{ title: string; result: AnalysisResult; icon: React.ReactNode }> = ({ title, result, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 transition-shadow hover:shadow-lg">
        <h3 className="flex items-center text-xl font-semibold text-gray-800 mb-2">
            {icon}
            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-blue-600 ml-2">{title}</span>
        </h3>
        <p className="text-gray-700 mb-4 whitespace-pre-wrap">{result.insight}</p>
        <CorrelationTable correlations={result.correlations || {}} />
    </div>
);

/**
 * НОВЫЙ КОМПОНЕНТ: Сворачиваемая секция
 */
interface CollapsibleSectionProps {
    title: string;
    icon: ReactNode;
    children: ReactNode;
    defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <section>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center cursor-pointer mb-4 pb-2 border-b select-none"
            >
                <h2 className="flex items-center text-2xl font-semibold text-gray-800">
                    {icon}
                    {title}
                </h2>
                <ChevronDown
                    className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </div>
            {isOpen && (
                <div className="space-y-6">
                    {children}
                </div>
            )}
        </section>
    );
};

const ReportResultsView: React.FC<{ results: SuccessReportResults }> = ({ results }) => {
    const { single_table_insights, joint_table_insights } = results;

    return (
        <div className="space-y-12">
            <CollapsibleSection
                title="Анализ по таблицам"
                icon={<Database className="w-7 h-7 mr-3 text-blue-600"/>}
            >
                {Object.entries(single_table_insights).map(([table, result]) => (
                    <AnalysisCard key={table} title={table} result={result} icon={<BarChart2 className="w-5 h-5 text-gray-500"/>} />
                ))}
            </CollapsibleSection>

            {Object.keys(joint_table_insights).length > 0 && (
                <CollapsibleSection
                    title="Анализ межтабличных связей (JOINs)"
                    icon={<Link className="w-7 h-7 mr-3 text-green-600"/>}
                >
                    {Object.entries(joint_table_insights).map(([joinKey, result]) => (
                        <AnalysisCard key={joinKey} title={joinKey} result={result} icon={<Link className="w-5 h-5 text-gray-500"/>} />
                    ))}
                </CollapsibleSection>
            )}
        </div>
    );
};

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
    if (loading) return <LoadingSpinner />;
    if (error) return <Alert message={error} type="error" />;
    if (!report) return <Alert message="Отчет не найден или пуст." type="info" />;

    if (report.results && ('single_table_insights' in report.results && 'joint_table_insights' in report.results)) {
        return (
          <>
            <ReportHeader report={report} />
            <main>
              <ReportResultsView results={report.results as SuccessReportResults} />
            </main>
          </>
        );
    }

    if (report.results && 'error' in report.results) {
        const reportError = (report.results as any).error;
        const errorDetails = (report.results as any).details ? ` Детали: ${(report.results as any).details}` : '';
        return <><ReportHeader report={report} /><Alert message={`${reportError}${errorDetails}`} type="error" /></>;
    }

    return <Alert message="Отчет не содержит данных для отображения или имеет устаревший формат." type="info" />;
  };

  return (
    <div className="container mx-auto p-6 md:p-8 bg-gray-50 min-h-screen">
      {renderContent()}
    </div>
  );
};

export default ReportPage;