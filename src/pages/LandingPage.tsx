import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  BrainCircuit,
  Database,
  Sparkles,
  ShieldCheck,
  Zap,
  FileText,
  ArrowRight,
  PieChart,
} from 'lucide-react';

// Компонент-обертка для анимации появления при скролле
const AnimatedSection = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.section
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  );
};

// Карточка для Bento Grid
const FeatureCard = ({ icon: Icon, title, desc, className = '' }: { icon: any; title: string; desc: string; className?: string }) => (
  <motion.div
    whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
    className={`p-6 bg-white/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-lg transition-shadow cursor-pointer ${className}`}
  >
    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
      <Icon size={24} />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{desc}</p>
  </motion.div>
);


const Step = ({ num, title, desc }: { num: string; title: string; desc: string }) => (
  <div className="relative p-6 bg-white rounded-2xl border border-gray-200">
    <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
      {num}
    </div>
    <h3 className="font-bold text-xl text-gray-900 mt-6 mb-2">{title}</h3>
    <p className="text-gray-600">{desc}</p>
  </div>
);

const Testimonial = ({ quote, author, role }: { quote: string; author: string; role: string }) => (
  <div className="p-6 bg-white rounded-2xl border border-gray-200 text-center flex flex-col items-center">
    <Sparkles className="text-blue-500 mb-4" />
    <blockquote className="text-gray-700 italic mb-4">"{quote}"</blockquote>
    <p className="font-semibold text-gray-900">{author}</p>
    <p className="text-sm text-gray-500">{role}</p>
  </div>
);

export default function LandingPage() {
  return (
    <div className="bg-gray-50 text-gray-800">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center text-center px-6 overflow-hidden">
        <div className="aurora-background"></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="z-10"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-4">
            Превратите данные <br /> в{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
              решения
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 mb-8">
            Наша AI-платформа анализирует ваши данные, находит скрытые инсайты и помогает принимать верные решения для роста вашего бизнеса.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
            className="flex gap-4 justify-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/register"
                className="px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition-colors"
              >
                Попробовать бесплатно <ArrowRight className="inline ml-2" size={16} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/login"
                className="px-8 py-3 rounded-xl bg-white/80 backdrop-blur-md text-gray-800 font-semibold shadow-md hover:bg-white transition-colors"
              >
                Демо
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section (Bento Grid) */}
      <AnimatedSection className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Все, что нужно для аналитики</h2>
        <p className="text-lg text-gray-600 text-center mb-12 max-w-3xl mx-auto">От сбора данных до автоматических отчетов — наша платформа покрывает весь цикл работы с данными.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={Database}
            title="Интеграция в 1 клик"
            desc="Подключайте базы данных, CRM и другие источники без написания кода."
            className="md:col-span-1"
          />
          <FeatureCard
            icon={BrainCircuit}
            title="AI-ассистент"
            desc="Задавайте вопросы на естественном языке и получайте развернутые ответы с графиками."
            className="md:col-span-2"
          />
          <FeatureCard
            icon={PieChart}
            title="Автоматическая визуализация"
            desc="Платформа сама подбирает лучшие типы графиков для ваших данных."
            className="md:col-span-2"
          />
          <FeatureCard
            icon={Zap}
            title="Мгновенные инсайты"
            desc="AI находит аномалии, тренды и корреляции, которые вы могли упустить."
            className="md:col-span-1"
          />
           <FeatureCard
            icon={FileText}
            title="Готовые отчеты"
            desc="Создавайте кастомизируемые дашборды и делитесь ими с командой."
            className="md:col-span-1"
          />
           <FeatureCard
            icon={ShieldCheck}
            title="Безопасность и контроль"
            desc="Ваши данные надежно защищены и доступны только вам."
            className="md:col-span-2"
          />
        </div>
      </AnimatedSection>

      {/* How It Works Section */}
      <AnimatedSection className="max-w-7xl mx-auto px-6 py-20 bg-blue-50/50 rounded-3xl">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Начать проще простого</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Step
            num="1"
            title="Подключите данные"
            desc="Загрузите файл или подключите вашу базу данных. Это займет не больше 5 минут."
          />
          <Step
            num="2"
            title="Задайте вопрос"
            desc="Спросите нашего AI-ассистента, например: 'Какие каналы принесли больше всего прибыли в прошлом квартале?'"
          />
          <Step
            num="3"
            title="Получите инсайт"
            desc="Мгновенно получите готовый отчет с визуализациями и текстовым объяснением."
          />
        </div>
      </AnimatedSection>

      {/* Testimonials Section */}
      <AnimatedSection className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Нам доверяют профессионалы</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Testimonial
            quote="Платформа сэкономила нам десятки часов ручной работы по подготовке отчетов."
            author="Алексей"
            role="Product Manager"
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

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
         <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="p-10 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 flex flex-col md:flex-row items-center justify-between gap-6 text-white"
        >
          <div>
            <h3 className="text-3xl font-bold">Готовы начать?</h3>
            <p className="text-blue-100 mt-2">Создайте аккаунт и получите первые инсайты уже сегодня. Бесплатно.</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
             <Link
              to="/register"
              className="px-8 py-4 rounded-xl bg-white text-blue-600 font-bold shadow-lg hover:bg-gray-100 transition-colors shrink-0"
            >
              Зарегистрироваться
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}