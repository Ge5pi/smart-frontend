import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BrainCircuit,
  Database,
  Sparkles,
  ShieldCheck,
  LineChart,
  PieChart,
  ScatterChart,
  CheckCircle,
  ArrowRight,
  Zap,
  FileText,
} from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
      <Icon size={24} />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{desc}</p>
  </div>
);

const Step = ({ num, title, desc }: { num: string; title: string; desc: string }) => (
  <div className="relative p-6 bg-white rounded-2xl border border-gray-200">
    <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
      {num}
    </div>
    <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
    <p className="text-gray-600">{desc}</p>
  </div>
);

const PreviewCard = ({ title, desc, children }: any) => (
  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
    <div className="p-5 border-b border-gray-100">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600 text-sm mt-1">{desc}</p>
    </div>
    <div className="p-4 bg-gray-50">{children}</div>
  </div>
);

const Testimonial = ({ quote, author, role }: { quote: string; author: string; role: string }) => (
  <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
    <div className="text-gray-800 italic">“{quote}”</div>
    <div className="mt-4 text-sm text-gray-600">
      <span className="font-semibold text-gray-900">{author}</span> - {role}
    </div>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* HERO */}
      <header className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100 mb-4">
                <Sparkles size={16} />
                Аналитика данных за минуты
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                Загружайте данные. Стройте графики. Задавайте вопросы AI.
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Единая платформа для загрузки данных, очистки, визуализации и интеллектуального
                анализа. Поддержка CSV/Excel и подключений к базам (PostgreSQL, SQL Server).
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                >
                  Начать бесплатно
                  <ArrowRight size={18} />
                </button>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-800 font-semibold hover:border-gray-400"
                >
                  Войти
                </Link>
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-green-600" size={18} />
                  Безопасность данных
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="text-yellow-500" size={18} />
                  Быстрые отчеты
                </div>
              </div>
            </div>

            {/* Визуальный мокап */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BarChart3 />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Data Insight</div>
                  <div className="text-gray-500 text-sm">Визуализация и AI-анализ</div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="h-24 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                  <LineChart className="opacity-80" />
                </div>
                <div className="h-24 bg-purple-50 rounded-lg border border-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                  <PieChart className="opacity-80" />
                </div>
                <div className="h-24 bg-teal-50 rounded-lg border border-teal-100 flex items-center justify-center text-teal-600 font-semibold">
                  <ScatterChart className="opacity-80" />
                </div>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-sm text-gray-700 font-medium mb-2">AI-диалог</div>
                <div className="rounded-lg border border-gray-200 bg-white p-3 text-gray-600">
                  Какой столбец сильнее всего влияет на зарплату?
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 mt-2 text-gray-800">
                  Модель построила корреляции. Наибольшее влияние у «Опыт_лет» (r=0.62).
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ПРЕИМУЩЕСТВА */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Что вы получите</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <FeatureCard
            icon={BarChart3}
            title="Быстрые визуализации"
            desc="Гистограммы, линейные, круговые, scatter, bubble и boxplot — в пару кликов."
          />
          <FeatureCard
            icon={BrainCircuit}
            title="AI-агент"
            desc="Задавайте вопросы на естественном языке. Получайте объяснения, гипотезы и инсайты."
          />
          <FeatureCard
            icon={Database}
            title="Подключение к БД"
            desc="Поддержка PostgreSQL и SQL Server. Запускайте анализ и получайте отчеты."
          />
          <FeatureCard
            icon={CheckCircle}
            title="Очистка данных"
            desc="Заполнение пропусков, поиск выбросов, кодирование категорий. Готовьте датасет к анализу."
          />
        </div>
      </section>

      {/* ПРЕВЬЮ ФУНКЦИЙ */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          <PreviewCard title="Визуализация" desc="Интерактивные графики на Chart.js с аккуратными пресетами.">
            <div className="h-44 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-500">
              Превью графика (Line/Pie/Scatter)
            </div>
            <div className="mt-3 flex gap-2">
              <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm">Histogram</span>
              <span className="px-3 py-1 rounded-lg bg-purple-50 text-purple-700 text-sm">Pie</span>
              <span className="px-3 py-1 rounded-lg bg-teal-50 text-teal-700 text-sm">Scatter</span>
            </div>
          </PreviewCard>

          <PreviewCard title="AI-диалог" desc="Контекстная сессия по конкретному файлу: объяснения, выводы, шаги.">
            <div className="space-y-2">
              <div className="rounded-lg border p-3 text-gray-600">Покажи топ-5 строк по зарплате</div>
              <div className="rounded-lg border bg-blue-50 p-3 text-gray-800">
                Отобраны строки. Средняя зарплата в выборке: 185k. Хотите построить график распределения?
              </div>
            </div>
          </PreviewCard>

          <PreviewCard title="Анализ БД" desc="Старт задачи, статус отчета, просмотр результатов.">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Отчет #1294</div>
                <div className="text-gray-500 text-sm">Завершен - 12 мин назад</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-green-50 text-green-700">Корреляции</div>
              <div className="p-2 rounded-lg bg-yellow-50 text-yellow-700">Гипотезы</div>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700">Кластеры</div>
            </div>
          </PreviewCard>
        </div>
      </section>

      {/* КАК ЭТО РАБОТАЕТ */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Как это работает</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Step
            num="1"
            title="Загрузите файл или подключитесь к БД"
            desc="CSV/Excel или строка подключения PostgreSQL/SQL Server — секунды на старт."
          />
          <Step
            num="2"
            title="Очистите и визуализируйте"
            desc="Заполните пропуски, найдите выбросы, закодируйте категории, постройте графики."
          />
          <Step
            num="3"
            title="Спросите AI"
            desc="Получите пояснения, гипотезы, отчеты и готовые инсайты — в диалоге."
          />
        </div>
      </section>

      {/* СОЦДОКАЗАТЕЛЬСТВО */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          <Testimonial
            quote="За вечер собрали отчет по продажам и нашли три гипотезы, которые увеличили конверсию."
            author="Анна"
            role="Продуктовый аналитик"
          />
          <Testimonial
            quote="Подключил продовую базу и получил читаемый отчет с корреляциями и кластерами."
            author="Дмитрий"
            role="Data Engineer"
          />
          <Testimonial
            quote="AI-агент помог быстро объяснить выбросы и построить корректные визуализации."
            author="Мария"
            role="Маркетолог"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="p-8 rounded-2xl border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Готовы начать?</h3>
            <p className="text-gray-700 mt-1">Создайте аккаунт и получите первые инсайты уже сегодня.</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
            >
              Зарегистрироваться
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-800 font-semibold hover:border-gray-400"
            >
              Войти
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
