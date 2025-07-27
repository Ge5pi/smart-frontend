import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, PDFDownloadLink, Font } from '@react-pdf/renderer';
import { Download } from 'lucide-react';
import type { EnhancedReport } from '../api';

// Регистрируем шрифт с поддержкой кириллицы
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.woff2',
      fontWeight: 'bold',
    },
  ],
});

interface PdfDocumentProps {
  report: EnhancedReport;
}

interface SuccessReportResults {
  single_table_insights: Record<string, any>;
  joint_table_insights: Record<string, any>;
  visualizations: Record<string, string[]>;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Roboto',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 15,
    fontWeight: 'bold',
    color: '#374151',
  },
  text: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 1.6,
    color: '#111827',
  },
  metadata: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: '1px solid #e5e7eb',
  },
  chartContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9fafb',
  },
  chartTitle: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  chart: {
    width: '100%',
    height: 200,
    objectFit: 'contain',
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    padding: 5,
  },
});

const ReportDocument: React.FC<PdfDocumentProps> = ({ report }) => {
  const results = report.results as SuccessReportResults | null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Отчет #{report.id}</Text>
          <Text style={styles.metadata}>
            Создан: {new Date(report.created_at).toLocaleString('ru-RU')} | Статус: {report.status}
          </Text>
        </View>

        {results ? (
          <>
            {/* Анализ отдельных таблиц */}
            {results.single_table_insights && Object.keys(results.single_table_insights).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.subtitle}>Анализ отдельных таблиц</Text>
                {Object.entries(results.single_table_insights).map(([tableName, analysis]: [string, any]) => (
                  <View key={tableName} style={{ marginBottom: 15 }}>
                    <Text style={styles.chartTitle}>Таблица: {tableName}</Text>
                    <Text style={styles.text}>
                      {typeof analysis === 'object' && analysis.insight
                        ? analysis.insight
                        : typeof analysis === 'string'
                        ? analysis
                        : 'Нет инсайтов'
                      }
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Анализ связанных таблиц */}
            {results.joint_table_insights && Object.keys(results.joint_table_insights).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.subtitle}>Анализ связанных таблиц</Text>
                {Object.entries(results.joint_table_insights).map(([joinKey, analysis]: [string, any]) => (
                  <View key={joinKey} style={{ marginBottom: 15 }}>
                    <Text style={styles.chartTitle}>Связь: {joinKey}</Text>
                    <Text style={styles.text}>
                      {typeof analysis === 'object' && analysis.insight
                        ? analysis.insight
                        : typeof analysis === 'string'
                        ? analysis
                        : 'Нет инсайтов'
                      }
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Графики */}
            {results.visualizations && Object.keys(results.visualizations).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.subtitle}>Визуализации</Text>
                {Object.entries(results.visualizations).map(([sourceName, chartUrls]) => {
                  if (!Array.isArray(chartUrls)) return null;

                  return (
                    <View key={sourceName} style={{ marginBottom: 20 }}>
                      <Text style={styles.chartTitle}>Графики для: {sourceName}</Text>
                      {chartUrls.map((chartUrl: string, index: number) => (
                        <View key={index} style={styles.chartContainer}>
                          <Text style={{ fontSize: 10, marginBottom: 5 }}>
                            График {index + 1}
                          </Text>
                          <Image style={styles.chart} src={chartUrl} />
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.text}>Нет данных для отображения в отчете</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};

export const PdfDownload: React.FC<PdfDocumentProps> = ({ report }) => (
  <PDFDownloadLink
    document={<ReportDocument report={report} />}
    fileName={`report_${report.id}.pdf`}
    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
  >
    {({ loading }) => (
      <>
        <Download className="w-4 h-4 mr-2" />
        {loading ? 'Подготовка PDF...' : 'Скачать PDF'}
      </>
    )}
  </PDFDownloadLink>
);
