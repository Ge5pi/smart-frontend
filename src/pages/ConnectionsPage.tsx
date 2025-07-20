import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Database,
  Play,
  Zap,
  Brain,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle
} from 'lucide-react';

interface DatabaseConnection {
  id: number;
  nickname: string;
  db_type: string;
  created_at: string;
}

interface AnalysisType {
  type: 'quick' | 'standard' | 'comprehensive';
  name: string;
  description: string;
  questions: number;
  estimatedTime: string;
  icon: React.ReactNode;
}

const analysisTypes: AnalysisType[] = [
  {
    type: 'quick',
    name: 'Быстрый анализ',
    description: 'Мгновенные инсайты и основные паттерны',
    questions: 8,
    estimatedTime: '5-10 мин',
    icon: <Zap className="h-5 w-5" />
  },
  {
    type: 'standard',
    name: 'Стандартный анализ',
    description: 'Детальный разбор с GPT рекомендациями',
    questions: 15,
    estimatedTime: '15-20 мин',
    icon: <Play className="h-5 w-5" />
  },
  {
    type: 'comprehensive',
    name: 'Полный анализ',
    description: 'ML алгоритмы + расширенные GPT инсайты',
    questions: 25,
    estimatedTime: '30-45 мин',
    icon: <Brain className="h-5 w-5" />
  }
];

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string>('');

  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    nickname: '',
    db_type: 'postgresql',
    connection_string: ''
  });

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const response = await fetch('/analytics/connections/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConnections(data);
      } else {
        setError('Не удалось загрузить подключения');
      }
    } catch (err) {
      setError('Ошибка загрузки подключений');
      console.error('Error loading connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/analytics/connections/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newConnection = await response.json();
        setConnections(prev => [...prev, newConnection]);
        setShowAddForm(false);
        setFormData({ nickname: '', db_type: 'postgresql', connection_string: '' });
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Ошибка создания подключения');
      }
    } catch (err) {
      setError('Ошибка создания подключения');
      console.error('Error creating connection:', err);
    }
  };

  const startAnalysis = async (connectionId: number, analysisType: 'quick' | 'standard' | 'comprehensive') => {
    setRunningAnalysis(prev => ({ ...prev, [connectionId]: true }));
    setError('');

    try {
      const response = await fetch(`/analytics/reports/generate-dataframe/${connectionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          analysis_type: analysisType,
          max_questions: analysisType === 'quick' ? 8 : analysisType === 'comprehensive' ? 25 : 15
        })
      });

      if (response.ok) {
        const report = await response.json();
        navigate(`/report/${report.id}?task_id=${report.task_id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Ошибка запуска анализа');
      }
    } catch (err) {
      setError('Ошибка запуска анализа');
      console.error('Error starting analysis:', err);
    } finally {
      setRunningAnalysis(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  const deleteConnection = async (connectionId: number) => {
    if (!confirm('Вы уверены, что хотите удалить это подключение?')) return;

    try {
      const response = await fetch(`/analytics/connections/${connectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      } else {
        setError('Ошибка удаления подключения');
      }
    } catch (err) {
      setError('Ошибка удаления подключения');
      console.error('Error deleting connection:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка подключений...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            DataFrame Analytics
          </h1>
          <p className="text-gray-600">
            Подключайтесь к базам данных и получайте глубокие инсайты с помощью GPT-анализа.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Add Connection Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Добавить подключение
          </button>
        </div>

        {/* Add Connection Form */}
        {showAddForm && (
          <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Новое подключение к базе данных</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название подключения
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Например: Производственная БД"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тип базы данных
                </label>
                <select
                  value={formData.db_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, db_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="sqlite">SQLite</option>
                  <option value="mssql">SQL Server</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Строка подключения
                </label>
                <textarea
                  value={formData.connection_string}
                  onChange={(e) => setFormData(prev => ({ ...prev, connection_string: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="postgresql://user:password@host:port/database"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Сохранить подключение
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Connections List */}
        {connections.length === 0 ? (
          <div className="text-center py-12">
            <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              У вас пока нет подключений.
            </h3>
            <p className="text-gray-500">
              Добавьте первое подключение выше.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {connections.map((conn) => (
              <div key={conn.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {conn.nickname}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Database className="h-4 w-4" />
                      {conn.db_type}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Создано: {new Date(conn.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteConnection(conn.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {analysisTypes.map((analysisType) => (
                    <button
                      key={analysisType.type}
                      onClick={() => startAnalysis(conn.id, analysisType.type)}
                      disabled={runningAnalysis[conn.id]}
                      className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="text-blue-600">
                        {runningAnalysis[conn.id] ?
                          <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                          : analysisType.icon
                        }
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900">
                          {analysisType.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {analysisType.description}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3" />
                          {analysisType.estimatedTime}
                          <span>•</span>
                          {analysisType.questions} вопросов
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
