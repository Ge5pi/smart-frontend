import { useState, useEffect, useCallback, useRef } from 'react';
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
  Clock
} from 'lucide-react';
// **ИСПРАВЛЕНО**: Разделяем импорт типов и значений
import { getReport, getReportStatus, submitReportFeedback } from '../api';
import type { EnhancedReport, EnhancedTaskStatus } from '../api';


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

  const pollingInterval = useRef<number | null>(null);

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  const fetchReport = useCallback(async () => {
    if (!reportId) return;

    try {
      const response = await getReport(reportId);
      const data = response.data;
      setReport(data);

      if (data.status === 'COMPLETED') {
        setLoading(false);
        stopPolling();
        setTaskStatus(null);
      } else if (data.status === 'FAILED') {
        if (data.results && 'error' in data.results) {
          setError(data.results.error || 'Произошла ошибка при генерации отчета.');
        } else {
          setError('Произошла неизвестная ошибка при генерации отчета.');
        }
        setLoading(false);
        stopPolling();
      } else {
        setLoading(false);
        const taskId = data.task_id;
        if (taskId && !pollingInterval.current) {
          pollingInterval.current = window.setInterval(() => {
            pollTaskStatus(taskId);
          }, 5000);
        }
      }
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.detail || err.message || 'Произошла неизвестная ошибка';
      setError(message);
      setLoading(false);
      stopPolling();
    }
  }, [reportId]);

  const pollTaskStatus = useCallback(async (taskId: string) => {
    try {
      const response = await getReportStatus(taskId);
      const statusData = response.data;
      setTaskStatus(statusData);

      if (statusData.status === 'SUCCESS' || statusData.status === 'FAILURE') {
        stopPolling();
        fetchReport();
      }
    } catch (err: any) {
      console.error('Error polling task status:', err);
    }
  }, [fetchReport]);

  useEffect(() => {
    fetchReport();
    return () => stopPolling();
  }, [fetchReport]);

  const submitFeedback = async () => {
    if (!reportId) return;

    try {
      await submitReportFeedback(reportId, {
        rating: feedbackRating,
        comment: feedbackComment,
      });
      setShowFeedbackDialog(false);
      setFeedbackComment('');
      setFeedbackRating(5);
      alert('Спасибо за ваш отзыв!');
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      alert('Не удалось отправить отзыв.');
    }
  };

  const getTaskStatusIcon = (status?: string) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAILURE': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'PENDING': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  // Остальная часть компонента (функции рендеринга и JSX) остается без изменений

  const renderTaskProgress = () => {
    if (!taskStatus || report?.status === 'COMPLETED') return null;
    return (
        <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getTaskStatusIcon(taskStatus.status)}
            Статус анализа
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Прогресс</span>
                <span>{taskStatus.progress_percentage?.toFixed(0) ?? 0}%</span>
              </div>
              <Progress value={taskStatus.progress_percentage} className="w-full" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Этап:</strong> {taskStatus.stage || 'инициализация'}
              </div>
              <div>
                <strong>Статус:</strong> {taskStatus.status || 'ожидание'}
              </div>
            </div>

            {taskStatus.progress && (
              <div>
                <strong>Текущее действие:</strong> {taskStatus.progress}
              </div>
            )}

            {taskStatus.current_question && (
              <Alert>
                <AlertDescription>
                  <strong>Текущий вопрос:</strong><br />
                  {taskStatus.current_question}
                </AlertDescription>
              </Alert>
            )}

            {taskStatus.diversity_report && taskStatus.diversity_report.total_tables > 0 && (
              <div className="text-sm">
                <strong>Покрытие таблиц:</strong> {taskStatus.diversity_report.analyzed_tables}/{taskStatus.diversity_report.total_tables}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const getPatternColor = (type: string) => {
    switch (type) {
      case 'anomaly': return 'bg-red-100 text-red-800';
      case 'clustering': return 'bg-blue-100 text-blue-800';
      case 'correlation': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderExecutiveSummary = () => {
    if (!report?.results || 'error' in report.results || !report.results.executive_summary) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Резюме анализа
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{report.results.executive_summary}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {report.results.analysis_stats.questions_processed}
                </div>
                <div className="text-sm text-gray-600">Вопросов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {report.results.analysis_stats.successful_findings}
                </div>
                <div className="text-sm text-gray-600">Результатов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {report.results.analysis_stats.ml_patterns_found}
                </div>
                <div className="text-sm text-gray-600">ML-паттернов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {report.results.analysis_stats.tables_coverage?.toFixed(1) ?? '0.0'}%
                </div>
                <div className="text-sm text-gray-600">Покрытие</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderMLInsights = () => {
    if (!report?.results || 'error' in report.results || report.results.ml_insights.total_patterns === 0) {
      return (
        <Card>
          <CardContent className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ML-паттерны не обнаружены</p>
          </CardContent>
        </Card>
      );
    }
    const { ml_insights } = report.results;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            ML-инсайты
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Обнаружено {ml_insights.total_patterns} паттернов</p>
          <div className="space-y-4">
            {Object.entries(ml_insights.pattern_types).map(([type, patterns]) => (
              <div key={type} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getPatternColor(type)}>{type}</Badge>
                  <span className="text-sm text-gray-600">{patterns.length} паттернов</span>
                </div>
                <div className="space-y-2">
                  {(patterns as any[]).slice(0, 3).map((pattern, index: number) => (
                    <div key={index} className="bg-gray-50 rounded p-3">
                      <p className="text-sm">{pattern.description}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Уверенность: {(pattern.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDomainContext = () => {
    if (!report?.results || 'error' in report.results || !report.results.domain_context) return null;
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
          <div className="space-y-4">
            <div>
              <strong>Тип:</strong>
              <Badge className="ml-2">{domain_context.domain_type}</Badge>
              <span className="text-sm text-gray-600 ml-2">
                (уверенность: {(domain_context.confidence * 100).toFixed(1)}%)
              </span>
            </div>
            <div>
              <strong>Ключевые сущности:</strong>
              <div className="flex flex-wrap gap-2 mt-2">
                {domain_context.key_entities.map((entity, index) => (
                  <Badge key={index} variant="outline">{entity}</Badge>
                ))}
              </div>
            </div>
            <div>
              <strong>Бизнес-метрики:</strong>
              <div className="flex flex-wrap gap-2 mt-2">
                {domain_context.business_metrics.map((metric, index) => (
                  <Badge key={index} variant="outline">{metric}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDetailedFindings = () => {
    if (!report?.results || 'error' in report.results || !report.results.detailed_findings) return null;
    return (
      <div className="space-y-6">
        {report.results.detailed_findings.map((finding, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                <span className='mr-4'>{finding.question}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {finding.confidence_score && (
                    <Badge variant="outline">
                      {(finding.confidence_score * 100).toFixed(0)}% уверенности
                    </Badge>
                  )}
                  {finding.category && (
                    <Badge>{finding.category}</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{finding.summary}</p>
              {finding.chart_url && (
                <div className="mb-4">
                  <img src={finding.chart_url} alt="Диаграмма" className="max-w-full h-auto rounded border"/>
                </div>
              )}
              {finding.ml_patterns && finding.ml_patterns.length > 0 && (
                <div className="mb-4">
                  <strong>ML-паттерны:</strong>
                  <div className="mt-2 space-y-2">
                    {finding.ml_patterns.map((pattern, idx) => (
                      <div key={idx} className="bg-gray-50 rounded p-2">
                        <Badge className={getPatternColor(pattern.type)}>{pattern.type}</Badge>
                        <p className="text-sm mt-1">{pattern.description}</p>
                        <p className="text-xs text-gray-600">({(pattern.confidence * 100).toFixed(1)}%)</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {finding.data_preview && finding.data_preview.length > 0 && (
                <div className="mb-4">
                  <strong>Данные ({finding.data_preview.length} записей)</strong>
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          {Object.keys(finding.data_preview[0]).map(key => (<th key={key} className="border border-gray-200 px-4 py-2 text-left">{key}</th>))}
                        </tr>
                      </thead>
                      <tbody>
                        {finding.data_preview.slice(0, 5).map((row, idx) => (<tr key={idx}>
                            {Object.values(row).map((val, vidx) => (<td key={vidx} className="border border-gray-200 px-4 py-2">{String(val)}</td>))}
                          </tr>))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {finding.sql_query && (
                <div>
                  <strong>SQL запрос</strong>
                  <pre className="mt-2 bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                    <code>{finding.sql_query}</code>
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!report?.results || 'error' in report.results || !report.results.recommendations) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Рекомендации
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.results.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Загрузка отчета...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="w-4 h-4" />
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
        <h1 className="text-3xl font-bold">Отчет анализа #{reportId}</h1>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowFeedbackDialog(true)}
            disabled={!report || report.status !== 'COMPLETED'}
            variant="outline"
          >
            <Star className="w-4 h-4 mr-2" />
            Оценить
          </Button>
          <Button
            onClick={() => navigate('/connections')}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        </div>
      </div>

      {renderTaskProgress()}

      {report && report.results && report.status === 'COMPLETED' && (
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            <TabsTrigger value="summary">Резюме</TabsTrigger>
            <TabsTrigger value="findings">Результаты</TabsTrigger>
            <TabsTrigger value="ml-insights">ML-инсайты</TabsTrigger>
            <TabsTrigger value="context">Контекст</TabsTrigger>
            <TabsTrigger value="recommendations">Рекомендации</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="mt-6">{renderExecutiveSummary()}</TabsContent>
          <TabsContent value="findings" className="mt-6">{renderDetailedFindings()}</TabsContent>
          <TabsContent value="ml-insights" className="mt-6">{renderMLInsights()}</TabsContent>
          <TabsContent value="context" className="mt-6">{renderDomainContext()}</TabsContent>
          <TabsContent value="recommendations" className="mt-6">{renderRecommendations()}</TabsContent>
        </Tabs>
      )}

      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Оценка отчета</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rating">Оценка (1-5)</Label>
              <Select value={String(feedbackRating)} onValueChange={(value) => setFeedbackRating(Number(value))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Textarea id="comment" value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} placeholder="Что понравилось или что можно улучшить?" rows={3}/>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>Отмена</Button>
              <Button onClick={submitFeedback}>Отправить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportPage;