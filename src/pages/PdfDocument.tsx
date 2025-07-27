import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, PDFDownloadLink } from '@react-pdf/renderer';
import { Download } from 'lucide-react'; // Добавляем импорт иконки
import type { EnhancedReport } from '../api';

interface PdfDocumentProps {
  report: EnhancedReport;
}

// Типизация для результатов отчета
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
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  text: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 1.5,
  },
  metadata: {
    fontSize: 10,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  chartContainer: {
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  chart: {
    width: '100%',
    height: 200,
    objectFit: 'contain',
  },
});

const ReportDocument: React.FC<PdfDocumentProps> = ({ report }) => {
  // Типизируем results правильно
  const results = report.results as SuccessReportResults | null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Отчет #{report.id}</Text>
        <Text style={styles.metadata}>
          Создан: {new Date(report.created_at).toLocaleString('ru-RU')} | Статус: {report.status}
        </Text>

        {/* Анализ отдельных таблиц */}
        {results?.single_table_insights && Object.keys(results.single_table_insights).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subtitle}>Анализ отдельных таблиц</Text>
            {Object.entries(results.single_table_insights).map(([tableName, analysis]: [string, any]) => (
              <View key={tableName} style={styles.section}>
                <Text style={styles.chartTitle}>Таблица: {tableName}</Text>
                <Text style={styles.text}>{analysis.insight || 'Нет инсайтов'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Анализ связанных таблиц */}
        {results?.joint_table_insights && Object.keys(results.joint_table_insights).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subtitle}>Анализ связанных таблиц</Text>
            {Object.entries(results.joint_table_insights).map(([joinKey, analysis]: [string, any]) => (
              <View key={joinKey} style={styles.section}>
                <Text style={styles.chartTitle}>Связь: {joinKey}</Text>
                <Text style={styles.text}>{analysis.insight || 'Нет инсайтов'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Графики */}
        {results?.visualizations && Object.keys(results.visualizations).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subtitle}>Визуализации</Text>
            {/* Исправляем типизацию для visualizations */}
            {Object.entries(results.visualizations).map(([sourceName, chartUrls]) => {
              // Проверяем, что chartUrls это массив строк
              if (!Array.isArray(chartUrls)) return null;

              return (
                <View key={sourceName} style={styles.section}>
                  <Text style={styles.chartTitle}>Графики для: {sourceName}</Text>
                  {chartUrls.map((chartUrl: string, index: number) => (
                    <View key={index} style={styles.chartContainer}>
                      <Image style={styles.chart} src={chartUrl} />
                    </View>
                  ))}
                </View>
              );
            })}
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
