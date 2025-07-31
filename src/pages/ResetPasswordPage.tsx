import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { KeyRound, Loader } from 'lucide-react';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Неверная или отсутствующая ссылка для сброса пароля.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== passwordConfirm) {
      setError('Пароли не совпадают.');
      return;
    }
    if (!token) {
        setError('Токен сброса пароля отсутствует.');
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.post('/users/password-reset', { token, new_password: newPassword });
      alert('Пароль успешно обновлен. Теперь вы можете войти с новым паролем.');
      navigate('/login');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Произошла ошибка при сбросе пароля.');
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
          <KeyRound className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800 mt-4">Сброс пароля</h2>
          <p className="text-gray-600 mt-1">Введите новый пароль.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Новый пароль"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200"
              required
            />
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Подтвердите новый пароль"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200"
              required
            />
          </div>
          {error && <p className="text-sm text-center text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
          <button type="submit" disabled={isLoading || !token} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold">
            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : 'Сбросить пароль'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;