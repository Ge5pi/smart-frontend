import React, { useState, useEffect, useRef} from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { getReport, type EnhancedReport } from '../api';
import { Link, Database, BarChart2, ChevronDown, PieChart, LineChart, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { API_URL } from '../api';
// --- Типы ---
type CorrelationsForTable = Record<string, Record<string, number | null>>;
interface AnalysisResult {
    insight: string;
    correlations: CorrelationsForTable;
}
interface HypothesisResult {
    hypothesis: string;
    test: string;
    columns: string[];
    p_value: number | null;
    result: string;
    explanation: string;
}

interface ClusterResult {
    clusters_count?: number;
    feature_count?: number;
    sample_count?: number;
    cluster_centers?: number[][];
    message?: string;
    error?: string;
}

interface SuccessReportResults {
    single_table_insights: Record<string, AnalysisResult>;
    joint_table_insights: Record<string, AnalysisResult>;
    visualizations: Record<string, string[]>;
    overall_summary?: string;
    hypotheses?: Record<string, HypothesisResult[]>;
    clusters?: Record<string, ClusterResult>;
}


const useReport = (reportId: string | undefined) => {
  const [report, setReport] = useState<EnhancedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null); // Use useRef for the interval ID

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

        // If report is completed or failed, stop polling
        if (response.data.status === 'completed' || response.data.status === 'failed') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setLoading(false); // Stop loading when final status is reached
        } else {
            // Keep loading indicator if still processing/queued
            setLoading(true);
        }

      } catch (err: any) {
        setError(err.response?.data?.detail || 'Произошла ошибка при загрузке отчета.');
        if (intervalRef.current) {
            clearInterval(intervalRef.current); // Stop polling on error
            intervalRef.current = null;
        }
        setLoading(false); // Stop loading on error
      }
    };

    // Initial fetch
    fetchReport();

    // Set up polling
    if (reportId) {
      // Clear any existing interval to prevent multiple intervals
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Poll every 5 seconds (adjust as needed)
      intervalRef.current = window.setInterval(fetchReport, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [reportId]);

  useEffect(() => {
      if (report && (report.status === 'completed' || report.status === 'failed')) {
          setLoading(false);
      } else if (report) {
          setLoading(true);
      }
  }, [report]);

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

        {results.overall_summary && (
            <CollapsibleSection
                title="Общий обзор всей базы"
                icon={<LineChart className="w-7 h-7 mr-3 text-purple-600" />}
            >
                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100 prose prose-sm max-w-none">
                    <ReactMarkdown>{results.overall_summary}</ReactMarkdown>
                </div>
            </CollapsibleSection>
        )}

        {results.hypotheses && Object.keys(results.hypotheses).length > 0 && (
            <CollapsibleSection
                title="Гипотезы и результаты проверки"
                icon={<BarChart2 className="w-7 h-7 mr-3 text-indigo-600" />}
            >
                {Object.entries(results.hypotheses).map(([table, hyps]) => (
                    <div key={table} className="bg-white p-4 rounded-lg shadow-md border border-gray-100 mb-4">
                        <h3 className="font-mono text-lg text-blue-700 mb-2">{table}</h3>
                        {hyps.length === 0 && <p className="text-gray-500 text-sm">Нет гипотез для этой таблицы.</p>}
                        {hyps.map((h, idx) => (
                            <div key={idx} className="mb-4 border-b pb-2">
                                <p className="font-semibold">{h.hypothesis}</p>
                                <p className="text-sm text-gray-600">Тест: {h.test}, Колонки: {h.columns.join(', ')}</p>
                                <p className={`text-sm font-bold ${h.result === 'подтверждена' ? 'text-green-600' : h.result === 'опровергнута' ? 'text-red-600' : 'text-gray-500'}`}>
                                    Результат: {h.result} {h.p_value !== null && `(p = ${h.p_value})`}
                                </p>
                                {h.explanation && (
                                    <p className="text-sm text-gray-700 mt-1">{h.explanation}</p>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </CollapsibleSection>
        )}

        {results.clusters && Object.keys(results.clusters).length > 0 && (
            <CollapsibleSection
                title="Кластеризация данных"
                icon={<Database className="w-7 h-7 mr-3 text-teal-600" />}
            >
                {Object.entries(results.clusters).map(([table, cluster]) => (
                    <div key={table} className="bg-white p-4 rounded-lg shadow-md border border-gray-100 mb-4">
                        <h3 className="font-mono text-lg text-blue-700 mb-2">{table}</h3>
                        {cluster.error && <p className="text-red-600">{cluster.error}</p>}
                        {cluster.message && <p className="text-gray-600">{cluster.message}</p>}
                        {cluster.clusters_count && (
                            <ul className="text-sm text-gray-700 list-disc pl-5">
                                <li>Число кластеров: {cluster.clusters_count}</li>
                                <li>Число признаков: {cluster.feature_count}</li>
                                <li>Число объектов: {cluster.sample_count}</li>
                            </ul>
                        )}
                    </div>
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

const downloadPDF = async (reportId: number) => {
  try {
    const token = localStorage.getItem('authToken');
    // ИЗМЕНЕНИЕ: Используйте полный API_URL для запроса PDF
    const response = await fetch(`${API_URL}/analytics/database/reports/${reportId}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Ошибка сервера:', errorData);
      throw new Error(`HTTP ${response.status}: ${response.statusText}. Детали: ${errorData}`);
    }

    // Проверяем Content-Type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/pdf')) {
      throw new Error('Сервер вернул не PDF файл (ожидался application/pdf)');
    }

    const blob = await response.blob();

    // Проверяем размер blob
    if (blob.size === 0) {
      throw new Error('Получен пустой файл отчета');
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${reportId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

  } catch (error: unknown) {
      if (error instanceof Error) {
        alert(`Произошла ошибка при скачивании PDF отчета: ${error.message}`);
      } else {
        alert(`Произошла неизвестная ошибка при скачивании PDF отчета: ${String(error)}`);
      }
    }
};

const ReportHeader: React.FC<{ report: EnhancedReport }> = ({ report }) => {
  const handleDownloadPDF = () => {
    downloadPDF(report.id);
  };

  return (
    <div className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Отчет #{report.id}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Создан: {new Date(report.created_at).toLocaleString('ru-RU')}
          </p>
          <div className="mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              report.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : report.status === 'failed'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {report.status === 'completed' ? 'Завершен' :
               report.status === 'failed' ? 'Ошибка' :
               report.status === 'processing' ? 'Обработка' : 'В очереди'}
            </span>
          </div>
        </div>

        {report.status === 'completed' && (
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Скачать PDF
          </button>
        )}
      </div>
    </div>
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