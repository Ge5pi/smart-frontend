import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Database, BotMessageSquare, LogIn, UserPlus, LogOut, BarChartHorizontal, Globe } from 'lucide-react';
import { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { useTranslation } from 'react-i18next';

const Layout = () => {
  const { user, logout, fileId } = useContext(AppContext)!;
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'en' ? 'ru' : 'en';
    await i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 font-sans">
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-20">
        <div className="mx-auto px-6 py-4 flex items-center justify-between">
          {/* Левая часть: Логотип и Навигация */}
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Database className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {t('app.title')}
              </h1>
            </div>
            <nav className="flex items-center gap-2">
              <NavLink
                to="/main"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-medium font-medium transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                {t('nav.tools')}
              </NavLink>

              <NavLink
                to={`/files/${fileId}/sessions`}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-medium font-medium transition-colors ${
                    isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                  } ${!fileId ? 'opacity-50 cursor-not-allowed' : ''}`
                }
                onClick={(e) => !fileId && e.preventDefault()}
              >
                <BotMessageSquare className="w-4 h-4" />
                {t('nav.aiAgent')}
              </NavLink>

              <NavLink
                to="/charts"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-medium font-medium transition-colors ${
                    isActive ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:bg-gray-100'
                  } ${!fileId ? 'opacity-50 cursor-not-allowed' : ''}`
                }
                onClick={(e) => !fileId && e.preventDefault()}
              >
                <BarChartHorizontal className="w-4 h-4" />
                {t('nav.charts')}
              </NavLink>

              <NavLink
                to="/connections"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-medium font-medium transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                {t('nav.dbAnalysis')}
              </NavLink>

              <NavLink
                to="/subscribe"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-medium font-medium transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                {t('nav.subscribe')}
              </NavLink>
            </nav>
          </div>

          {/* Правая часть: Переключатель языка и Статус пользователя */}
          <div className="flex items-center gap-4">
            {/* Переключатель языка */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              title={i18n.language === 'en' ? 'Switch to Russian' : 'Переключить на английский'}
            >
              <Globe className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">
                {i18n.language === 'en' ? 'RU' : 'EN'}
              </span>
            </button>

            {user ? (
              <>
                <span className="text-sm text-gray-700">
                  {t('auth.loggedInAs')}: <span className="font-semibold">{user.email}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('auth.logout')}
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  {t('auth.login')}
                </NavLink>
                <NavLink
                  to="/register"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  {t('auth.register')}
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
