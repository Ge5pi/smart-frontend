import React, { useState, useEffect, useRef} from 'react';
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
    sample_count?: number;
    feature_count?: number;
    sizes?: Record<string, number>;
    cluster_profiles?: Record<string, Record<string, number>>;
    important_features?: string[];
    gpt_summary?: string;
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

function splitByH2(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const sections: { id: string; title: string; content: string }[] = [];
  let current: { id: string; title: string; content: string } | null = null;

  const slug = (s: string) =>
    s.toLowerCase().trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-');

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      if (current) sections.push(current);
      const title = h2[1].trim();
      current = { id: slug(title), title, content: '' };
    } else {
      if (!current) {
        // До первого ## — считаем как часть “Общий обзор”
        current = { id: 'obshchiy-obzor', title: 'Общий обзор', content: '' };
      }
      current.content += (current.content ? '\n' : '') + line;
    }
  }
  if (current) sections.push(current);
  return sections;
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

const CollapsibleSection: React.FC<{
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  summaryRight?: ReactNode;
}> = ({ title, icon, children, defaultOpen = false, summaryRight }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="mb-8">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center cursor-pointer mb-4 pb-2 border-b select-none"
      >
        <h2 className="flex items-center text-2xl font-semibold text-gray-800">
          {icon}
          <span className="ml-1">{title}</span>
        </h2>
        <div className="flex items-center gap-3">
          {summaryRight}
          <ChevronDown
            className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
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

        {results.overall_summary && (() => {
          const sections = splitByH2(results.overall_summary);
          const [openMap, setOpenMap] = React.useState<Record<string, boolean>>(
            () => Object.fromEntries(sections.map(s => [s.id, false])) // все подразделы свернуты
          );

          const hasTrends = sections.some(s => /тренд/i.test(s.title));
          const hasLinks = sections.some(s => /связ/i.test(s.title)); // “связи”
          const hasAnoms = sections.some(s => /аномал|выброс/i.test(s.title));
          const hasRisks = sections.some(s => /риск|ограничен/i.test(s.title));
          const hasChecks = sections.some(s => /провер/i.test(s.title));

          const tldr = sections.find(s => s.title.toLowerCase() === 'общий обзор');

          return (
            <CollapsibleSection
              title="Общий обзор всей базы"
              icon={<LineChart className="w-7 h-7 mr-3 text-purple-600" />}
              defaultOpen={false}
              summaryRight={
                <div className="flex gap-1 flex-wrap">
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${hasTrends?'bg-green-50 text-green-700 border-green-200':'bg-gray-50 text-gray-700 border-gray-200'}`}>Тренды</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${hasLinks?'bg-green-50 text-green-700 border-green-200':'bg-gray-50 text-gray-700 border-gray-200'}`}>Связи</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${hasAnoms?'bg-yellow-50 text-yellow-700 border-yellow-200':'bg-gray-50 text-gray-700 border-gray-200'}`}>Аномалии</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${hasRisks?'bg-red-50 text-red-700 border-red-200':'bg-gray-50 text-gray-700 border-gray-200'}`}>Риски</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${hasChecks?'bg-blue-50 text-blue-700 border-blue-200':'bg-gray-50 text-gray-700 border-gray-200'}`}>Проверки</span>
                </div>
              }
            >
              {/* Оглавление */}
              <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
                <div className="text-sm text-gray-600 font-medium mb-2">Оглавление</div>
                <div className="flex flex-wrap gap-2">
                  {sections.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        // открыть конкретный блок
                        setOpenMap(prev => ({ ...prev, [s.id]: true }));
                        // прокрутка к блоку — дадим небольшой timeout
                        setTimeout(() => {
                          const el = document.getElementById(`sec-${s.id}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 50);
                      }}
                      className="px-2 py-1 text-xs rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* TL;DR */}
              {tldr && tldr.content.trim() && (
                <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg p-3">
                  <div className="text-sm font-semibold mb-1">TL;DR</div>
                  <div className="prose prose-sm max-w-none text-indigo-900">
                    <ReactMarkdown>
                      {tldr.content.split('\n').slice(0, 6).join('\n')}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Подразделы h2 — collapsible */}
              <div className="space-y-3">
                {sections.filter(s => s.title !== 'Общий обзор').map(s => (
                  <div key={s.id} id={`sec-${s.id}`} className="bg-white border border-gray-100 rounded-md shadow-sm">
                    <button
                      onClick={() => setOpenMap(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                      className="w-full text-left px-3 py-2 flex items-center justify-between"
                    >
                      <span className="text-sm font-semibold text-gray-800">{s.title}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openMap[s.id] ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`${openMap[s.id] ? 'block' : 'hidden'} border-t px-3 py-2`}>
                      <div className="prose prose-sm max-w-none text-gray-800">
                        <ReactMarkdown>{s.content}</ReactMarkdown>
                      </div>
                    </div>

                    {/* Свернутый превью-фрагмент, если закрыт */}
                    {!openMap[s.id] && (
                      <div className="border-t px-3 py-2 text-sm text-gray-600">
                        <ReactMarkdown>
                          {
                            // показать первые 2–3 строки как превью
                            s.content.split('\n').slice(0, 3).join('\n')
                          }
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          );
        })()}

        {results.clusters && Object.keys(results.clusters).length > 0 && (() => {
          // Подсчитаем суммарное количество кластеров, если есть sizes/clusters_count
          const totalClusters = Object.values(results.clusters).reduce((acc, c) => {
            if (typeof c?.clusters_count === 'number') return acc + c.clusters_count;
            if (c?.sizes) return acc + Object.keys(c.sizes).length;
            return acc;
          }, 0);

          return (
            <CollapsibleSection
              title="Кластеризация данных"
              icon={<Database className="w-7 h-7 mr-3 text-teal-600" />}
              defaultOpen={false}
              summaryRight={totalClusters > 0 ? <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200">{totalClusters} кластеров</span> : null}
            >
              {Object.entries(results.clusters).map(([table, cluster]) => (
                <div key={table} className="bg-white p-4 rounded-lg shadow-md border border-gray-100 mb-4">
                  <h3 className="font-mono text-lg text-blue-700 mb-3">{table}</h3>

                  {cluster.error && <p className="text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">{cluster.error}</p>}
                  {cluster.message && <p className="text-blue-800 bg-blue-50 border border-blue-200 rounded px-3 py-2 mb-2">{cluster.message}</p>}

                  {cluster.sizes && Object.keys(cluster.sizes).length > 0 && (
                    <>
                      <p className="font-semibold mb-2">Размеры кластеров</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                        {Object.entries(cluster.sizes).map(([id, size]) => (
                          <div key={id} className="flex justify-between border rounded px-3 py-2 bg-gray-50">
                            <span className="text-gray-600">Кластер {id}</span>
                            <span className="font-mono">{size}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {cluster.important_features && cluster.important_features.length > 0 && (
                    <>
                      <p className="font-semibold mt-3 mb-2">Важные признаки</p>
                      <div className="flex flex-wrap gap-2">
                        {cluster.important_features.map((f, i) => (
                          <span key={i} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                            {f}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {cluster.cluster_profiles && Object.keys(cluster.cluster_profiles).length > 0 && (
                    <>
                      <p className="font-semibold mt-3 mb-2">Профили кластеров (средние значения признаков)</p>
                      {/* Таблицу оставляем как есть */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border border-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 border">Признак</th>
                              {Object.keys(cluster.cluster_profiles || {}).map(cid => (
                                <th key={cid} className="px-4 py-2 border">Кластер {cid}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const firstClusterKey = Object.keys(cluster.cluster_profiles || {})[0];
                              const firstCluster = firstClusterKey ? cluster.cluster_profiles?.[firstClusterKey] : undefined;
                              return Object.keys(firstCluster || {}).map(feature => (
                                <tr key={feature}>
                                  <td className="px-4 py-2 border">{feature}</td>
                                  {Object.keys(cluster.cluster_profiles || {}).map(cid => (
                                    <td key={cid} className="px-4 py-2 border">
                                      {cluster.cluster_profiles?.[cid]?.[feature]}
                                    </td>
                                  ))}
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {cluster.gpt_summary && (
                    <>
                      <p className="font-semibold mt-3 mb-1">Интерпретация кластеров</p>
                      <div className="prose prose-sm max-w-none text-gray-800">
                        <ReactMarkdown>{cluster.gpt_summary}</ReactMarkdown>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </CollapsibleSection>
          );
        })()}
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