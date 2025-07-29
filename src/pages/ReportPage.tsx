import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { getReport, type EnhancedReport } from '../api';
import { Link, Database, BarChart2, ChevronDown, PieChart, LineChart } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- Типы ---
type CorrelationsForTable = Record<string, Record<string, number | null>>;
interface AnalysisResult {
    insight: string;
    correlations: CorrelationsForTable;
}
interface SuccessReportResults {
    single_table_insights: Record<string, AnalysisResult>;
    joint_table_insights: Record<string, AnalysisResult>;
    visualizations: Record<string, string[]>;
}


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
      } catch (err: any)        {
        setError(err.response?.data?.detail || 'Произошла ошибка при загрузке отчета.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [reportId]);

  return { report, loading, error };
};

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

const AnalysisCard: React.FC<{ title: string; result: AnalysisResult; icon: React.ReactNode }> = ({ title, result, icon }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center cursor-pointer select-none"
            >
                <h3 className="flex items-center text-lg font-semibold text-gray-800">
                    {icon}
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-blue-600 ml-2">{title}</span>
                </h3>
                <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </div>
            {isOpen && (
                <div className="mt-4 pt-4 border-t text-gray-700">
                    <div className="prose prose-sm max-w-none mb-4">
                       <ReactMarkdown>{result.insight}</ReactMarkdown>
                    </div>
                    <CorrelationTable correlations={result.correlations || {}} />
                </div>
            )}
        </div>
    );
};

const CollapsibleSection: React.FC<{ title: string; icon: ReactNode; children: ReactNode; defaultOpen?: boolean; }> = ({ title, icon, children, defaultOpen = true }) => {
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

const ReportResultsView: React.FC<{ results: SuccessReportResults }> = ({ results }) => (
    <div className="space-y-12">
        <CollapsibleSection
            title="Анализ по таблицам"
            icon={<Database className="w-7 h-7 mr-3 text-blue-600"/>}
        >
            {Object.entries(results.single_table_insights).map(([table, result]) => (
                <AnalysisCard key={table} title={table} result={result} icon={<BarChart2 className="w-5 h-5 text-gray-500"/>} />
            ))}
        </CollapsibleSection>

        {Object.keys(results.joint_table_insights).length > 0 && (
            <CollapsibleSection
                title="Анализ межтабличных связей (JOINs)"
                icon={<Link className="w-7 h-7 mr-3 text-green-600"/>}
            >
                {Object.entries(results.joint_table_insights).map(([joinKey, result]) => (
                    <AnalysisCard key={joinKey} title={joinKey} result={result} icon={<Link className="w-5 h-5 text-gray-500"/>} />
                ))}
            </CollapsibleSection>
        )}
    </div>
);

const ChartsView: React.FC<{ visualizations: Record<string, string[]> | undefined }> = ({ visualizations }) => {
    if (!visualizations || Object.keys(visualizations).length === 0) {
        return <Alert message="Для этого отчета не было сгенерировано графиков." type="info" />;
    }

    return (
        <div className="space-y-12">
            {Object.entries(visualizations).map(([sourceName, chartUrls]) => (
                <div key={sourceName}>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">
                        Графики для: <span className="font-mono text-blue-600">{sourceName}</span>
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {chartUrls.map((url, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 flex flex-col items-center">
                                <img
                                    src={url}
                                    alt={`График для ${sourceName} #${index + 1}`}
                                    className="w-full h-auto rounded"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const ReportHeader: React.FC<{ report: EnhancedReport }> = ({ report }) => {
    return (
        <header className="mb-8 pb-4 border-b border-gray-200">
            <h1 className="text-4xl font-bold text-gray-900">Отчет #{report.id}</h1>
            <div className="flex items-center space-x-6 mt-2 text-base text-gray-500">
                <span>Статус: <span className="font-semibold text-gray-800 capitalize">{report.status}</span></span>
                <span>Создан: <span className="font-semibold text-gray-800">{new Date(report.created_at).toLocaleString('ru-RU')}</span></span>
            </div>
        </header>
    );
};

const ReportPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const { report, loading, error } = useReport(reportId);
  const [activeTab, setActiveTab] = useState<'analysis' | 'charts'>('analysis');

  const renderContent = () => {
    if (loading) return <LoadingSpinner />;
    if (error) return <Alert message={error} type="error" />;
    if (!report) return <Alert message="Отчет не найден или пуст." type="info" />;

    const results = report.results as SuccessReportResults | null;
    const hasVisualizations = results?.visualizations && Object.keys(results.visualizations).length > 0;

    return (
      <>
        <ReportHeader report={report} />
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`${
                activeTab === 'analysis'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <LineChart className="w-5 h-5 mr-2" />
              Анализ
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              disabled={!hasVisualizations}
              className={`${
                activeTab === 'charts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center disabled:text-gray-300 disabled:cursor-not-allowed`}
            >
              <PieChart className="w-5 h-5 mr-2" />
              Графики
            </button>
          </nav>
        </div>
        <main>
          {activeTab === 'analysis' && results && (
            <ReportResultsView results={results} />
          )}
          {activeTab === 'charts' && (
            <ChartsView visualizations={results?.visualizations} />
          )}
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