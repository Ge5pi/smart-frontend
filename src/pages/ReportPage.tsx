// src/pages/ReportPage.tsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Loader, AlertTriangle, CheckCircle, BookOpen } from 'lucide-react';
import api from '../api';

// Типы для новой структуры отчета
type DetailedFinding = {
    question: string;
    summary: string;
    chart_url: string | null;
    data_preview: any[] | null;
};

type AdvancedReportData = {
    executive_summary: string;
    detailed_findings: DetailedFinding[];
};

const ReportPage = () => {
    const { reportId, taskId } = useParams<{ reportId: string, taskId: string }>();

    // Состояния для отслеживания прогресса
    const [status, setStatus] = useState<'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'>('PENDING');
    const [progressMessage, setProgressMessage] = useState('Инициализация анализа...');
    const [progressPercent, setProgressPercent] = useState(0);
    const [report, setReport] = useState<AdvancedReportData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(true);

    useEffect(() => {
        if (!taskId || !reportId) {
            setStatus('FAILED');
            setError('Не указаны необходимые параметры задачи.');
            return;
        }

        // Если задача уже завершена, не начинаем опрос
        if (status === 'COMPLETED' || status === 'FAILED') {
            setIsPolling(false);
            return;
        }

        if (!isPolling) return;

        const pollInterval = setInterval(async () => {
            try {
                console.log('Опрашиваем статус задачи:', taskId);

                // Получаем статус задачи от Celery
                const statusResponse = await api.get(`/analytics/reports/status/${taskId}`);
                const taskResult = statusResponse.data;

                console.log('Статус задачи:', taskResult);

                // Обновляем сообщение и процент выполнения
                if (taskResult.info?.progress) {
                    setProgressMessage(taskResult.info.progress);
                }
                if (taskResult.info?.percent) {
                    setProgressPercent(taskResult.info.percent);
                }

                // Обновляем статус в зависимости от ответа
                if (taskResult.status === 'PENDING') {
                    setStatus('PENDING');
                } else if (taskResult.status === 'PROGRESS') {
                    setStatus('IN_PROGRESS');
                } else if (taskResult.status === 'SUCCESS') {
                    console.log('Задача завершена успешно, загружаем отчет');
                    setStatus('COMPLETED');
                    setIsPolling(false);
                    clearInterval(pollInterval);

                    // Загружаем готовый отчет из нашей БД
                    try {
                        const reportResponse = await api.get(`/analytics/reports/${reportId}`);
                        console.log('Отчет загружен:', reportResponse.data);
                        setReport(reportResponse.data.content);
                    } catch (reportError) {
                        console.error('Ошибка при загрузке отчета:', reportError);
                        setStatus('FAILED');
                        setError('Не удалось загрузить готовый отчет.');
                    }
                } else if (taskResult.status === 'FAILURE') {
                    console.log('Задача завершена с ошибкой:', taskResult.info);
                    setStatus('FAILED');
                    setError(taskResult.info?.error || taskResult.info || 'В процессе анализа произошла неизвестная ошибка.');
                    setIsPolling(false);
                    clearInterval(pollInterval);
                }
            } catch (err) {
                console.error('Ошибка при опросе статуса:', err);

                // Если ошибка при опросе, возможно, отчет уже готов, но со статусом FAILED
                try {
                    const reportResponse = await api.get(`/analytics/reports/${reportId}`);
                    console.log('Проверяем отчет напрямую:', reportResponse.data);

                    if (reportResponse.data.status === 'FAILED') {
                        setStatus('FAILED');
                        setError(reportResponse.data.content?.error || 'Не удалось получить детали ошибки.');
                    } else if (reportResponse.data.status === 'COMPLETED') {
                        setStatus('COMPLETED');
                        setReport(reportResponse.data.content);
                    }
                } catch (finalError) {
                    console.error('Финальная ошибка:', finalError);
                    setStatus('FAILED');
                    setError('Не удалось получить статус задачи. Пожалуйста, обратитесь в поддержку.');
                }

                setIsPolling(false);
                clearInterval(pollInterval);
            }
        }, 3000); // Опрашиваем каждые 3 секунды

        // Очистка интервала при размонтировании компонента
        return () => {
            clearInterval(pollInterval);
            setIsPolling(false);
        };
    }, [taskId, reportId, isPolling, status]);

    // Рендер страницы в зависимости от статуса

    // 1. Статус "В процессе"
    if (status === 'PENDING' || status === 'IN_PROGRESS') {
        return (
            <div className="flex flex-col justify-center items-center h-[80vh] px-4">
                <Loader className="w-12 h-12 text-blue-500 animate-spin" />
                <h2 className="mt-6 text-2xl font-semibold text-gray-700">Идет глубокий анализ...</h2>
                <div className="w-full max-w-lg mt-4 bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
                <p className="mt-4 text-gray-500 max-w-md text-center font-mono text-sm">{progressMessage}</p>
                <p className="mt-2 text-xs text-gray-400">Это может занять несколько минут. Не закрывайте страницу.</p>

                {/* Кнопка для принудительной проверки статуса */}
                <button
                    onClick={() => {
                        setIsPolling(true);
                        setStatus('PENDING');
                    }}
                    className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                >
                    Обновить статус
                </button>
            </div>
        );
    }

    // 2. Статус "Ошибка"
    if (status === 'FAILED') {
        return (
            <div className="max-w-3xl mx-auto text-center py-16 px-4">
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto" />
                <h2 className="mt-6 text-3xl font-bold text-gray-800">Произошла ошибка</h2>
                <p className="mt-4 text-lg text-gray-600">К сожалению, мы не смогли завершить анализ.</p>
                <div className="mt-4 text-left text-sm text-red-700 bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="font-semibold">Детали ошибки:</p>
                    <p className="font-mono mt-2">{error || 'Нет деталей.'}</p>
                </div>
                <div className="mt-6 flex gap-4 justify-center">
                    <button
                        onClick={() => {
                            setStatus('PENDING');
                            setError(null);
                            setIsPolling(true);
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700"
                    >
                        Попробовать снова
                    </button>
                    <Link
                        to="/connections"
                        className="px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold shadow-lg hover:bg-gray-700"
                    >
                        Вернуться к подключениям
                    </Link>
                </div>
            </div>
        );
    }

    // 3. Статус "Готово" - рендерим новый, богатый отчет
    if (status === 'COMPLETED' && report) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Блок с главной выжимкой */}
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200/50 p-8 mb-10 ring-1 ring-black/5">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Аналитический отчет</h1>
                    </div>
                    <div className="prose prose-lg max-w-none text-gray-700 prose-headings:text-gray-800 border-l-4 border-green-500 pl-6">
                        <h2 className="text-2xl font-semibold">Executive Summary</h2>
                        <ReactMarkdown>{report.executive_summary}</ReactMarkdown>
                    </div>
                </div>

                {/* Блок с детальными находками */}
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <BookOpen />
                    Детальные выводы
                </h2>
                <div className="space-y-8">
                    {report.detailed_findings.map((finding, index) => (
                        <div key={index} className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 p-6 transition-all hover:shadow-2xl">
                            <h3 className="text-xl font-semibold text-gray-800 flex items-start gap-3 mb-4">
                                <span className="flex-shrink-0 mt-1.5 flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold">
                                    {index + 1}
                                </span>
                                <span>{finding.question}</span>
                            </h3>

                            <div className="prose max-w-none prose-p:text-gray-600 pl-11 mb-4">
                                <ReactMarkdown>{finding.summary}</ReactMarkdown>
                            </div>

                            {finding.chart_url && (
                                <div className="mt-4 pl-11">
                                    <a href={finding.chart_url} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={finding.chart_url}
                                            alt={`График: ${finding.question}`}
                                            className="w-full max-w-3xl mx-auto h-auto rounded-lg shadow-lg border hover:shadow-2xl transition-shadow"
                                        />
                                    </a>
                                </div>
                            )}

                            {finding.data_preview && finding.data_preview.length > 0 && (
                                <details className="mt-5 pl-11">
                                    <summary className="cursor-pointer font-medium text-sm text-blue-600 hover:text-blue-800">
                                        Показать/скрыть превью данных
                                    </summary>
                                    <div className="mt-2 overflow-x-auto text-xs">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {Object.keys(finding.data_preview[0]).map(key => (
                                                        <th key={key} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider">
                                                            {key}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {finding.data_preview.map((row, idx) => (
                                                    <tr key={idx}>
                                                        {Object.values(row).map((val: any, i) => (
                                                            <td key={i} className="px-3 py-2 text-gray-600 font-mono whitespace-nowrap">
                                                                {String(val)}
                                                            </td>
                                                        ))}
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
            </div>
        );
    }

    // 4. Фоллбек - если ничего не подошло
    return (
        <div className="max-w-3xl mx-auto text-center py-16 px-4">
            <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto" />
            <h2 className="mt-6 text-3xl font-bold text-gray-800">Неизвестное состояние</h2>
            <p className="mt-4 text-lg text-gray-600">
                Статус: {status}, Отчет: {report ? 'есть' : 'нет'}
            </p>
            <Link
                to="/connections"
                className="mt-8 inline-block px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700"
            >
                Вернуться к подключениям
            </Link>
        </div>
    );
};

export default ReportPage;