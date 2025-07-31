import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Mail, KeyRound, Loader } from 'lucide-react';

const EmailVerificationPage = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await api.post('/users/verify-email', { email, code });
      alert('Email успешно подтвержден. Теперь вы можете войти.');
      navigate('/login');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Произошла ошибка при подтверждении email. Пожалуйста, проверьте код и email.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
        <div className="flex flex-col items-center mb-6">
          <Mail className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800 mt-4">Подтверждение Email</h2>
          <p className="text-gray-600 mt-1">Введите код, отправленный на ваш email.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200"
              required
            />
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Код подтверждения"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200"
              required
            />
          </div>
          {error && <p className="text-sm text-center text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold">
            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : 'Подтвердить'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmailVerificationPage;