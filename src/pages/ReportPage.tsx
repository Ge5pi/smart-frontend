import React, { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { getReport, type EnhancedReport } from '../api';
import { Link, Database, BarChart2, ChevronDown, PieChart, LineChart, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

// --- Хук загрузки отчёта ---
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
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = window.setInterval(fetchReport, 5000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [reportId]);

    return { report, loading, error };
};

// --- UI-компоненты ---
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
    const pairs = Object.entries(correlations).flatMap(([col, data]) =>
        Object.entries(data).map(([withCol, coef]) => ({
            id: `${col}-${withCol}`,
            col,
            withCol,
            coef,
        }))
    );
    if (pairs.length === 0) return <p className="text-sm text-gray-500 italic mt-2">Нет данных о корреляции.</p>;
    return (
        <div className="overflow-x-auto mt-4">
            <table className="min-w-full bg-white border border-gray-200 rounded-md">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Столбец</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Коррелирует с</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Коэффициент</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {pairs.map(({ id, col, withCol, coef }) => (
                        <tr key={id}>
                            <td className="px-4 py-3">{col}</td>
                            <td className="px-4 py-3">{withCol}</td>
                            <td className="px-4 py-3 text-right">{coef !== null ? coef.toFixed(4) : 'N/A'}</td>
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
            <div onClick={() => setIsOpen(!isOpen)} className="flex justify-between items-center cursor-pointer select-none">
                <h3 className="flex items-center text-lg font-semibold text-gray-800">
                    {icon}
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-blue-600 ml-2">{title}</span>
                </h3>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="mt-4 pt-4 border-t text-gray-700">
                    <div className="prose prose-sm max-w-none mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.insight}</ReactMarkdown>
                    </div>
                    <CorrelationTable correlations={result.correlations || {}} />
                </div>
            )}
        </div>
    );
};

const CollapsibleSection: React.FC<{ title: string; icon: ReactNode; children: ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <section>
            <div onClick={() => setIsOpen(!isOpen)} className="flex justify-between items-center cursor-pointer mb-4 pb-2 border-b select-none">
                <h2 className="flex items-center text-2xl font-semibold text-gray-800">
                    {icon}
                    {title}
                </h2>
                <ChevronDown className={`w-6 h-6 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && <div className="space-y-6">{children}</div>}
        </section>
    );
};

const ReportResultsView: React.FC<{ results: SuccessReportResults }> = ({ results }) => (
    <div className="space-y-12">
        <CollapsibleSection title="Анализ по таблицам" icon={<Database className="w-7 h-7 mr-3 text-blue-600" />}>
            {Object.entries(results.single_table_insights).map(([table, result]) => (
                <AnalysisCard key={table} title={table} result={result} icon={<BarChart2 className="w-5 h-5 text-gray-500" />} />
            ))}
        </CollapsibleSection>

        {Object.keys(results.joint_table_insights).length > 0 && (
            <CollapsibleSection title="Анализ межтабличных связей (JOINs)" icon={<Link className="w-7 h-7 mr-3 text-green-600" />}>
                {Object.entries(results.joint_table_insights).map(([joinKey, result]) => (
                    <AnalysisCard key={joinKey} title={joinKey} result={result} icon={<Link className="w-5 h-5 text-gray-500" />} />
                ))}
            </CollapsibleSection>
        )}

        {results.overall_summary && (
            <CollapsibleSection title="Общий обзор всей базы" icon={<LineChart className="w-7 h-7 mr-3 text-purple-600" />}>
                <div className="bg-gray-50 p-4 rounded-lg prose prose-sm max-w-none text-gray-800 border border-gray-200 shadow-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{results.overall_summary}</ReactMarkdown>
                </div>
            </CollapsibleSection>
        )}

        {results.hypotheses && Object.keys(results.hypotheses).length > 0 && (
            <CollapsibleSection title="Гипотезы и результаты проверки" icon={<BarChart2 className="w-7 h-7 mr-3 text-indigo-600" />}>
                {Object.entries(results.hypotheses).map(([table, hyps]) => (
                    <div key={table} className="bg-white p-4 rounded-lg shadow-md border border-gray-100 mb-4">
                        <h3 className="font-mono text-lg text-blue-700 mb-2">{table}</h3>
                        {hyps.length === 0 && <p className="text-gray-500 text-sm">Нет гипотез для этой таблицы.</p>}
                        {hyps.map((h, idx) => (
                            <div key={idx} className="mb-4 border-b pb-2">
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 prose prose-sm text-gray-800 mb-2">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{h.hypothesis}</ReactMarkdown>
                                </div>
                                <p className="text-sm text-gray-600">Тест: {h.test}, Колонки: {h.columns.join(', ')}</p>
                                <p className={`text-sm font-bold ${h.result === 'подтверждена' ? 'text-green-600' : h.result === 'опровергнута' ? 'text-red-600' : 'text-gray-500'}`}>
                                    Результат: {h.result} {h.p_value !== null && `(p = ${h.p_value})`}
                                </p>
                                {h.explanation && <p className="text-sm text-gray-700 mt-1">{h.explanation}</p>}
                            </div>
                        ))}
                    </div>
                ))}
            </CollapsibleSection>
        )}

        {results.clusters && Object.keys(results.clusters).length > 0 && (
            <CollapsibleSection title="Кластеризация данных" icon={<Database className="w-7 h-7 mr-3 text-teal-600" />}>
                {Object.entries(results.clusters).map(([table, cluster]) => (
                    <div key={table} className="bg-white p-4 rounded-lg shadow-md border border-gray-100 mb-4">
                        <h3 className="font-mono text-lg text-blue-700 mb-3">{table}</h3>
                        {cluster.error && <p className="text-red-600">{cluster.error}</p>}
                        {cluster.message && <p className="text-gray-600">{cluster.message}</p>}

                        {cluster.sizes && (
                            <>
                                <p className="font-semibold mb-2">Размеры кластеров:</p>
                                <ul className="list-disc pl-5 text-sm text-gray-700">
                                    {Object.entries(cluster.sizes).map(([id, size]) => (
                                        <li key={id}>Кластер {id}: {size} записей</li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {cluster.important_features && (
                            <>
                                <p className="font-semibold mt-3 mb-1">Важные признаки:</p>
                                <p className="text-sm text-gray-700">{cluster.important_features.join(", ")}</p>
                            </>
                        )}

                        {cluster.cluster_profiles && Object.keys(cluster.cluster_profiles).length > 0 && (
                            <>
                                <p className="font-semibold mt-3 mb-2">Профили кластеров (средние значения признаков):</p>
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
                                                const firstKey = Object.keys(cluster.cluster_profiles || {})[0];
                                                const firstCluster = firstKey ? cluster.cluster_profiles?.[firstKey] : undefined;
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
                                <p className="font-semibold mt-3 mb-1">Интерпретация кластеров:</p>
                                <div className="bg-gray-50 p-4 rounded-lg prose prose-sm max-w-none text-gray-800 border border-gray-200 shadow-sm">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{cluster.gpt_summary}</ReactMarkdown>
                                </div>
                            </>
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
            {Object.entries(visualizations).map(([sourceName, urls]) => (
                <div key={sourceName}>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">
                        Графики для: <span className="font-mono text-blue-600">{sourceName}</span>
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {urls.map((url, i) => (
                            <div key={i} className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 flex flex-col items-center">
                                <img src={url} alt={`График ${i + 1}`} className="w-full h-auto rounded" />
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
        const response = await fetch(`${API_URL}/analytics/database/reports/${reportId}/pdf`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(await response.text());
        const blob = await response.blob();
        if (blob.size === 0) throw new Error('Получен пустой файл отчета');
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error: any) {
        alert(`Ошибка при скачивании PDF: ${error.message}`);
    }
};

const ReportHeader: React.FC<{ report: EnhancedReport }> = ({ report }) => (
    <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Отчет #{report.id}</h1>
                <p className="text-sm text-gray-500 mt-1">Создан: {new Date(report.created_at).toLocaleString('ru-RU')}</p>
                <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        report.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : report.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`}>
                        {report.status === 'completed' ? 'Завершен' : report.status === 'failed' ? 'Ошибка' : 'В процессе'}
                    </span>
                </div>
            </div>
            {report.status === 'completed' && (
                <button
                    onClick={() => downloadPDF(report.id)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                >
                    <Download className="w-5 h-5 mr-2" /> Скачать PDF
                </button>
            )}
        </div>
    </div>
);

const ReportPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { report, loading, error } = useReport(id);

    if (loading) return <LoadingSpinner />;
    if (error) return <Alert message={error} type="error" />;
    if (!report) return <Alert message="Отчет не найден." type="error" />;

    const results: SuccessReportResults | null = report.results as any;

    return (
        <div className="min-h-screen bg-gray-50">
            <ReportHeader report={report} />
            <main className="max-w-7xl mx-auto px-6 py-8 space-y-12">
                {report.status === 'completed' && results && (
                    <>
                        <ReportResultsView results={results} />
                        <ChartsView visualizations={results.visualizations} />
                    </>
                )}
                {report.status !== 'completed' && (
                    <Alert message="Отчет еще в процессе генерации. Пожалуйста, подождите." type="info" />
                )}
            </main>
        </div>
    );
};

export default ReportPage;
