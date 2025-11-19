import { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../contexts/AppContext';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Send, Loader, BrainCircuit, ShieldAlert } from 'lucide-react';
import api from '../api';
import { useTranslation } from 'react-i18next';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ApiChatMessage = {
  id: number;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const MESSAGE_LIMIT = 10;

const ChatPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { token, user } = useContext(AppContext)!;
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentQuery, setCurrentQuery] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const isChatLimitReached = user && !user.is_active && user.messages_used >= MESSAGE_LIMIT;

  useEffect(() => {
    if (!sessionId) {
      alert(t('chat.noSessionAlert'));
      navigate('/main');
      return;
    }

    if (token) {
        setIsHistoryLoading(true);
        setError(null);

        api.get(`/sessions/${sessionId}/history`)
            .then(res => {
                const history: ApiChatMessage[] = res.data.history;
                const formattedHistory: ChatMessage[] = history.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));
                setChatHistory(formattedHistory);
            })
            .catch(err => {
                const message = err.response?.data?.detail || t('chat.errors.loadHistory');
                setError(message);
                console.error("Error loading chat history", err);
            })
            .finally(() => setIsHistoryLoading(false));
    }
  }, [sessionId, token, navigate, t]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSendQuery = async () => {
    if (isChatLimitReached || !currentQuery.trim() || !sessionId || isReplying || !token) return;

    const userMessage: ChatMessage = { role: 'user', content: currentQuery };
    setChatHistory(prev => [...prev, userMessage]);
    const queryToSend = currentQuery;
    setCurrentQuery("");
    setIsReplying(true);
    setError(null);

    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("query", queryToSend);

    try {
      const res = await api.post("/sessions/ask", formData);
      const assistantMessage: ChatMessage = { role: 'assistant', content: res.data.answer };
      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (err: any) {
        const message = err.response?.data?.detail || t('chat.errors.processRequest');
        setError(message);
        setChatHistory(prev => prev.slice(0, -1));
        console.error(err);
    } finally {
      setIsReplying(false);
    }
  };

  if (isHistoryLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-lg font-medium text-gray-600">
        <Loader className="animate-spin mr-4" /> {t('chat.loadingHistory')}
      </div>
    );
  }

  if (!sessionId) {
      return (
        <div className="flex justify-center items-center h-64 text-lg font-medium text-gray-600">
          {t('chat.invalidSession')}
        </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50">
            <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-indigo-50 to-blue-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl">
                      <BrainCircuit className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">{t('chat.title')}</h2>
                        <p className="text-sm text-gray-500 mt-1">{t('chat.subtitle')}</p>
                    </div>
                </div>
                {sessionId && (
                  <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-mono rounded-full">
                    {t('chat.session')}: {sessionId.substring(0,8)}...
                  </span>
                )}
            </div>

            <div className="p-6 space-y-4 h-[600px] flex flex-col">
                <div className="flex-grow overflow-y-auto space-y-6 pr-4">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex-shrink-0"></div>
                      )}
                      <div className={`max-w-xl p-4 rounded-2xl prose prose-sm max-w-none ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}>
                        <ReactMarkdown children={msg.content} />
                      </div>
                    </div>
                  ))}
                  {isReplying && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex-shrink-0"></div>
                      <div className="p-4 bg-gray-100 rounded-2xl rounded-bl-none">
                        <Loader className="w-5 h-5 text-gray-500 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="flex-shrink-0 pt-4 border-t border-gray-200/80">
                  {isChatLimitReached ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center text-yellow-800">
                      <ShieldAlert className="w-6 h-6 mr-3 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">{t('chat.limit.title')}</p>
                        <p className="text-sm">
                          {t('chat.limit.message', {
                            used: user?.messages_used,
                            limit: MESSAGE_LIMIT
                          })}
                        </p>
                        <button
                          onClick={() => navigate('/subscribe')}
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
                        >
                          {t('chat.limit.subscribe')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={currentQuery}
                        onChange={(e) => setCurrentQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendQuery()}
                        placeholder={sessionId ? t('chat.inputPlaceholder') : t('chat.loadingSession')}
                        className="w-full pl-4 pr-12 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        disabled={!sessionId || isReplying || isHistoryLoading}
                      />
                      <button
                        onClick={handleSendQuery}
                        disabled={!sessionId || isReplying || !currentQuery.trim() || isHistoryLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
            </div>
            {error && (
              <div className="p-4 border-t border-red-200 bg-red-50 text-red-700">{error}</div>
            )}
        </div>
    </div>
  );
};

export default ChatPage;
