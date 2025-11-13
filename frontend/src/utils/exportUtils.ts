import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportOptions {
  filename?: string;
  format?: 'pdf' | 'png' | 'jpg';
  quality?: number;
}

export const exportTimetable = async (
  elementId: string, 
  options: ExportOptions = {}
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found for export');
  }

  const {
    filename = 'emploi-du-temps',
    format = 'pdf',
    quality = 0.95
  } = options;

  try {
    // Temporarily bump small text sizes for readability in export
    const bumped: Array<{ el: HTMLElement; fontSize: string | null; lineHeight: string | null; fontWeight: string | null }> = [];
    const expanded: Array<{ el: HTMLElement; overflow: string | null; whiteSpace: string | null; textOverflow: string | null; maxWidth: string | null }> = [];
    // Select small text nodes safely (no invalid selectors)
    const nodeList: HTMLElement[] = [];
    try {
      const q1 = element.querySelectorAll<HTMLElement>('[class*="text-xs"]');
      const q2 = element.querySelectorAll<HTMLElement>('[class*="text-[10px]"]');
      q1.forEach(n => nodeList.push(n));
      q2.forEach(n => nodeList.push(n));
    } catch {
      // Fallback: scan all descendants and filter by className contains
      const all = Array.from(element.getElementsByTagName('*')) as HTMLElement[];
      all.forEach(elm => {
        const cls = elm.className || '';
        if (typeof cls === 'string' && (cls.includes('text-xs') || cls.includes('text-[10px]'))) nodeList.push(elm);
      });
    }
    nodeList.forEach(el => {
      bumped.push({ el, fontSize: el.style.fontSize || null, lineHeight: el.style.lineHeight || null, fontWeight: el.style.fontWeight || null });
      el.style.fontSize = '12px';
      el.style.lineHeight = '1.3';
      el.style.fontWeight = '600';
    });

    // Disable truncation/ellipsis and width caps so full salle/prof names appear
    const truncNodes = element.querySelectorAll<HTMLElement>('[class*="truncate"], [class*="max-w-"]');
    truncNodes.forEach(el => {
      expanded.push({
        el,
        overflow: el.style.overflow || null,
        whiteSpace: el.style.whiteSpace || null,
        textOverflow: el.style.textOverflow || null,
        maxWidth: el.style.maxWidth || null,
      });
      el.style.overflow = 'visible';
      el.style.whiteSpace = 'normal';
      el.style.textOverflow = 'clip';
      el.style.maxWidth = 'none';
    });

    // Capture the element as canvas with better options
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY,
    });

    if (format === 'pdf') {
      // Create PDF with better image handling
      const imgData = canvas.toDataURL('image/jpeg', quality);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // mm
      const maxW = pdfWidth - margin * 2;
      const maxH = pdfHeight - margin * 2;

      const cw = Math.max(1, canvas.width);
      const ch = Math.max(1, canvas.height);
      // Fit inside page (single page), keep aspect ratio
      const ratio = Math.min(maxW / cw, maxH / ch);
      const renderW = Math.max(1, cw * ratio);
      const renderH = Math.max(1, ch * ratio);
      const x = Math.max(margin, (pdfWidth - renderW) / 2);
      const y = Math.max(margin, (pdfHeight - renderH) / 2);

      pdf.addImage(imgData, 'JPEG', x, y, renderW, renderH);

      pdf.save(`${filename}.pdf`);
    } else {
      // Create image (JPG/JPEG/PNG)
      const imageFormat = format === 'jpg' ? 'jpeg' : format;
      const imgData = canvas.toDataURL(`image/${imageFormat}`, quality);
      
      const link = document.createElement('a');
      link.download = `${filename}.${format}`;
      link.href = imgData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    throw new Error(`Erreur lors de l'exportation: ${error.message}`);
  }
  finally {
    // Restore bumped styles
    // Note: if element was detached meanwhile, ignore errors
    try {
      // @ts-ignore
      (bumped || []).forEach((b: any) => {
        if (!b || !b.el) return;
        b.el.style.fontSize = b.fontSize ?? '';
        b.el.style.lineHeight = b.lineHeight ?? '';
        b.el.style.fontWeight = b.fontWeight ?? '';
      });
      // @ts-ignore
      (expanded || []).forEach((e: any) => {
        if (!e || !e.el) return;
        e.el.style.overflow = e.overflow ?? '';
        e.el.style.whiteSpace = e.whiteSpace ?? '';
        e.el.style.textOverflow = e.textOverflow ?? '';
        e.el.style.maxWidth = e.maxWidth ?? '';
      });
    } catch {}
  }
};

export const printTimetable = (elementId: string): void => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found for printing');
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Impossible d\'ouvrir la fenêtre d\'impression');
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Emploi du temps</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px;
            background: white;
          }
          .timetable-container {
            width: 100%;
            max-width: 100%;
          }
          .timetable-grid {
            display: grid;
            grid-template-columns: 80px repeat(5, 1fr);
            gap: 1px;
            border: 2px solid #333;
          }
          .time-slot {
            background: #f8f9fa;
            padding: 8px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #ddd;
          }
          .day-header {
            background: #007bff;
            color: white;
            padding: 12px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #0056b3;
          }
          .session-block {
            min-height: 60px;
            padding: 8px;
            border: 1px solid #ddd;
            background: #f8f9fa;
            position: relative;
          }
          .session-content {
            background: #e3f2fd;
            border: 2px solid #2196f3;
            border-radius: 4px;
            padding: 8px;
            margin: 2px;
            font-size: 12px;
            line-height: 1.3;
          }
          .session-time {
            font-weight: bold;
            color: #1976d2;
            font-size: 11px;
          }
          .session-subject {
            font-weight: bold;
            color: #333;
            margin: 2px 0;
          }
          .session-teacher {
            color: #666;
            font-size: 10px;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .timetable-container { width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="timetable-container">
          ${element.innerHTML}
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};
