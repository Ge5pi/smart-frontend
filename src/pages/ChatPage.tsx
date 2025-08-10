import { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../contexts/AppContext';
import { useNavigate, useParams } from 'react-router-dom'; // Импортируем useParams
import ReactMarkdown from 'react-markdown';
import { Send, Loader, BrainCircuit, ShieldAlert } from 'lucide-react';
import api from '../api';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

// Тип для сообщений, приходящих от API
type ApiChatMessage = {
  id: number;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const MESSAGE_LIMIT = 10;

const ChatPage = () => {
  // Используем хук useParams для получения sessionId из URL (например, /chat/xxxx-xxxx-xxxx)
  const { sessionId } = useParams<{ sessionId: string }>();
  // Контекст используется для получения данных о пользователе и токене
  const { token, user } = useContext(AppContext)!;
  const navigate = useNavigate();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentQuery, setCurrentQuery] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  // Переименовали isSessionLoading в isHistoryLoading для ясности
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Эти состояния сохранены из оригинального файла, хотя и не используются в новой логике
  const [activeSessionFileId, setActiveSessionFileId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const isChatLimitReached = user && !user.is_active && user.messages_used >= MESSAGE_LIMIT;

  // Этот useEffect теперь отвечает за загрузку истории конкретного чата
  useEffect(() => {
    // Если sessionId не определён в URL, отправляем пользователя на главную
    if (!sessionId) {
      alert("ID сессии не указан. Пожалуйста, выберите чат из списка.");
      navigate('/');
      return;
    }

    if (token) {
        setIsHistoryLoading(true);
        setError(null);

        // Запрашиваем историю по ID сессии
        api.get(`/sessions/${sessionId}/history`)
            .then(res => {
                const history: ApiChatMessage[] = res.data.history;
                // Форматируем данные из API в состояние, используемое для рендеринга
                const formattedHistory: ChatMessage[] = history.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));
                setChatHistory(formattedHistory);
            })
            .catch(err => {
                const message = err.response?.data?.detail || "Не удалось загрузить историю чата. Возможно, у вас нет доступа к этой сессии.";
                setError(message);
                console.error("Ошибка загрузки истории чата", err);
            })
            .finally(() => setIsHistoryLoading(false));
    }
  }, [sessionId, token, navigate]); // Эффект перезапускается при смене sessionId

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSendQuery = async () => {
    // Проверяем, что ID сессии есть, перед отправкой
    if (isChatLimitReached || !currentQuery.trim() || !sessionId || isReplying || !token) return;

    const userMessage: ChatMessage = { role: 'user', content: currentQuery };
    setChatHistory(prev => [...prev, userMessage]);
    const queryToSend = currentQuery;
    setCurrentQuery("");
    setIsReplying(true);
    setError(null);

    const formData = new FormData();
    formData.append("session_id", sessionId); // Используем ID из URL
    formData.append("query", queryToSend);

    try {
      const res = await api.post("/sessions/ask", formData);
      const assistantMessage: ChatMessage = { role: 'assistant', content: res.data.answer };
      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (err: any) {
        const message = err.response?.data?.detail || "Произошла ошибка при обработке вашего запроса.";
        setError(message);
        // В случае ошибки, убираем оптимистично добавленное сообщение пользователя
        setChatHistory(prev => prev.slice(0, -1));
        console.error(err);
    } finally {
      setIsReplying(false);
    }
  };

  // Рендеринг состояния загрузки
  if (isHistoryLoading) {
    return <div className="flex justify-center items-center h-64 text-lg font-medium text-gray-600"><Loader className="animate-spin mr-4" /> Загружаем историю диалога...</div>;
  }

  // Оригинальная проверка на fileId/sessionId больше не нужна в таком виде,
  // так как загрузка зависит от isHistoryLoading
  if (!sessionId) {
      return <div className="flex justify-center items-center h-64 text-lg font-medium text-gray-600">Неверный ID сессии.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50">
            <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-indigo-50 to-blue-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl"><BrainCircuit className="w-6 h-6 text-white" /></div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Диалог с AI Агентом</h2>
                        <p className="text-sm text-gray-500 mt-1">Задавайте вопросы на естественном языке</p>
                    </div>
                </div>
                {sessionId && <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-mono rounded-full">Session: {sessionId.substring(0,8)}...</span>}
            </div>

            <div className="p-6 space-y-4 h-[600px] flex flex-col">
                <div className="flex-grow overflow-y-auto space-y-6 pr-4">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      {msg.role === 'assistant' && (<div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex-shrink-0"></div>)}
                      <div className={`max-w-xl p-4 rounded-2xl prose prose-sm max-w-none ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                        <ReactMarkdown children={msg.content} />
                      </div>
                    </div>
                  ))}
                  {isReplying && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex-shrink-0"></div>
                      <div className="p-4 bg-gray-100 rounded-2xl rounded-bl-none"><Loader className="w-5 h-5 text-gray-500 animate-spin" /></div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex-shrink-0 pt-4 border-t border-gray-200/80">
                  {isChatLimitReached ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center text-yellow-800">
                      <ShieldAlert className="w-6 h-6 mr-3 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Лимит сообщений исчерпан</p>
                        <p className="text-sm">Вы использовали все бесплатные сообщения ({user?.messages_used} из {MESSAGE_LIMIT}). Чтобы продолжить, оформите подписку.</p>
                        <button
                          onClick={() => navigate('/subscribe')}
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold">
                            Оформить подписку
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text" value={currentQuery} onChange={(e) => setCurrentQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendQuery()}
                        placeholder={sessionId ? "Например: 'покажи топ 5 строк по зарплате'" : "Загрузка сессии..."}
                        className="w-full pl-4 pr-12 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        disabled={!sessionId || isReplying || isHistoryLoading}
                      />
                      <button onClick={handleSendQuery} disabled={!sessionId || isReplying || !currentQuery.trim() || isHistoryLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors">
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
            </div>
            {error && <div className="p-4 border-t border-red-200 bg-red-50 text-red-700">{error}</div>}
        </div>
    </div>
  );
};

export default ChatPage;