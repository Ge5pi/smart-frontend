import { useState, useContext } from 'react';
import { useNavigate, Link  } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../contexts/AppContext';
import api from '../api';
import { KeyRound, Mail, Loader, LogIn } from 'lucide-react';

const LoginPage = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useContext(AppContext)!;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        try {
            const res = await api.post('/token', formData);
            const token = res.data.access_token;

            login(token);
            navigate("/main", { replace: true });

        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail);
            } else {
                setError(t('login.errorDefault'));
            }
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
        <div className="flex flex-col items-center mb-6">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mb-4">
                <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{t('login.title')}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="email" placeholder={t('login.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2" required />
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="password" placeholder={t('login.passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2" required />
          </div>
          <div className="relative text-right">
              <Link to="/request-password-reset" className="text-sm font-semibold text-blue-600 hover:text-blue-500">{t('login.forgotPassword')}</Link>
          </div>
          {error && <p className="text-sm text-center text-red-600 bg-red-100 p-3 rounded-lg">{t('login.error', { error })}</p>}
          <button type="submit" disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold">
            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : t('login.submit')}
          </button>
          <div className="relative">
            <p className="text-gray-600 px-1 font-semibold gap-2 inline text-lg">{t('login.noAccount')}</p>
            <a href="/register">
              <h3 className="text-lg gap-2 text-green-600 inline font-bold">{t('login.register')}</h3>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
