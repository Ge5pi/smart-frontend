import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import UsageWarning from '../components/UsageWarning';
import { startDatabaseAnalysis, getConnections, getUserReports } from '../api';
import type { DatabaseConnection, Report } from '../api';
import { Database, Server, AlertCircle, Loader2, History, ChevronDown, Clock, FileText } from 'lucide-react';
import { AppContext } from '../contexts/AppContext';

const ConnectionsPage: React.FC = () => {
  const { currentUser } = useContext(AppContext)!;
  const [connectionString, setConnectionString] = useState('');
  const [alias, setAlias] = useState('');
  const [dbType, setDbType] = useState<'postgres' | 'sqlserver'>('postgres');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedConnections, setSavedConnections] = useState<DatabaseConnection[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [connectionsResponse, reportsResponse] = await Promise.all([
          getConnections(),
          getUserReports()
        ]);
        setSavedConnections(connectionsResponse.data);
        setReports(reportsResponse.data);
      } catch (err) {
        console.error("Не удалось загрузить данные:", err);
      }
    };

    fetchData();
  }, []);

  // Функция для получения псевдонима подключения по connection_id
  const getConnectionAlias = (connectionId: number | null): string => {
    if (!connectionId) return 'Неизвестное подключение';
    const connection = savedConnections.find(conn => conn.id === connectionId);
    return connection?.alias || 'Неизвестное подключение';
  };

  // Функция для форматирования даты
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Только что';
    if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч назад`;

    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Функция для получения цвета статуса
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'queued': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Функция для получения текста статуса
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'completed': return 'Завершен';
      case 'processing': return 'Обрабатывается';
      case 'queued': return 'В очереди';
      case 'failed': return 'Ошибка';
      default: return status;
    }
  };

  const handleSelectConnection = (conn: DatabaseConnection) => {
    setConnectionString(conn.connection_string);
    setDbType(conn.db_type as 'postgres' | 'sqlserver');
    setAlias(conn.alias);
  };

  const handleAnalyze = async () => {
  if (!currentUser.is_active && currentUser.reports_used >= 1) {
      setError("Вы исчерпали лимит на создание отчетов. Пожалуйста, перейдите на платный тариф.");
      return;
    }
    if (!connectionString.trim() || !alias.trim()) {
      setError('Псевдоним и строка подключения не могут быть пустыми');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await startDatabaseAnalysis(connectionString, dbType, alias);
      const reportId = response.data.report_id;
      navigate(`/reports/${reportId}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail ?? 'Произошла ошибка при анализе базы данных.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => {
    return dbType === 'postgres'
      ? 'postgresql://user:password@host:port/dbname'
      : 'mssql+pyodbc://user:password@host/dbname?driver=ODBC+Driver+17+for+SQL+Server';
  };

  // Сортируем отчеты по дате создания (новые сверху)
  const sortedReports = reports.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Анализ базы данных</h1>

        {currentUser && currentUser.reports_used >= 1 && (
            <UsageWarning user={currentUser} pageType="reports" />
        )}

        {/* Табы */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'new'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Database className="w-5 h-5 inline mr-2" />
            Новый анализ
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-5 h-5 inline mr-2" />
            История отчетов ({reports.length})
          </button>
        </div>

        {/* Контент новый анализ */}
        {activeTab === 'new' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 mb-6">
              Введите данные для подключения или выберите сохраненное.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                <div>
                  <h4 className="font-medium text-red-800">Ошибка</h4>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Сохраненные подключения */}
            {savedConnections.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Выбрать сохраненное подключение
                </label>
                <div className="relative">
                  <select
                    onChange={(e) => {
                      const connId = parseInt(e.target.value);
                      const conn = savedConnections.find(c => c.id === connId);
                      if (conn) handleSelectConnection(conn);
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                    defaultValue=""
                  >
                    <option value="">Выберите подключение...</option>
                    {savedConnections.map((conn) => (
                      <option key={conn.id} value={conn.id}>
                        {conn.alias} ({conn.db_type})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Тип базы данных */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Тип базы данных
              </label>
              <div className="grid grid-cols-2 gap-4">
                {(['postgres', 'sqlserver'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDbType(type)}
                    className={`flex items-center justify-center p-3 border-2 rounded-lg transition-all ${
                      dbType === type
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {type === 'postgres' ? <Database className="w-5 h-5 mr-2" /> : <Server className="w-5 h-5 mr-2" />}
                    {type === 'postgres' ? 'PostgreSQL' : 'SQL Server'}
                  </button>
                ))}
              </div>
            </div>

            {/* Псевдоним */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Псевдоним подключения
              </label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Например, 'Моя рабочая база'"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            {/* Строка подключения */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Строка подключения
              </label>
              <textarea
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                placeholder={getPlaceholder()}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Кнопка анализа */}
            <button
              onClick={handleAnalyze}
              disabled={loading || !connectionString.trim() || !alias.trim()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Анализ...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5 mr-2" />
                  Начать анализ
                </>
              )}
            </button>
          </div>
        )}

        {/* Контент история отчетов */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-md">
            {sortedReports.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Пока нет отчетов</h3>
                <p className="text-gray-500">Создайте свой первый анализ базы данных</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {sortedReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => navigate(`/reports/${report.id}`)}
                    className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {getConnectionAlias(report.connection_id ?? null)}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDate(report.created_at)}
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}
                        >
                          {getStatusText(report.status)}
                        </span>
                      </div>
                      <div className="ml-4">
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionsPage;
