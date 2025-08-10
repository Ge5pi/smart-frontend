// src/components/UsageWarning.tsx

import { User } from '../api'; // Импортируем тип из api.ts
import { Info, AlertTriangle, ExternalLink } from 'lucide-react';

interface UsageWarningProps {
  user: User;
  pageType: 'chat' | 'reports'; // Определяем, для какой страницы плашка
}

const MESSAGE_LIMIT = 10;
const REPORT_LIMIT = 1;

const UsageWarning = ({ user, pageType }: UsageWarningProps) => {
  const messagesLeft = MESSAGE_LIMIT - user.messages_used;
  const reportsLeft = REPORT_LIMIT - user.reports_used;

  const isMessagesLimitExceeded = messagesLeft <= 0;
  const isReportsLimitExceeded = reportsLeft <= 0;

  // Не показывать ничего, если лимиты для данной страницы не исчерпаны
  if (pageType === 'chat' && !isMessagesLimitExceeded) return null;
  if (pageType === 'reports' && !isReportsLimitExceeded) return null;

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md shadow-md mb-6 animate-pulse">
      <div className="flex">
        <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0" />
        <div>
          <p className="font-bold">Лимит бесплатного тарифа исчерпан</p>
          <p className="text-sm mt-1">
            Вы использовали все бесплатные {pageType === 'chat' ? 'сообщения AI' : 'генерации отчетов'}.
          </p>
          <button className="mt-2 inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors">
            Перейти на платный тариф <ExternalLink className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsageWarning;