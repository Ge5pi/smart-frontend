import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Plus, List, Loader, PlayCircle, Zap, BarChart3 } from 'lucide-react';
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

  // Состояния для генерации отчетов
  const [generatingReports, setGeneratingReports] = useState<Set<number>>(new Set());

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

      alert('Подключение успешно добавлено!');
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Произошла ошибка при добавлении подключения.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обработчик запуска DataFrame отчета
  const handleGenerateDataFrameReport = async (connectionId: number, analysisType: string = 'standard') => {
    if (generatingReports.has(connectionId)) {
      return; // Предотвращаем двойной запуск
    }

    setGeneratingReports(prev => new Set(prev).add(connectionId));

    try {
      const response = await api.post(`/analytics/reports/generate-dataframe/${connectionId}`, {
        max_questions: analysisType === 'quick' ? 8 : analysisType === 'comprehensive' ? 25 : 15,
        analysis_type: analysisType
      });
      const { id } = response.data;
      navigate(`/reports/${id}`);
    } catch (err: any) {
      alert(`Ошибка при запуске DataFrame-анализа: ${err.response?.data?.detail || 'Неизвестная ошибка'}`);
    } finally {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectionId);
        return newSet;
      });
    }
  };

  // Обработчик preview таблиц
  const handlePreviewTables = async (connectionId: number) => {
    try {
      const response = await api.get(`/analytics/dataframe/preview/${connectionId}?max_rows_per_table=3`);
      const preview = response.data;

      // Показываем preview в модальном окне
      const previewText = Object.entries(preview.tables_preview)
        .map(([tableName, info]: [string, any]) =>
          `${tableName}: ${info.rows} строк, ${info.columns} колонок`
        )
        .join('\n');

      alert(`Preview таблиц:\n${previewText}\n\nВсего найдено ${preview.total_tables_found} таблиц с данными`);
    } catch (err: any) {
      alert(`Ошибка получения preview: ${err.response?.data?.detail || 'Неизвестная ошибка'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-3">
            <Database className="w-10 h-10 text-blue-600" />
            Подключения к базам данных
          </h1>
          <p className="text-lg text-gray-600">
            Управляйте вашими источниками данных и запускайте DataFrame-анализ.
          </p>
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {isSubmitting ? 'Добавление...' : 'Добавить подключение'}
            </button>
          </form>
        </div>

        {/* Список существующих подключений */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <List className="w-6 h-6" />
            Сохраненные подключения ({connections.length})
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
              <p className="text-gray-600 text-lg">У вас пока нет сохраненных подключений.</p>
              <p className="text-gray-500">Добавьте первое подключение выше.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connections.map(conn => (
                <div key={conn.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{conn.nickname}</h3>
                      <p className="text-sm text-gray-600 uppercase tracking-wide">{conn.db_type}</p>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>

                  {/* Кнопки управления */}
                  <div className="space-y-3">
                    {/* Preview кнопка */}
                    <button
                      onClick={() => handlePreviewTables(conn.id)}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
                    >
                      <Database className="w-4 h-4" />
                      Preview таблиц
                    </button>

                    {/* Кнопки DataFrame анализа */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleGenerateDataFrameReport(conn.id, 'quick')}
                        disabled={generatingReports.has(conn.id)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {generatingReports.has(conn.id) ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                          <Zap className="w-3 h-3" />
                        )}
                        Быстрый
                      </button>

                      <button
                        onClick={() => handleGenerateDataFrameReport(conn.id, 'standard')}
                        disabled={generatingReports.has(conn.id)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {generatingReports.has(conn.id) ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                          <PlayCircle className="w-3 h-3" />
                        )}
                        Стандарт
                      </button>

                      <button
                        onClick={() => handleGenerateDataFrameReport(conn.id, 'comprehensive')}
                        disabled={generatingReports.has(conn.id)}
                        className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        {generatingReports.has(conn.id) ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                          <BarChart3 className="w-3 h-3" />
                        )}
                        Полный
                      </button>
                    </div>
                  </div>

                  {/* Информационный текст */}
                  {generatingReports.has(conn.id) && (
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700 text-center">
                        Создается DataFrame-анализ...
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Информационная панель */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 О DataFrame анализе</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Быстрый (8 вопросов)</p>
                <p className="text-blue-600">Основные метрики и структура</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <PlayCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Стандартный (15 вопросов)</p>
                <p className="text-blue-600">Детальный анализ с паттернами</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <BarChart3 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Полный (25 вопросов)</p>
                <p className="text-blue-600">ML-анализ и все инсайты</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionsPage;