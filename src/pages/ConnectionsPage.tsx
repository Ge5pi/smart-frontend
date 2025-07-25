import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { startDatabaseAnalysis, getConnections } from '../api'; // Предполагаем, что эти функции есть в api.ts
import type {DatabaseConnection} from '../api';
import { Database, Server, AlertCircle, Loader2, History, ChevronDown } from 'lucide-react';

const ConnectionsPage: React.FC = () => {
  const [connectionString, setConnectionString] = useState('');
  const [alias, setAlias] = useState('');
  const [dbType, setDbType] = useState<'postgres' | 'sqlserver'>('postgres');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedConnections, setSavedConnections] = useState<DatabaseConnection[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await getConnections();
        setSavedConnections(response.data);
      } catch (err) {
        console.error("Не удалось загрузить сохраненные подключения:", err);
      }
    };
    fetchConnections();
  }, []);

  const handleSelectConnection = (conn: DatabaseConnection) => {
    setConnectionString(conn.connection_string);
    setDbType(conn.db_type as 'postgres' | 'sqlserver');
    setAlias(conn.alias);
  };

  const handleAnalyze = async () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Database className="w-12 h-12 text-blue-600 mx-auto" />
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Анализ базы данных</h1>
          <p className="text-gray-600">Введите данные для подключения или выберите сохраненное.</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Ошибка</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Saved Connections Dropdown */}
          {savedConnections.length > 0 && (
            <div className="group relative">
              <button className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500">
                <div className="flex items-center">
                  <History className="w-5 h-5 mr-2 text-gray-600" />
                  <span className="font-medium text-gray-800">Выбрать сохраненное подключение</span>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              </button>
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200">
                <ul className="py-1">
                  {savedConnections.map((conn) => (
                    <li
                      key={conn.id}
                      onClick={() => handleSelectConnection(conn)}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-700"
                    >
                      {conn.alias} ({conn.db_type})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Database Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Тип базы данных</label>
            <div className="grid grid-cols-2 gap-4">
              {['postgres', 'sqlserver'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDbType(type as 'postgres' | 'sqlserver')}
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

          {/* Alias Input */}
          <div>
            <label htmlFor="alias" className="block text-sm font-medium text-gray-700 mb-2">
              Псевдоним подключения
            </label>
            <input
              id="alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Например, 'Моя рабочая база'"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Connection String Input */}
          <div>
            <label htmlFor="connectionString" className="block text-sm font-medium text-gray-700 mb-2">
              Строка подключения
            </label>
            <textarea
              id="connectionString"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
              rows={3}
              disabled={loading}
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !connectionString.trim() || !alias.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /><span>Анализ...</span></>
            ) : (
              <><Database className="w-5 h-5" /><span>Начать анализ</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionsPage;