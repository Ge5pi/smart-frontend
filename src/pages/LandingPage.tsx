import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
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

// Компонент-обертка для плавной анимации секций при скролле
const AnimatedSection = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.section
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 40 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  );
};

// Анимированные карточки с микро-взаимодействием
const FeatureCard = ({ icon: Icon, title, desc }: { icon: any; title:string; desc: string }) => (
  <motion.div
    whileHover={{ scale: 1.03, y: -5 }}
    transition={{ type: 'spring', stiffness: 300 }}
    className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm"
  >
    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
      <Icon size={24} />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{desc}</p>
  </motion.div>
);

const Step = ({ num, title, desc }: { num: string; title: string; desc: string }) => (
  <div className="relative p-6 bg-white rounded-2xl border border-gray-200 h-full">
    <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
      {num}
    </div>
    <h4 className="text-lg font-semibold text-gray-900 mb-2 mt-4">{title}</h4>
    <p className="text-gray-600">{desc}</p>
  </div>
);

const PreviewCard = ({ title, desc, children }: any) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -4 }}
    transition={{ type: 'spring', stiffness: 300 }}
    className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm h-full flex flex-col"
  >
    <div className="p-5 border-b border-gray-100">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600 text-sm mt-1">{desc}</p>
    </div>
    <div className="p-4 bg-gray-50 flex-grow">{children}</div>
  </motion.div>
);

const Testimonial = ({ quote, author, role }: { quote: string; author: string; role: string }) => (
  <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm h-full">
    <p className="text-gray-800 italic">“{quote}”</p>
    <div className="mt-4 text-sm text-gray-600">
      <span className="font-semibold text-gray-900">{author}</span> - {role}
    </div>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERO */}
      <header className="relative overflow-hidden">
        <div className="aurora-background"></div>
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid md:grid-cols-2 gap-10 items-center"
          >
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 backdrop-blur-sm text-blue-700 text-sm font-medium border border-blue-100 mb-4">
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition-colors"
                >
                  Начать бесплатно
                  <ArrowRight size={18} />
                </motion.button>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                   <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-gray-300 text-gray-800 font-semibold hover:border-gray-400 hover:bg-white transition-all"
                  >
                    Войти
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Мокап с анимацией */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
              className="bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-lg p-6"
            >
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
              <div className="mt-6 p-4 bg-gray-50/80 rounded-xl border border-gray-200">
                <div className="text-sm text-gray-700 font-medium mb-2">AI-диалог</div>
                <div className="rounded-lg border border-gray-200 bg-white p-3 text-gray-600 text-sm">
                  Какой столбец сильнее всего влияет на зарплату?
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 mt-2 text-gray-800 text-sm">
                  Модель построила корреляции. Наибольшее влияние у «Опыт_лет» (r=0.62).
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </header>

      <AnimatedSection className="max-w-7xl mx-auto px-6 py-16">
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
      </AnimatedSection>

      <AnimatedSection className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          <PreviewCard title="Визуализация" desc="Интерактивные графики на Chart.js с аккуратными пресетами.">
            {/* Тут может быть ваш компонент графика */}
            <div className="h-44 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
              <LineChart size={48} className="text-gray-300"/>
            </div>
            <div className="mt-3 flex gap-2">
              <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm">Histogram</span>
              <span className="px-3 py-1 rounded-lg bg-purple-50 text-purple-700 text-sm">Pie</span>
              <span className="px-3 py-1 rounded-lg bg-teal-50 text-teal-700 text-sm">Scatter</span>
            </div>
          </PreviewCard>

          <PreviewCard title="AI-диалог" desc="Контекстная сессия по конкретному файлу: объяснения, выводы, шаги.">
            <div className="space-y-2">
              <div className="rounded-lg border bg-white p-3 text-gray-600 text-sm">Покажи топ-5 строк по зарплате</div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-gray-800 text-sm">
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
              <div className="p-2 rounded-lg bg-green-50 text-green-700 text-center">Корреляции</div>
              <div className="p-2 rounded-lg bg-yellow-50 text-yellow-700 text-center">Гипотезы</div>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700 text-center">Кластеры</div>
            </div>
          </PreviewCard>
        </div>
      </AnimatedSection>

      <AnimatedSection className="max-w-7xl mx-auto px-6 pb-16">
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
      </AnimatedSection>

      <AnimatedSection className="max-w-7xl mx-auto px-6 pb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Нам доверяют</h2>
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
      </AnimatedSection>

      <AnimatedSection className="max-w-7xl mx-auto px-6 pb-20">
        <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold">Готовы превратить данные в результат?</h3>
            <p className="text-blue-100 mt-1">Создайте аккаунт и получите первые инсайты уже сегодня.</p>
          </div>
          <div className="flex-shrink-0">
             <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/register"
                className="px-6 py-3 rounded-xl bg-white text-blue-600 font-semibold shadow-lg hover:bg-gray-200 transition-colors"
              >
                Начать бесплатно
              </Link>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
};

export default LandingPage;