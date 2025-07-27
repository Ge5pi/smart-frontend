import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';
import type { EnhancedReport } from '../api';

interface AnalysisInsight {
  insight?: string;
}

const HtmlToPdfRussian: React.FC<{ report: EnhancedReport }> = ({ report }) => {
  const generatePdfFromHtml = async () => {
    try {
      // Создаем временный div с отчетом
      const reportElement = document.createElement('div');
      reportElement.style.cssText = `
        width: 800px;
        padding: 40px;
        background: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        position: absolute;
        left: -9999px;
        top: 0;
        color: #000;
        line-height: 1.6;
      `;

      const results = report.results as any;

      // Функция для безопасного получения инсайта
      const getInsight = (analysis: any): string => {
        if (analysis && typeof analysis === 'object') {
          const analysisObj = analysis as AnalysisInsight;
          return analysisObj.insight || 'Нет инсайтов';
        } else if (typeof analysis === 'string') {
          return analysis;
        }
        return 'Нет инсайтов';
      };

      reportElement.innerHTML = `
        <div style="border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #1f2937; margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">
            Отчет #${report.id}
          </h1>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">
            Создан: ${new Date(report.created_at).toLocaleString('ru-RU')} | Статус: ${report.status}
          </p>
        </div>

        ${results?.single_table_insights && Object.keys(results.single_table_insights).length > 0 ? `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #374151; margin: 0 0 20px 0; font-size: 22px; font-weight: bold; border-left: 4px solid #3b82f6; padding-left: 15px;">
              Анализ отдельных таблиц
            </h2>
            ${Object.entries(results.single_table_insights).map(([name, analysis]: [string, any]) => `
              <div style="margin-bottom: 25px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
                  📊 Таблица: ${name}
                </h3>
                <p style="margin: 0; line-height: 1.7; font-size: 14px; color: #374151;">
                  ${getInsight(analysis)}
                </p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${results?.joint_table_insights && Object.keys(results.joint_table_insights).length > 0 ? `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #374151; margin: 0 0 20px 0; font-size: 22px; font-weight: bold; border-left: 4px solid #10b981; padding-left: 15px;">
              Анализ связанных таблиц
            </h2>
            ${Object.entries(results.joint_table_insights).map(([name, analysis]: [string, any]) => `
              <div style="margin-bottom: 25px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f0fdf4;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
                  🔗 Связь: ${name}
                </h3>
                <p style="margin: 0; line-height: 1.7; font-size: 14px; color: #374151;">
                  ${getInsight(analysis)}
                </p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${results?.visualizations && Object.keys(results.visualizations).length > 0 ? `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #374151; margin: 0 0 20px 0; font-size: 22px; font-weight: bold; border-left: 4px solid #f59e0b; padding-left: 15px;">
              Визуализации
            </h2>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
              📈 Графики и диаграммы доступны в интерактивной версии отчета
            </p>
          </div>
        ` : ''}

        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
          <p style="margin: 0;">
            Отчет сгенерирован: ${new Date().toLocaleString('ru-RU')}
          </p>
        </div>
      `;

      document.body.appendChild(reportElement);

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`отчет_${report.id}.pdf`);

    } catch (error) {
      console.error('Ошибка при создании PDF:', error);
      alert('Ошибка при создании PDF отчета');
    } finally {
      // Удаляем временный элемент
      const tempElement = document.querySelector('div[style*="left: -9999px"]');
      if (tempElement) {
        document.body.removeChild(tempElement);
      }
    }
  };

  return (
    <button
      onClick={generatePdfFromHtml}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
    >
      <Download className="w-4 h-4 mr-2" />
      Скачать PDF (HTML)
    </button>
  );
};

export default HtmlToPdfRussian;
