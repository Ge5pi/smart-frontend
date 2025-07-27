import React from 'react';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';
import type { EnhancedReport } from '../api';

interface PdfExportProps {
  report: EnhancedReport;
}

// Добавляем интерфейс для правильной типизации анализа
interface AnalysisInsight {
  insight?: string;
}

const PdfExportFixed: React.FC<PdfExportProps> = ({ report }) => {
  const generatePdf = async () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      const checkPageBreak = (requiredSpace: number = 20) => {
        if (yPosition > pageHeight - requiredSpace) {
          pdf.addPage();
          yPosition = margin;
        }
      };

      const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');

        const safeText = text || 'No data';
        const lines = pdf.splitTextToSize(safeText, pageWidth - 2 * margin);

        checkPageBreak(lines.length * 5 + 5);
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * 5 + 5;
      };

      // Заголовок отчета
      addText(`Report #${report.id}`, 20, true);
      addText(`Created: ${new Date(report.created_at).toLocaleString()}`, 10);
      addText(`Status: ${report.status}`, 10);
      yPosition += 10;

      const results = report.results as any;

      if (!results) {
        addText('No data available for this report');
        pdf.save(`report_${report.id}.pdf`);
        return;
      }

      // Анализ отдельных таблиц
      if (results.single_table_insights && Object.keys(results.single_table_insights).length > 0) {
        checkPageBreak(30);
        addText('SINGLE TABLE ANALYSIS', 16, true);

        for (const [tableName, analysis] of Object.entries(results.single_table_insights)) {
          checkPageBreak(25);
          addText(`Table: ${tableName}`, 14, true);

          // Исправляем типизацию для получения insight
          let insight = '';
          if (analysis && typeof analysis === 'object') {
            const analysisObj = analysis as AnalysisInsight;
            insight = analysisObj.insight || 'No insights available';
          } else if (typeof analysis === 'string') {
            insight = analysis;
          } else {
            insight = 'No insights available';
          }

          const transliteratedInsight = transliterateText(insight);
          addText(transliteratedInsight, 10);
          yPosition += 5;
        }
      }

      // Анализ связанных таблиц
      if (results.joint_table_insights && Object.keys(results.joint_table_insights).length > 0) {
        checkPageBreak(30);
        addText('JOINT TABLE ANALYSIS', 16, true);

        for (const [joinKey, analysis] of Object.entries(results.joint_table_insights)) {
          checkPageBreak(25);
          addText(`Relationship: ${joinKey}`, 14, true);

          // Исправляем типизацию для получения insight
          let insight = '';
          if (analysis && typeof analysis === 'object') {
            const analysisObj = analysis as AnalysisInsight;
            insight = analysisObj.insight || 'No insights available';
          } else if (typeof analysis === 'string') {
            insight = analysis;
          } else {
            insight = 'No insights available';
          }

          const transliteratedInsight = transliterateText(insight);
          addText(transliteratedInsight, 10);
          yPosition += 5;
        }
      }

      // Добавляем графики
      if (results.visualizations && Object.keys(results.visualizations).length > 0) {
        pdf.addPage();
        yPosition = margin;

        addText('VISUALIZATIONS', 16, true);

        for (const [sourceName, chartUrls] of Object.entries(results.visualizations)) {
          if (!Array.isArray(chartUrls)) continue;

          checkPageBreak(25);
          addText(`Charts for: ${sourceName}`, 14, true);

          for (const [index, chartUrl] of chartUrls.entries()) {
            try {
              const response = await fetch(chartUrl);
              if (!response.ok) throw new Error('Failed to fetch image');

              const blob = await response.blob();
              const imageData = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });

              checkPageBreak(90);

              const imgWidth = pageWidth - 2 * margin;
              const imgHeight = 80;

              pdf.addImage(imageData, 'PNG', margin, yPosition, imgWidth, imgHeight);
              yPosition += imgHeight + 10;

            } catch (error) {
              console.error(`Error adding chart ${index + 1}:`, error);
              addText(`Error loading chart ${index + 1}`, 10);
            }
          }
          yPosition += 10;
        }
      }

      pdf.save(`report_${report.id}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Произошла ошибка при создании PDF отчета. Попробуйте еще раз.');
    }
  };

  return (
    <button
      onClick={generatePdf}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className="w-4 h-4 mr-2" />
      Скачать PDF
    </button>
  );
};

// Функция транслитерации
const transliterateText = (text: string): string => {
  const translitMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };

  return text.replace(/[а-яёА-ЯЁ]/g, (match) => translitMap[match] || match);
};

export default PdfExportFixed;
