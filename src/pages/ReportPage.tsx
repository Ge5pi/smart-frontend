// src/pages/ReportPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { FileText, BarChart2, AlertTriangle, Loader, CheckCircle } from 'lucide-react';
import api from '../api';

// Типы для данных отчета
type ReportSection = {
    title: string;
    narrative: string;
    chart_url: string | null;
    data_preview: any[];
};

type ReportData = {
    title: string;
    sections: ReportSection[];
};

// Компонент страницы
const ReportPage = () => {
    // Получаем ID из URL
    const { reportId, taskId } = useParams<{ reportId: string, taskId: string }>();

    // Состояния
    const [status, setStatus] = useState('IN_PROGRESS');
    const [message, setMessage] = useState('Инициализация анализа...');
    const [report, setReport] = useState<ReportData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Главный эффект для опроса статуса
    useEffect(() => {
        if (!taskId || !reportId || status === 'COMPLETED' || status === 'FAILED') {
            return;
        }

        const pollInterval = setInterval(async () => {
            try {
                const response = await api.get(`/analytics/reports/status/${taskId}`);
                const taskResult = response.data;

                if (taskResult.info?.status) {
                    setMessage(taskResult.info.status);
                }

                if (taskResult.status === 'SUCCESS') {
                    setStatus('COMPLETED');
                    clearInterval(pollInterval);
                    const reportResponse = await api.get(`/analytics/reports/${reportId}`);
                    setReport(reportResponse.data.content);
                } else if (taskResult.status === 'FAILURE') {
                    setStatus('FAILED');
                    setError(taskResult.info?.status || 'В процессе анализа произошла ошибка.');
                    clearInterval(pollInterval);
                }
            } catch (err) {
                setStatus('FAILED');
                setError('Не удалось получить статус задачи. Проверьте консоль.');
                clearInterval(pollInterval);
            }
        }, 3500); // Опрос каждые 3.5 секунды

        return () => clearInterval(intervalId);
    }, [status, taskId, reportId]);

    // --- Рендеринг в зависимости от состояния ---

    if (status === 'IN_PROGRESS') {
        return (
            <div className="flex flex-col justify-center items-center h-[80vh]">
                <Loader className="w-12 h-12 text-blue-500 animate-spin" />
                <h2 className="mt-6 text-2xl font-semibold text-gray-700">Анализ в процессе...</h2>
                <p className="mt-2 text-gray-500 max-w-md text-center">{message}</p>
            </div>
        );
    }

    if (status === 'FAILED') {
        return (
            <div className="max-w-2xl mx-auto text-center py-16">
                 <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
                 <h2 className="mt-6 text-2xl font-semibold text-gray-700">Произошла ошибка</h2>
                 <p className="mt-2 text-red-600 bg-red-50 p-4 rounded-lg">{error}</p>
                 <Link to="/" className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg">
                    Вернуться на главную
                 </Link>
            </div>
        );
    }

    if (status === 'COMPLETED' && report) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-8">
                     <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{report.title}</h1>
                            <p className="text-gray-600">Анализ успешно завершен. Вот результаты:</p>
                        </div>
                    </div>
                </div>

                {report.sections.map((section, index) => (
                    <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 border-l-4 border-blue-500 pl-4 mb-6">
                            {section.title}
                        </h2>

                        <div className="prose max-w-none prose-p:text-gray-700 prose-headings:text-gray-800">
                             <ReactMarkdown>{section.narrative}</ReactMarkdown>
                        </div>

                        {section.chart_url && (
                            <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                                <img src={section.chart_url} alt={`График: ${section.title}`} className="w-full h-auto rounded-md shadow-md" />
                            </div>
                        )}

                        {section.data_preview && section.data_preview.length > 0 && (
                            <details className="mt-6">
                                <summary className="cursor-pointer font-medium text-blue-600">Показать превью данных</summary>
                                <div className="mt-2 overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                {Object.keys(section.data_preview[0]).map(key => <th key={key} className="px-4 py-2 text-left font-semibold text-gray-600">{key}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {section.data_preview.map((row, idx) => (
                                                <tr key={idx}>
                                                    {Object.values(row).map((val: any, i) => <td key={i} className="px-4 py-2 text-gray-700">{String(val)}</td>)}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </details>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    return null;
};

export default ReportPage;