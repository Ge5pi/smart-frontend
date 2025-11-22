import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { Mail, KeyRound, Loader } from 'lucide-react';

const EmailVerificationPage = () => {
  const { t } = useTranslation();
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
      alert(t('emailVerification.alertSuccess'));
      navigate('/login');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError(t('emailVerification.errorDefault'));
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
        <div className="flex flex-col items-center mb-6">
          <Mail className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800 mt-4">
            {t('emailVerification.title')}
          </h2>
          <p className="text-gray-600 mt-1">
            {t('emailVerification.subtitle')}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('emailVerification.emailPlaceholder')}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200"
              required
            />
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          </div>
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={t('emailVerification.codePlaceholder')}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200"
              required
            />
            <KeyRound className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          </div>
          {error && (
            <p className="text-red-500 text-sm">{t('emailVerification.error', { error })}</p>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? <Loader className="mr-2 animate-spin" /> : t('emailVerification.submitButton')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
