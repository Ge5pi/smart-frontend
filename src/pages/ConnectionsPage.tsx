import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startDatabaseAnalysis } from '../api';
import { Database, Server, AlertCircle, Loader2 } from 'lucide-react';

interface ConnectionsPageProps {}

const ConnectionsPage: React.FC<ConnectionsPageProps> = () => {
  const [connectionString, setConnectionString] = useState('');
  const [dbType, setDbType] = useState<'postgres' | 'sqlserver'>('postgres');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!connectionString.trim()) {
      setError('Строка подключения не может быть пустой');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await startDatabaseAnalysis(connectionString, dbType);
      const reportId = response.data.report_id;
      navigate(`/reports/${reportId}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail
        ? (typeof err.response.data.detail === 'string' 
           ? err.response.data.detail 
           : JSON.stringify(err.response.data.detail))
        : 'Произошла ошибка при анализе базы данных.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => {
    return dbType === 'postgres' 
      ? 'postgresql://user:password@host:port/dbname'
      : 'Server=server;Database=db;User Id=user;Password=password;';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Database className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Подключение к базе данных
          </h1>
          <p className="text-gray-600">
            Введите строку подключения и выберите тип базы данных для анализа
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Ошибка</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Database Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Тип базы данных
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDbType('postgres')}
                className={`flex items-center justify-center p-4 border-2 rounded-lg transition-all ${
                  dbType === 'postgres'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <Database className="w-5 h-5 mr-2" />
                PostgreSQL
              </button>
              <button
                type="button"
                onClick={() => setDbType('sqlserver')}
                className={`flex items-center justify-center p-4 border-2 rounded-lg transition-all ${
                  dbType === 'sqlserver'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <Server className="w-5 h-5 mr-2" />
                SQL Server
              </button>
            </div>
          </div>

          {/* Connection String Input */}
          <div className="mb-6">
            <label htmlFor="connectionString" className="block text-sm font-medium text-gray-700 mb-2">
              Строка подключения
            </label>
            <textarea
              id="connectionString"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
              rows={3}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Убедитесь, что строка подключения содержит все необходимые параметры
            </p>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !connectionString.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Анализ...</span>
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                <span>Начать анализ</span>
              </>
            )}
          </button>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Поддерживаемые базы данных</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• PostgreSQL (версия 9.6 и выше)</li>
            <li>• Microsoft SQL Server (2012 и выше)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ConnectionsPage;