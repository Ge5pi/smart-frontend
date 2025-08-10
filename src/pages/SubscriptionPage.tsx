import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../contexts/AppContext';
import api from '../api';
import { Loader2, Send, Star, CheckCircle } from 'lucide-react';

const SubscriptionPage: React.FC = () => {
  const { user } = useContext(AppContext)!;
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Пожалуйста, введите ваше имя.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/users/subscribe', { customer_name: name });
      setSuccess(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail ?? 'Произошла ошибка при отправке заявки.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Экран после успешной отправки
  if (success) {
    return (
      <div className="max-w-md mx-auto mt-10 text-center p-8 bg-white rounded-lg shadow-lg">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Заявка успешно отправлена!</h1>
        <p className="text-gray-600">
          Мы получили вашу заявку и отправили подтверждение на вашу почту <span className="font-semibold">{user.email}</span>.
          Наши менеджеры свяжутся с вами в течение часа.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  // Основная форма
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div>
          <Star className="mx-auto h-12 w-auto text-blue-600" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Заявка на подписку
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Оставьте заявку, и мы свяжемся с вами в течение часа для оформления.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div>
            <label htmlFor="name" className="sr-only">
              Ваше имя
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Ваше имя"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Заказать подписку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionPage;