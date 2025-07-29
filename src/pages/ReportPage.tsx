import React, { useState, useEffect, useRef} from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { getReport, type EnhancedReport } from '../api';
import { Link, Database, BarChart2, ChevronDown, PieChart, LineChart, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- Типы ---
type CorrelationsForTable = Record<string, Record<string, number>>;

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
  const intervalRef = useRef<number | null>(null);

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

        if (response.data.status === 'completed' || response.data.status === 'failed') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setLoading(false);
        } else {
          setLoading(true);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Произошла ошибка при загрузке отчета.');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setLoading(false);
      }
    };

    fetchReport();

    if (reportId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
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
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <div className="font-medium mb-1">
        {type === 'error' ? 'Ошибка' : 'Информация'}
      </div>
      <div>{message}</div>
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
    <span>Загрузка отчета...</span>
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
    return <div className="text-gray-500 italic">Нет данных о корреляции.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Столбец
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Коррелирует с
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Коэффициент
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {correlationPairs.map(({ id, columnName, withColumn, coefficient }) => (
            <tr key={id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {columnName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {withColumn}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center cursor-pointer select-none p-4 hover:bg-gray-50"
      >
        <div className="flex items-center">
          {icon}
          <h3 className="ml-2 text-lg font-medium text-gray-900">{title}</h3>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="prose max-w-none mt-4">
            <ReactMarkdown>{result.insight}</ReactMarkdown>
          </div>
          <div className="mt-4">
            <CorrelationTable correlations={result.correlations} />
          </div>
        </div>
      )}
    </div>
  );
};

const CollapsibleSection: React.FC<{
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}> = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-6">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center cursor-pointer mb-4 pb-2 border-b select-none"
      >
        <div className="flex items-center">
          {icon}
          <h2 className="ml-2 text-xl font-semibold text-gray-900">{title}</h2>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div>
          {children}
        </div>
      )}
    </div>
  );
};

const ReportResultsView: React.FC<{ results: SuccessReportResults }> = ({ results }) => (
  <div className="space-y-6">
    <CollapsibleSection title="Анализ отдельных таблиц" icon={<Database className="w-5 h-5" />}>
      {Object.entries(results.single_table_insights).map(([table, result]) => (
        <AnalysisCard key={table} title={`Таблица: ${table}`} result={result} icon={<Database className="w-5 h-5" />} />
      ))}
    </CollapsibleSection>

    {Object.keys(results.joint_table_insights).length > 0 && (
      <CollapsibleSection title="Анализ связей между таблицами" icon={<Link className="w-5 h-5" />}>
        {Object.entries(results.joint_table_insights).map(([joinKey, result]) => (
          <AnalysisCard key={joinKey} title={`Связь: ${joinKey}`} result={result} icon={<Link className="w-5 h-5" />} />
        ))}
      </CollapsibleSection>
    )}
  </div>
);

const ChartsView: React.FC<{ visualizations: Record<string, string[]> | undefined }> = ({ visualizations }) => {
  if (!visualizations || Object.keys(visualizations).length === 0) {
    return <div className="text-center text-gray-500 py-8">Нет доступных графиков</div>;
  }

  return (
    <div className="space-y-6">
      {Object.entries(visualizations).map(([sourceName, chartUrls]) => (
        <div key={sourceName} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Графики для: {sourceName}</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {chartUrls.map((url, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={url}
                  alt={`График ${index + 1} для ${sourceName}`}
                  className="w-full h-auto"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Функция для скачивания PDF
const downloadPDF = async (reportId: number) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/analytics/database/reports/${reportId}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Ошибка при скачивании PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${reportId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Ошибка при скачивании PDF:', error);
    // Можно добавить toast уведомление об ошибке
    alert('Произошла ошибка при скачивании PDF отчета');
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
    if (!report) return <Alert message="Отчет не найден" type="error" />;

    const results = report.results as SuccessReportResults | null;
    const hasVisualizations = results?.visualizations && Object.keys(results.visualizations).length > 0;

    return (
      <>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`${
                activeTab === 'analysis'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
            >
              <BarChart2 className="w-4 h-4 mr-2" />
              Анализ
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              disabled={!hasVisualizations}
              className={`${
                activeTab === 'charts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center disabled:text-gray-300 disabled:cursor-not-allowed transition-colors`}
            >
              <PieChart className="w-4 h-4 mr-2" />
              Графики
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'analysis' && results && (
            <ReportResultsView results={results} />
          )}
          {activeTab === 'charts' && (
            <ChartsView visualizations={results?.visualizations} />
          )}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {report && <ReportHeader report={report} />}
      {renderContent()}
    </div>
  );
};

export default ReportPage;
