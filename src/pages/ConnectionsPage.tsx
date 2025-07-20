// src/pages/ConnectionsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, 
  Plus, 
  List, 
  Loader, 
  PlayCircle, 
  Zap, 
  BarChart3,
  Brain,
  Eye,
  Clock,
  Sparkles
} from 'lucide-react';
import api from '../api';

type Connection = {
  id: number;
  nickname: string;
  db_type: string;
  created_at: string;
};

type AnalysisType = 'quick' | 'standard' | 'comprehensive';

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

  // Состояния для генерации отчетов
  const [generatingReports, setGeneratingReports] = useState<Set<number>>(new Set());
  const [previewData, setPreviewData] = useState<{[key: number]: any}>({});
  const [showPreview, setShowPreview] = useState<{[key: number]: boolean}>({});

  // Загрузка списка подключений
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

  // Добавление нового подключения
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

      setConnections(prev => [...prev, response.data]);
      setNickname('');
      setConnectionString('');
      
      alert('Подключение успешно добавлено!');
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Произошла ошибка при добавлении подключения.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Генерация DataFrame отчета с GPT
  const handleGenerateDataFrameReport = async (connectionId: number, analysisType: AnalysisType = 'standard') => {
    if (generatingReports.has(connectionId)) {
      return;
    }

    setGeneratingReports(prev => new Set(prev).add(connectionId));

    try {
      const maxQuestions = analysisType === 'quick' ? 8 : analysisType === 'comprehensive' ? 25 : 15;
      
      const response = await api.post(`/analytics/reports/generate-dataframe/${connectionId}`, {
        max_questions: maxQuestions,
        analysis_type: analysisType
      });
      
      const { id } = response.data;
      navigate(`/reports/${id}`);
    } catch (err: any) {
      alert(`Ошибка при запуске ${analysisType} анализа: ${err.response?.data?.detail || 'Неизвестная ошибка'}`);
    } finally {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectionId);
        return newSet;
      });
    }
  };

  // Preview таблиц
  const handlePreviewTables = async (connectionId: number) => {
    try {
      setShowPreview(prev => ({...prev, [connectionId]: true}));
      
      if (!previewData[connectionId]) {
        const response = await api.get(`/analytics/dataframe/preview/${connectionId}?max_rows_per_table=3`);
        setPreviewData(prev => ({...prev, [connectionId]: response.data}));
      }
    } catch (err: any) {
      alert(`Ошибка получения preview: ${err.response?.data?.detail || 'Неизвестная ошибка'}`);
      setShowPreview(prev => ({...prev, [connectionId]: false}));
    }
  };

  const closePreview = (connectionId: number) => {
    setShowPreview(prev => ({...prev, [connectionId]: false}));
  };

  const getAnalysisConfig = (type: AnalysisType) => {
    switch (type) {
      case 'quick':
        return {
          name: 'Быстрый',
          icon: Zap,
          color: 'bg-green-600 hover:bg-green-700',
          description: '8 вопросов, ~3 мин',
          features: ['Базовая статистика', 'Основные паттерны', 'GPT инсайты']
        };
      case 'comprehensive':
        return {
          name: 'Полный',
          icon: BarChart3,
          color: 'bg-purple-600 hover:bg-purple-700',
          description: '25 вопросов, ~15 мин',
          features: ['Полный анализ', 'ML алгоритмы', 'Расширенные GPT инсайты', 'Прогнозы']
        };
      default:
        return {
          name: 'Стандартный',
          icon: PlayCircle,
          color: 'bg-blue-600 hover:bg-blue-700',
          description: '15 вопросов, ~7 мин',
          features: ['Детальная статистика', 'Корреляции', 'GPT анализ', 'Рекомендации']
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-3">
            <Database className="w-10 h-10 text-blue-600" />
            AI-Powered Analytics Platform
          </h1>
          <p className="text-lg text-gray-600">
            Подключайтесь к базам данных и получайте глубокие инсайты с помощью GPT-анализа.
          </p>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Brain className="w-4 h-4 text-purple-600" />
              <span>GPT-4 Анализ</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-yellow-600" />
              <span>DataFrame Оптимизация</span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>ML Алгоритмы</span>
            </div>
          </div>
        </div>

        {/* Форма добавления нового подключения */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Plus className="w-6 h-6" />
            Добавить новое подключение
          </h2>
          
          <form onSubmit={handleAddConnection} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                  Название подключения
                </label>
                <input
                  type="text"
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Например: Production DB"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="dbType" className="block text-sm font-medium text-gray-700 mb-2">
                  Тип базы данных
                </label>
                <select
                  id="dbType"
                  value={dbType}
                  onChange={(e) => setDbType(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white"
                >
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="sqlite">SQLite</option>
                  <option value="mssql">SQL Server</option>
                  <option value="oracle">Oracle</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="connectionString" className="block text-sm font-medium text-gray-700 mb-2">
                Строка подключения
              </label>
              <input
                type="text"
                id="connectionString"
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="postgresql://user:password@localhost:5432/database"
                required
              />
            </div>
            
            {formError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {formError}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {isSubmitting ? 'Добавление...' : 'Добавить подключение'}
            </button>
          </form>
        </div>

        {/* Список подключений */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <List className="w-6 h-6" />
            Ваши подключения ({connections.length})
          </h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Загрузка подключений...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 max-w-md mx-auto">
                {error}
              </div>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 text-lg">У вас пока нет подключений.</p>
              <p className="text-gray-500">Добавьте первое подключение выше.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connections.map(conn => (
                <div key={conn.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                  {/* Заголовок подключения */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{conn.nickname}</h3>
                      <p className="text-sm text-gray-600 uppercase tracking-wide font-medium">{conn.db_type}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Создано: {new Date(conn.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                  </div>

                  {/* Preview кнопка */}
                  <button
                    onClick={() => handlePreviewTables(conn.id)}
                    className="w-full mb-4 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Предпросмотр таблиц
                  </button>

                  {/* Preview данных */}
                  {showPreview[conn.id] && previewData[conn.id] && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-blue-900">
                          Найдено {previewData[conn.id].total_tables_found} таблиц
                        </h4>
                        <button
                          onClick={() => closePreview(conn.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="space-y-1 text-xs text-blue-800">
                        {Object.entries(previewData[conn.id].tables_preview || {}).slice(0, 3).map(([tableName, info]: [string, any]) => (
                          <div key={tableName}>
                            <span className="font-medium">{tableName}:</span> {info.rows} строк, {info.columns} колонок
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Кнопки анализа */}
                  <div className="space-y-3">
                    {(['quick', 'standard', 'comprehensive'] as AnalysisType[]).map(type => {
                      const config = getAnalysisConfig(type);
                      const Icon = config.icon;
                      const isGenerating = generatingReports.has(conn.id);
                      
                      return (
                        <div key={type} className="group">
                          <button
                            onClick={() => handleGenerateDataFrameReport(conn.id, type)}
                            disabled={isGenerating}
                            className={`w-full px-4 py-3 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 ${config.color}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isGenerating ? (
                                  <Loader className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Icon className="w-4 h-4" />
                                )}
                                <span>{config.name} анализ</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Brain className="w-3 h-3" />
                                <Clock className="w-3 h-3" />
                              </div>
                            </div>
                            <div className="text-xs opacity-90 mt-1">
                              {config.description}
                            </div>
                          </button>
                          
                          {/* Детали анализа */}
                          <div className="mt-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="text-xs text-gray-600 space-y-1">
                              {config.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Индикатор генерации */}
                  {generatingReports.has(conn.id) && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Loader className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">Создается AI-анализ...</span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        GPT обрабатывает ваши данные
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Информационная панель */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            О нашем AI-анализе
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-medium text-green-900">Быстрый анализ</p>
              <p className="text-green-700">Мгновенные инсайты и основные паттерны</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <PlayCircle className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-medium text-blue-900">Стандартный анализ</p>
              <p className="text-blue-700">Детальный разбор с GPT рекомендациями</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <p className="font-medium text-purple-900">Полный анализ</p>
              <p className="text-purple-700">ML алгоритмы + расширенные GPT инсайты</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionsPage;
