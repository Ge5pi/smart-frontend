import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { BarChart3, BrainCircuit, Database, Sparkles, LineChart, PieChart, ScatterChart, CheckCircle, ArrowRight, FileText } from 'lucide-react';
import graph from '../assets/graph.png';
import { useTranslation } from 'react-i18next';

const AnimatedSection = ({ children, className }: { children: React.ReactNode; className?: string }) => {
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

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
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
    <p className="text-gray-800 italic">"{quote}"</p>
    <div className="mt-4 text-sm text-gray-600">
      <span className="font-semibold text-gray-900">{author}</span> — {role}
    </div>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
                {t('landing.hero.badge')}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                {t('landing.hero.title')}
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                {t('landing.hero.subtitle')}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition-colors"
                >
                  {t('landing.hero.cta')}
                  <ArrowRight size={18} />
                </motion.button>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-gray-300 text-gray-800 font-semibold hover:border-gray-400 hover:bg-white transition-all"
                  >
                    {t('landing.hero.login')}
                  </Link>
                </motion.div>
              </div>
            </motion.div>

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
                  <div className="font-semibold text-gray-900">{t('landing.mockup.title')}</div>
                  <div className="text-gray-500 text-sm">{t('landing.mockup.desc')}</div>
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
                <div className="text-sm text-gray-700 font-medium mb-2">{t('landing.mockup.dialogTitle')}</div>
                <div className="rounded-lg border border-gray-200 bg-white p-3 text-gray-600 text-sm">
                  {t('landing.mockup.dialogQuestion')}
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 mt-2 text-gray-800 text-sm">
                  {t('landing.mockup.dialogAnswer')}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* FEATURES */}
      <AnimatedSection className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">{t('landing.features.title')}</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <FeatureCard icon={BarChart3} title={t('landing.features.visual.title')} desc={t('landing.features.visual.desc')} />
          <FeatureCard icon={BrainCircuit} title={t('landing.features.ai.title')} desc={t('landing.features.ai.desc')} />
          <FeatureCard icon={Database} title={t('landing.features.db.title')} desc={t('landing.features.db.desc')} />
          <FeatureCard icon={CheckCircle} title={t('landing.features.clean.title')} desc={t('landing.features.clean.desc')} />
        </div>
      </AnimatedSection>

      {/* PREVIEW */}
      <AnimatedSection className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          <PreviewCard title={t('landing.preview.visual.title')} desc={t('landing.preview.visual.desc')}>
            <div className="h-44 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
              <img src={graph} alt="Image" />
            </div>
            <div className="mt-3 flex gap-2">
              <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm">{t('landing.preview.hist')}</span>
              <span className="px-3 py-1 rounded-lg bg-purple-50 text-purple-700 text-sm">{t('landing.preview.pie')}</span>
              <span className="px-3 py-1 rounded-lg bg-teal-50 text-teal-700 text-sm">{t('landing.preview.scatter')}</span>
            </div>
          </PreviewCard>

          <PreviewCard title={t('landing.preview.dialog.title')} desc={t('landing.preview.dialog.desc')}>
            <div className="space-y-2">
              <div className="rounded-lg border bg-white p-3 text-gray-600 text-sm">{t('landing.preview.dialog.user')}</div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-gray-800 text-sm">{t('landing.preview.dialog.ai')}</div>
            </div>
          </PreviewCard>

          <PreviewCard title={t('landing.preview.db.title')} desc={t('landing.preview.db.desc')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{t('landing.preview.db.report')}</div>
                <div className="text-gray-500 text-sm">{t('landing.preview.db.status')}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-green-50 text-green-700 text-center">{t('landing.preview.db.corr')}</div>
              <div className="p-2 rounded-lg bg-yellow-50 text-yellow-700 text-center">{t('landing.preview.db.hypo')}</div>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700 text-center">{t('landing.preview.db.clust')}</div>
            </div>
          </PreviewCard>
        </div>
      </AnimatedSection>

      {/* STEPS */}
      <AnimatedSection className="max-w-7xl mx-auto px-6 pb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">{t('landing.steps.title')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Step num="1" title={t('landing.steps.1.title')} desc={t('landing.steps.1.desc')} />
          <Step num="2" title={t('landing.steps.2.title')} desc={t('landing.steps.2.desc')} />
          <Step num="3" title={t('landing.steps.3.title')} desc={t('landing.steps.3.desc')} />
        </div>
      </AnimatedSection>

      {/* TESTIMONIALS */}
      <AnimatedSection className="max-w-7xl mx-auto px-6 pb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">{t('landing.testimonials.title')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Testimonial quote={t('landing.testimonials.1.quote')} author={t('landing.testimonials.1.author')} role={t('landing.testimonials.1.role')} />
          <Testimonial quote={t('landing.testimonials.2.quote')} author={t('landing.testimonials.2.author')} role={t('landing.testimonials.2.role')} />
          <Testimonial quote={t('landing.testimonials.3.quote')} author={t('landing.testimonials.3.author')} role={t('landing.testimonials.3.role')} />
        </div>
      </AnimatedSection>

      {/* FINAL CTA */}
      <AnimatedSection className="max-w-7xl mx-auto px-6 pb-20">
        <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold">{t('landing.final.title')}</h3>
            <p className="text-blue-100 mt-1">{t('landing.final.subtitle')}</p>
          </div>
          <div className="flex-shrink-0">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/register"
                className="px-6 py-3 rounded-xl bg-white text-blue-600 font-semibold shadow-lg hover:bg-gray-200 transition-colors"
              >
                {t('landing.final.cta')}
              </Link>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
};

export default LandingPage;