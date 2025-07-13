// src/pages/ConnectionsPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Plus, List, Loader, PlayCircle } from 'lucide-react';
import api from '../api';

// Тип для одного подключения
type Connection = {
    id: number;
    nickname: string;
    db_type: string;
};

const ConnectionsPage = () => {
    const navigate = useNavigate();

    // Состояния
    const [connections, setConnections] = useState<Connection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Состояния для формы
    const [nickname, setNickname] = useState('');
    const [dbType, setDbType] = useState('postgresql');
    const [connectionString, setConnectionString] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Загрузка списка подключений при загрузке страницы
    useEffect(() => {
        const fetchConnections = async () => {
            setIsLoading(true);
            try {
                const response = await api.get('/analytics/connections/');
                setConnections(response.data);
            } catch (err) {
                setError('Не удалось загрузить список подключений. Пожалуйста, обновите страницу.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchConnections();
    }, []);

    // Обработчик добавления нового подключения
    const handleAddConnection = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null);

        try {
            const response = await api.post('/analytics/connections/', {
                nickname,
                db_type: dbType,
                connection_string: connectionString,
            });
            // Добавляем новое подключение в список
            setConnections(prev => [...prev, response.data]);
            // Очищаем форму
            setNickname('');
            setConnectionString('');
        } catch (err: any) {
            setFormError(err.response?.data?.detail || 'Произошла ошибка при добавлении подключения.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Обработчик запуска генерации отчета
    const handleGenerateReport = async (connectionId: number) => {
        try {
            const response = await api.post(`/analytics/reports/generate/${connectionId}`);
            const { report_id, task_id } = response.data;
            // Перенаправляем пользователя на страницу отчета
            navigate(`/reports/${report_id}/${task_id}`);
        } catch (err: any) {
            alert(`Ошибка при запуске анализа: ${err.response?.data?.detail || 'Неизвестная ошибка'}`);
        }
    };


    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl">
                    <Database className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Подключения к базам данных</h1>
                    <p className="text-gray-600">Управляйте вашими источниками данных и запускайте AI-анализ.</p>
                </div>
            </div>

            {/* Форма добавления нового подключения */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-12">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><Plus />Добавить новое подключение</h2>
                <form onSubmit={handleAddConnection} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Название (например, 'Продажи Март')"
                            value={nickname}
                            onChange={e => setNickname(e.target.value)}
                            className="w-full p-3 rounded-xl border-2"
                            required
                        />
                        <select
                            value={dbType}
                            onChange={e => setDbType(e.target.value)}
                            className="w-full p-3 rounded-xl border-2 bg-white"
                        >
                            <option value="postgresql">PostgreSQL</option>
                            <option value="mysql">MySQL</option>
                            <option value="sqlite">SQLite</option>
                        </select>
                    </div>
                    <div>
                        <input
                            type="text"
                            placeholder="Строка подключения (например, postgresql://user:password@host:port/dbname)"
                            value={connectionString}
                            onChange={e => setConnectionString(e.target.value)}
                            className="w-full p-3 rounded-xl border-2"
                            required
                        />
                    </div>
                    {formError && <p className="text-red-600">{formError}</p>}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold flex items-center gap-2 disabled:bg-gray-400"
                    >
                        {isSubmitting ? <Loader className="animate-spin w-5 h-5" /> : 'Добавить'}
                    </button>
                </form>
            </div>

            {/* Список существующих подключений */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
                 <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><List />Сохраненные подключения</h2>
                 {isLoading ? (
                     <div className="text-center py-8"><Loader className="animate-spin w-8 h-8 mx-auto text-gray-500" /></div>
                 ) : error ? (
                     <p className="text-red-600">{error}</p>
                 ) : connections.length === 0 ? (
                     <p className="text-gray-500">У вас пока нет сохраненных подключений.</p>
                 ) : (
                     <div className="space-y-4">
                         {connections.map(conn => (
                             <div key={conn.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                                 <div>
                                     <p className="font-semibold text-lg text-gray-800">{conn.nickname}</p>
                                     <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-mono rounded">{conn.db_type}</span>
                                 </div>
                                 <button
                                     onClick={() => handleGenerateReport(conn.id)}
                                     className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700"
                                 >
                                     <PlayCircle className="w-5 h-5" />
                                     Сгенерировать отчет
                                 </button>
                             </div>
                         ))}
                     </div>
                 )}
            </div>
        </div>
    );
};

export default ConnectionsPage;