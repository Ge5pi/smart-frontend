import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
interface DatabaseConnection {
  id: number;
  nickname: string;
  db_type: string;
  created_at: string;
}

interface AnalysisTask {
  task_id: string;
  status: 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE';
  progress?: string;
  progress_percentage?: number;
  error?: string;
}

const ConnectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTasks, setActiveTasks] = useState<Record<number, AnalysisTask>>({});

  useEffect(() => {
    fetchConnections();
    // Запускаем периодическую проверку задач
    const interval = setInterval(checkTaskStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/database-connections', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Не удалось загрузить подключения');
      }

      const data = await response.json();
      setConnections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const checkTaskStatus = async () => {
    for (const [connectionId, task] of Object.entries(activeTasks)) {
      if (task.status === 'PENDING' || task.status === 'PROGRESS') {
        try {
          const response = await fetch(`/api/reports/task/${task.task_id}/status`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (response.ok) {
            const taskStatus = await response.json();
            setActiveTasks(prev => ({
              ...prev,
              [connectionId]: taskStatus
            }));

            // Если задача завершена, перенаправляем на отчет
            if (taskStatus.status === 'SUCCESS' && taskStatus.report_id) {
              // Убираем задачу из активных через небольшую задержку
              setTimeout(() => {
                setActiveTasks(prev => {
                  const newTasks = { ...prev };
                  delete newTasks[connectionId];
                  return newTasks;
                });
                navigate(`/reports/${taskStatus.report_id}`);
              }, 1000);
            }

            // Убираем провалившиеся задачи через некоторое время
            if (taskStatus.status === 'FAILURE') {
              setTimeout(() => {
                setActiveTasks(prev => {
                  const newTasks = { ...prev };
                  delete newTasks[connectionId];
                  return newTasks;
                });
              }, 5000);
            }
          }
        } catch (error) {
          console.error('Ошибка проверки статуса задачи:', error);
        }
      }
    }
  };

  const startAnalysis = async (connectionId: number, analysisType: 'quick' | 'standard' | 'comprehensive') => {
    try {
      const endpoints = {
        quick: '/api/analytics/quick-smart-analysis',
        standard: '/api/analytics/smart-analysis',
        comprehensive: '/api/analytics/comprehensive-smart-analysis'
      };

      const response = await fetch(endpoints[analysisType], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ connection_id: connectionId })
      });

      if (!response.ok) {
        throw new Error('Не удалось запустить анализ');
      }

      const data = await response.json();

      // Добавляем задачу в активные
      setActiveTasks(prev => ({
        ...prev,
        [connectionId]: {
          task_id: data.task_id,
          status: 'PENDING',
          progress: 'Запуск SmartGPT анализа...'
        }
      }));

    } catch (err) {
      console.error('Ошибка запуска анализа:', err);
      alert('Не удалось запустить анализ. Попробуйте позже.');
    }
  };

  const getAnalysisTypeLabel = (type: 'quick' | 'standard' | 'comprehensive') => {
    switch (type) {
      case 'quick':
        return {
          label: 'Быстрый анализ',
          description: 'Мгновенные инсайты и основные паттерны с SmartGPT',
          icon: '⚡',
          time: '~5-10 мин',
          questions: '8 умных вопросов'
        };
      case 'standard':
        return {
          label: 'Стандартный анализ',
          description: 'Детальный разбор с углубленными GPT рекомендациями',
          icon: '🎯',
          time: '~15-20 мин',
          questions: '15 умных вопросов'
        };
      case 'comprehensive':
        return {
          label: 'Полный анализ',
          description: 'Максимально глубокий SmartGPT анализ с предиктивной аналитикой',
          icon: '🚀',
          time: '~30-45 мин',
          questions: '25 умных вопросов'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SmartGPT Analytics</h1>
          <p className="text-gray-600">
            Подключайтесь к базам данных и получайте глубокие инсайты с помощью умного GPT-анализа.
          </p>
        </div>

        {/* New SmartGPT Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center">
                <span className="mr-2">🤖</span>
                Новый SmartGPT Анализ
              </h2>
              <p className="text-blue-100">
                Революционный подход к анализу данных с искусственным интеллектом.
                Получайте не только данные, но и умные бизнес-рекомендации.
              </p>
            </div>
            <div className="text-6xl opacity-20">🧠</div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <span className="mr-2">✨</span>
              Автоматическое определение бизнес-контекста
            </div>
            <div className="flex items-center">
              <span className="mr-2">🎯</span>
              Конкретные действия и рекомендации
            </div>
            <div className="flex items-center">
              <span className="mr-2">🔮</span>
              Предиктивная аналитика
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Connections Grid */}
        {connections.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">🗄️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">У вас пока нет подключений</h3>
            <p className="text-gray-600 mb-6">Добавьте первое подключение выше.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connections.map((conn) => {
              const activeTask = activeTasks[conn.id];
              const isAnalyzing = activeTask && (activeTask.status === 'PENDING' || activeTask.status === 'PROGRESS');

              return (
                <div key={conn.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{conn.nickname}</h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium mr-2">
                            {conn.db_type}
                          </span>
                          <span>Создано: {new Date(conn.created_at).toLocaleDateString('ru-RU')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Analysis Progress */}
                    {isAnalyzing && activeTask && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-900">SmartGPT Анализ выполняется...</span>
                          {activeTask.progress_percentage && (
                            <span className="text-sm text-blue-700">{activeTask.progress_percentage}%</span>
                          )}
                        </div>
                        {activeTask.progress_percentage && (
                          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${activeTask.progress_percentage}%` }}
                            ></div>
                          </div>
                        )}
                        <p className="text-xs text-blue-800">{activeTask.progress || 'Инициализация...'}</p>
                      </div>
                    )}

                    {/* Analysis Error */}
                    {activeTask && activeTask.status === 'FAILURE' && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="text-sm font-medium text-red-900 mb-1">Ошибка анализа</h4>
                        <p className="text-xs text-red-700">{activeTask.error || 'Неизвестная ошибка'}</p>
                      </div>
                    )}

                    {/* Analysis Buttons */}
                    <div className="space-y-3">
                      {(['quick', 'standard', 'comprehensive'] as const).map((analysisType) => {
                        const config = getAnalysisTypeLabel(analysisType);
                        const isDisabled = isAnalyzing;

                        return (
                          <button
                            key={analysisType}
                            onClick={() => !isDisabled && startAnalysis(conn.id, analysisType)}
                            disabled={isDisabled}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                              isDisabled
                                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                : analysisType === 'quick'
                                ? 'border-green-200 bg-green-50 hover:border-green-300 hover:bg-green-100'
                                : analysisType === 'standard'
                                ? 'border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100'
                                : 'border-purple-200 bg-purple-50 hover:border-purple-300 hover:bg-purple-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="text-2xl mr-3">{config.icon}</span>
                                <div>
                                  <div className="font-semibold text-gray-900 flex items-center">
                                    {config.label}
