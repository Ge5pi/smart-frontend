// ConnectionsPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startDatabaseAnalysis } from '../api';  // Импортируем только нужную функцию (именованный экспорт)

const ConnectionsPage: React.FC = () => {
  const [connectionString, setConnectionString] = useState('');
  const [dbType, setDbType] = useState<'postgres' | 'sqlserver'>('postgres');
  const [error, setError] = useState<string | null>(null);  // Уточнили тип
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await startDatabaseAnalysis(connectionString, dbType);
      const reportId = response.data.report_id;
      navigate(`/report/${reportId}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail
        ? (typeof err.response.data.detail === 'string' ? err.response.data.detail : JSON.stringify(err.response.data.detail))
        : 'Произошла ошибка при анализе базы данных.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Подключение к базе данных</h1>
      <p className="mb-4">Введите строку подключения и выберите тип базы данных для анализа.</p>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Тип базы данных</label>
        <select
          value={dbType}
          onChange={(e) => setDbType(e.target.value as 'postgres' | 'sqlserver')}
          className="border rounded p-2 w-full"
        >
          <option value="postgres">PostgreSQL</option>
          <option value="sqlserver">SQL Server</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Строка подключения</label>
        <input
          type="text"
          value={connectionString}
          onChange={(e) => setConnectionString(e.target.value)}
          placeholder="postgresql://user:password@host:port/dbname"
          className="border rounded p-2 w-full"
        />
      </div>
      <button
        onClick={handleAnalyze}
        disabled={loading || !connectionString}
        className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Анализ...' : 'Начать анализ'}
      </button>
    </div>
  );
};

export default ConnectionsPage;
