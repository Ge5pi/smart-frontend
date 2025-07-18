import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Button,
  Progress,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Label
} from '../components/ui';

import {
  RefreshCw,
  ArrowLeft,
  Star,
  TrendingUp,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap
} from 'lucide-react';

interface MLPattern {
  type: string;
  description: string;
  confidence: number;
}

interface DomainContext {
  domain_type: string;
  confidence: number;
  key_entities: string[];
  business_metrics: string[];
}

interface AnalysisStats {
  questions_processed: number;
  successful_findings: number;
  ml_patterns_found: number;
  tables_coverage: number;
  tables_analyzed: number;
}

interface DiversityReport {
  total_tables: number;
  analyzed_tables: number;
  coverage_percentage: number;
  underanalyzed_tables: string[];
}

interface EnhancedTaskStatus {
  task_id: string;
  status: string;
  progress: string;
  stage: string;
  progress_percentage: number;
  current_question: string;
  diversity_report: DiversityReport;
  summary: {
    questions_processed: number;
    findings_count: number;
    ml_patterns_found: number;
    domain_detected: string;
  };
  error?: string;
}

interface DetailedFinding {
  question: string;
  summary: string;
  sql_query: string;
  chart_url?: string;
  data_preview?: any[];
  data_stats?: any;
  ml_patterns?: MLPattern[];
  validation?: {
    is_valid: boolean;
    message: string;
  };
  confidence_score?: number;
  category?: string;
}

interface EnhancedReport {
  id: number;
  status: string;
  created_at: string;
  results: {
    executive_summary: string;
    detailed_findings: DetailedFinding[];
    recommendations: string[];
    domain_context: DomainContext;
    ml_insights: {
      total_patterns: number;
      pattern_types: Record<string, any[]>;
      high_confidence_patterns: any[];
    };
    analysis_stats: AnalysisStats;
    diversity_report: DiversityReport;
    adaptive_strategy?: {
      preferred_question_types: string[];
      generate_charts: boolean;
      detailed_data: boolean;
    };
  };
}

const ReportPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  const [taskStatus, setTaskStatus] = useState<EnhancedTaskStatus | null>(null);
  const [report, setReport] = useState<EnhancedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  // Функция для получения статуса задачи
  const fetchTaskStatus = useCallback(async () => {
  if (!reportId) return;

  try {
    // Исправить URL - убрать /api префикс
    const url = `/analytics/reports/status/${reportId}`;
    console.log(`Making request to: ${url}`);

    const response = await fetch(url);
    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, response.headers);

    // Проверяем content-type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Server returned non-JSON response');
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const status: EnhancedTaskStatus = await response.json();
    setTaskStatus(status);

    if (status.status === 'SUCCESS' || status.status === 'FAILURE') {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }

      if (status.status === 'SUCCESS') {
        await fetchReport();
      }
    }

  } catch (err) {
    console.error('Error fetching task status:', err);
    setError('Ошибка получения статуса задачи');

    // Останавливаем polling при ошибке
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }
}, [reportId, refreshInterval]);

  // Функция для получения готового отчета
  const fetchReport = useCallback(async () => {
    if (!reportId) return;

    try {
      const response = await fetch(`/api/analytics/reports/${reportId}`);
      if (!response.ok) {
        if (response.status === 202) {
          // Отчет еще в процессе
          return;
        }
        throw new Error('Failed to fetch report');
      }

      const reportData: EnhancedReport = await response.json();
      setReport(reportData);
      setLoading(false);

    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Ошибка получения отчета');
      setLoading(false);
    }
  }, [reportId]);

  // Отправка обратной связи
  const submitFeedback = async () => {
    if (!reportId) return;

    try {
      const response = await fetch(`/api/analytics/reports/feedback/${reportId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: feedbackRating,
          comment: feedbackComment,
          useful_sections: [] // Можно расширить
        })
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      setShowFeedbackDialog(false);
      setFeedbackComment('');
      // Показываем уведомление об успехе

    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  // Инициализация компонента
  useEffect(() => {
    fetchTaskStatus();

    // Устанавливаем интервал обновления для незавершенных задач
    const interval = setInterval(fetchTaskStatus, 5000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchTaskStatus]);

  // Получение иконки для статуса
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAILURE': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'PENDING': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  // Получение цвета для типа ML-паттерна
  const getPatternColor = (type: string) => {
    switch (type) {
      case 'anomaly': return 'bg-red-100 text-red-800';
      case 'clustering': return 'bg-blue-100 text-blue-800';
      case 'correlation': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Рендер прогресса задачи
  const renderTaskProgress = () => {
    if (!taskStatus) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(taskStatus.status)}
            Статус анализа
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Прогресс</span>
              <span className="text-sm text-gray-600">
                {taskStatus.progress_percentage}%
              </span>
            </div>

            <Progress value={taskStatus.progress_percentage} className="w-full" />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Этап:</span> {taskStatus.stage}
              </div>
              <div>
                <span className="font-medium">Статус:</span> {taskStatus.status}
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <span className="font-medium">Текущее действие:</span> {taskStatus.progress}
            </div>

            {taskStatus.current_question && (
              <div className="text-sm">
                <span className="font-medium">Текущий вопрос:</span>
                <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                  {taskStatus.current_question}
                </div>
              </div>
            )}

            {taskStatus.diversity_report && (
              <div className="text-sm">
                <span className="font-medium">Покрытие таблиц:</span>
                <div className="mt-1 flex items-center gap-2">
                  <Progress
                    value={taskStatus.diversity_report.coverage_percentage}
                    className="flex-1 h-2"
                  />
                  <span className="text-xs">
                    {taskStatus.diversity_report.analyzed_tables}/{taskStatus.diversity_report.total_tables}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Рендер executive summary
  const renderExecutiveSummary = () => {
    if (!report?.results) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Резюме анализа
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">
            {report.results.executive_summary}
          </p>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {report.results.analysis_stats.questions_processed}
              </div>
              <div className="text-sm text-blue-600">Вопросов</div>
            </div>

            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">
                {report.results.analysis_stats.successful_findings}
              </div>
              <div className="text-sm text-green-600">Результатов</div>
            </div>

            <div className="text-center p-3 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">
                {report.results.analysis_stats.ml_patterns_found}
              </div>
              <div className="text-sm text-purple-600">ML-паттернов</div>
            </div>

            <div className="text-center p-3 bg-orange-50 rounded">
              <div className="text-2xl font-bold text-orange-600">
                {report.results.analysis_stats.tables_coverage.toFixed(1)}%
              </div>
              <div className="text-sm text-orange-600">Покрытие</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Рендер ML-инсайтов
  const renderMLInsights = () => {
    if (!report?.results?.ml_insights || report.results.ml_insights.total_patterns === 0) {
      return null;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            ML-инсайты
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Обнаружено <span className="font-medium">{report.results.ml_insights.total_patterns}</span> паттернов
            </div>

            <div className="grid gap-3">
              {Object.entries(report.results.ml_insights.pattern_types).map(([type, patterns]) => (
                <div key={type} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getPatternColor(type)}>
                      {type}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {patterns.length} паттернов
                    </span>
                  </div>

                  <div className="space-y-2">
                    {patterns.slice(0, 3).map((pattern: any, index: number) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium">{pattern.description}</div>
                        <div className="text-xs text-gray-500">
                          Уверенность: {(pattern.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Рендер контекста домена
  const renderDomainContext = () => {
    if (!report?.results?.domain_context) return null;

    const { domain_context } = report.results;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Контекст предметной области
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Тип:</span>
              <Badge variant="outline">{domain_context.domain_type}</Badge>
              <span className="text-sm text-gray-500">
                (уверенность: {(domain_context.confidence * 100).toFixed(1)}%)
              </span>
            </div>

            <div>
              <span className="font-medium">Ключевые сущности:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {domain_context.key_entities.map((entity, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {entity}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <span className="font-medium">Бизнес-метрики:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {domain_context.business_metrics.map((metric, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {metric}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Рендер детальных результатов
  const renderDetailedFindings = () => {
    if (!report?.results?.detailed_findings) return null;

    return (
      <div className="space-y-4">
        {report.results.detailed_findings.map((finding, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{finding.question}</span>
                <div className="flex items-center gap-2">
                  {finding.confidence_score && (
                    <Badge variant="outline">
                      {(finding.confidence_score * 100).toFixed(0)}% уверенности
                    </Badge>
                  )}
                  {finding.category && (
                    <Badge variant="secondary">{finding.category}</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">{finding.summary}</p>

                {finding.chart_url && (
                  <div className="border rounded p-4">
                    <img
                      src={finding.chart_url}
                      alt="Визуализация данных"
                      className="w-full h-auto rounded"
                    />
                  </div>
                )}

                {finding.ml_patterns && finding.ml_patterns.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">ML-паттерны:</h4>
                    <div className="space-y-2">
                      {finding.ml_patterns.map((pattern, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Badge className={getPatternColor(pattern.type)}>
                            {pattern.type}
                          </Badge>
                          <span className="text-sm">{pattern.description}</span>
                          <span className="text-xs text-gray-500">
                            ({(pattern.confidence * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {finding.data_preview && finding.data_preview.length > 0 && (
                  <details className="border rounded p-3">
                    <summary className="cursor-pointer font-medium">
                      Данные ({finding.data_preview.length} записей)
                    </summary>
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {Object.keys(finding.data_preview[0]).map(key => (
                              <th key={key} className="text-left p-2">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {finding.data_preview.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="border-b">
                              {Object.values(row).map((val, vidx) => (
                                <td key={vidx} className="p-2">
                                  {String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}

                {finding.sql_query && (
                  <details className="border rounded p-3">
                    <summary className="cursor-pointer font-medium">
                      SQL запрос
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {finding.sql_query}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Рендер рекомендаций
  const renderRecommendations = () => {
    if (!report?.results?.recommendations) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Рекомендации
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {report.results.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  // Основной рендер
  if (loading && !taskStatus) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-lg">Загрузка отчета...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/connections')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться к подключениям
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          Отчет анализа #{reportId}
        </h1>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFeedbackDialog(true)}
            disabled={!report}
          >
            <Star className="w-4 h-4 mr-1" />
            Оценить
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/connections')}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Назад
          </Button>
        </div>
      </div>

      {/* Прогресс задачи */}
      {taskStatus && taskStatus.status !== 'SUCCESS' && renderTaskProgress()}

      {/* Основной контент отчета */}
      {report && (
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="summary">Резюме</TabsTrigger>
            <TabsTrigger value="findings">Результаты</TabsTrigger>
            <TabsTrigger value="ml-insights">ML-инсайты</TabsTrigger>
            <TabsTrigger value="context">Контекст</TabsTrigger>
            <TabsTrigger value="recommendations">Рекомендации</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            {renderExecutiveSummary()}
          </TabsContent>

          <TabsContent value="findings" className="space-y-6">
            {renderDetailedFindings()}
          </TabsContent>

          <TabsContent value="ml-insights" className="space-y-6">
            {renderMLInsights()}
          </TabsContent>

          <TabsContent value="context" className="space-y-6">
            {renderDomainContext()}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            {renderRecommendations()}
          </TabsContent>
        </Tabs>
      )}

      {/* Диалог обратной связи */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Оценка отчета</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rating">Оценка (1-5)</Label>
              <Select value={feedbackRating.toString()} onValueChange={(value: string) => setFeedbackRating(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Очень плохо</SelectItem>
                  <SelectItem value="2">2 - Плохо</SelectItem>
                  <SelectItem value="3">3 - Нормально</SelectItem>
                  <SelectItem value="4">4 - Хорошо</SelectItem>
                  <SelectItem value="5">5 - Отлично</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="comment">Комментарий</Label>
              <Textarea
                id="comment"
                value={feedbackComment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedbackComment(e.target.value)}
                placeholder="Что понравилось или что можно улучшить?"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
                Отмена
              </Button>
              <Button onClick={submitFeedback}>
                Отправить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportPage;
