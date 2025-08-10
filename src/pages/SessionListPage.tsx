// src/pages/SessionListPage.tsx

import { useState, useContext, useEffect } from 'react';
import { AppContext } from '../contexts/AppContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Loader, MessageSquarePlus, MessageSquareText, ChevronRight, BrainCircuit } from 'lucide-react';
import api from '../api';

// Тип для информации о сессии, получаемой с бэкенда
interface ChatSessionInfo {
  id: string;
  file_id: number;
  created_at: string;
  last_updated: string;
  title: string;
}

const SessionListPage = () => {
  const { fileId: fileIdFromUrl } = useParams<{ fileId: string }>();
  const { token, userFiles } = useContext(AppContext)!;
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<ChatSessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fileName = userFiles.find(f => f.file_uid === fileIdFromUrl)?.file_name || 'Выбранный файл';

  useEffect(() => {
    if (!fileIdFromUrl) {
      setError("ID файла не найден в URL.");
      setIsLoading(false);
      return;
    }
    if (token) {
      setIsLoading(true);
      api.get(`/files/${fileIdFromUrl}/sessions`)
        .then(res => {
          setSessions(res.data);
        })
        .catch(err => {
          setError("Не удалось загрузить список диалогов.");
          console.error(err);
        })
        .finally(() => setIsLoading(false));
    }
  }, [fileIdFromUrl, token]);

  const handleCreateNewSession = async () => {
    if (!fileIdFromUrl) return;

    setIsLoading(true);
    try {
      const res = await api.post('/sessions/create', { file_id: fileIdFromUrl });
      const newSession: ChatSessionInfo = res.data;
      // Переходим в новый созданный чат
      navigate(`/chat/${newSession.id}`);
    } catch (err) {
      setError("Не удалось создать новый диалог.");
      console.error(err);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader className="w-10 h-10 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50">
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl"><BrainCircuit className="w-6 h-6 text-white" /></div>
             <div>
                <h1 className="text-2xl font-bold text-gray-800">Диалоги с AI</h1>
                <p className="text-gray-600 truncate">Файл: {fileName}</p>
             </div>
          </div>
        </div>

        <div className="p-6">
            <button
              onClick={handleCreateNewSession}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 mb-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md"
            >
              <MessageSquarePlus className="w-6 h-6" />
              Начать новый диалог
            </button>

            <h2 className="text-lg font-semibold text-gray-700 mb-4">Продолжить диалог:</h2>
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg mb-4">{error}</p>}

            <div className="space-y-3">
              {sessions.length > 0 ? (
                sessions.map(session => (
                  <Link
                    key={session.id}
                    to={`/chat/${session.id}`}
                    className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors group"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                          <p className="font-semibold text-gray-800 flex items-center gap-2"><MessageSquareText className="w-5 h-5 text-gray-400"/>{session.title}</p>
                          <p className="text-sm text-gray-500 mt-1">Последнее обновление: {format(new Date(session.last_updated), 'dd.MM.yyyy HH:mm')}</p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">Для этого файла еще нет диалогов.</p>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SessionListPage;