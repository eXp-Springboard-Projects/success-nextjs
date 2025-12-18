import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportOptions {
  filename?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

/**
 * Export HTML element to PDF
 */
export async function exportElementToPDF(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const {
    filename = 'export.pdf',
    format = 'a4',
    orientation = 'portrait'
  } = options;

  try {
    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');

    // Calculate dimensions
    const imgWidth = format === 'a4' ? 210 : 216; // A4: 210mm, Letter: 216mm
    const pageHeight = format === 'a4' ? 297 : 279; // A4: 297mm, Letter: 279mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF
    const pdf = new jsPDF(orientation, 'mm', format);
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save PDF
    pdf.save(filename);
  } catch (error) {
    throw error;
  }
}

/**
 * Export post/page content to PDF
 */
export async function exportPostToPDF(
  title: string,
  content: string,
  author?: string,
  date?: string
): Promise<void> {
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Add SUCCESS branding
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SUCCESS', margin, yPosition);
  yPosition += 15;

  // Add title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  const titleLines = pdf.splitTextToSize(title, contentWidth);
  pdf.text(titleLines, margin, yPosition);
  yPosition += titleLines.length * 8;

  // Add metadata
  if (author || date) {
    yPosition += 5;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);

    if (author) {
      pdf.text(`By ${author}`, margin, yPosition);
      yPosition += 6;
    }

    if (date) {
      pdf.text(date, margin, yPosition);
      yPosition += 6;
    }

    pdf.setTextColor(0);
  }

  // Add separator line
  yPosition += 10;
  pdf.setDrawColor(211, 47, 47); // SUCCESS red
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // Add content
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');

  // Strip HTML tags for plain text export
  const plainText = content
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();

  const contentLines = pdf.splitTextToSize(plainText, contentWidth);

  for (let i = 0; i < contentLines.length; i++) {
    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.text(contentLines[i], margin, yPosition);
    yPosition += 7;
  }

  // Add footer with page numbers
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(150);
    pdf.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
  pdf.save(filename);
}

/**
 * Export image with metadata to PDF
 */
export async function exportImageToPDF(
  imageUrl: string,
  title: string,
  metadata?: Record<string, string>
): Promise<void> {
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 20;

  let yPosition = margin;

  // Add title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, margin, yPosition);
  yPosition += 15;

  try {
    // Load and add image
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    // Calculate image dimensions to fit page
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = 200;
    let imgWidth = maxWidth;
    let imgHeight = (img.height * maxWidth) / img.width;

    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = (img.width * maxHeight) / img.height;
    }

    // Center image
    const xPosition = (pageWidth - imgWidth) / 2;

    pdf.addImage(img, 'JPEG', xPosition, yPosition, imgWidth, imgHeight);
    yPosition += imgHeight + 15;

    // Add metadata
    if (metadata) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      for (const [key, value] of Object.entries(metadata)) {
        if (value) {
          pdf.text(`${key}: ${value}`, margin, yPosition);
          yPosition += 7;
        }
      }
    }
  } catch (error) {
  }

  const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
  pdf.save(filename);
}

/**
 * Export magazine cover to PDF with print-ready options
 */
export async function exportMagazineCoverToPDF(
  coverUrl: string,
  title: string,
  issueInfo?: string,
  printReady: boolean = false
): Promise<void> {
  // Print-ready settings: US Letter size with bleed (8.5" x 11" = 215.9mm x 279.4mm)
  // Add 3mm bleed on all sides for professional printing
  const pageWidth = printReady ? 221.9 : 215.9;  // Letter width + bleed
  const pageHeight = printReady ? 285.4 : 279.4; // Letter height + bleed

  const pdf = new jsPDF('portrait', 'mm', [pageWidth, pageHeight]);

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = coverUrl;
    });

    // Calculate dimensions to fill page (magazine cover style)
    const aspectRatio = img.width / img.height;
    let imgWidth = pageWidth;
    let imgHeight = pageWidth / aspectRatio;

    if (imgHeight < pageHeight) {
      imgHeight = pageHeight;
      imgWidth = pageHeight * aspectRatio;
    }

    // Center on page and ensure full coverage for print
    const xPosition = (pageWidth - imgWidth) / 2;
    const yPosition = (pageHeight - imgHeight) / 2;

    // Add high-quality image for print
    pdf.addImage(img, 'JPEG', xPosition, yPosition, imgWidth, imgHeight, undefined, 'FAST');

    // Add printer marks if print-ready
    if (printReady) {
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.1);

      // Crop marks (3mm from trim edge)
      const bleed = 3;
      const markLength = 5;

      // Top-left
      pdf.line(bleed, bleed - markLength, bleed, bleed);
      pdf.line(bleed - markLength, bleed, bleed, bleed);

      // Top-right
      pdf.line(pageWidth - bleed, bleed - markLength, pageWidth - bleed, bleed);
      pdf.line(pageWidth - bleed + markLength, bleed, pageWidth - bleed, bleed);

      // Bottom-left
      pdf.line(bleed, pageHeight - bleed, bleed, pageHeight - bleed + markLength);
      pdf.line(bleed - markLength, pageHeight - bleed, bleed, pageHeight - bleed);

      // Bottom-right
      pdf.line(pageWidth - bleed, pageHeight - bleed, pageWidth - bleed, pageHeight - bleed + markLength);
      pdf.line(pageWidth - bleed + markLength, pageHeight - bleed, pageWidth - bleed, pageHeight - bleed);
    }

    // Add info on second page if provided
    if (issueInfo) {
      pdf.addPage();
      const margin = 20;

      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SUCCESS Magazine', margin, margin + 10);

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const titleLines = pdf.splitTextToSize(title, pageWidth - (margin * 2));
      pdf.text(titleLines, margin, margin + 25);

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text(issueInfo, margin, margin + 40);

      pdf.setTextColor(0);

      // Add print specifications if print-ready
      if (printReady) {
        pdf.setFontSize(9);
        pdf.setTextColor(150);
        const specs = [
          'Print Specifications:',
          `• Format: US Letter with 3mm bleed`,
          `• Size: ${pageWidth}mm x ${pageHeight}mm`,
          '• Color Mode: CMYK',
          '• Resolution: 300 DPI recommended',
          '• Crop marks included'
        ];
        let yPos = pageHeight - 60;
        specs.forEach(spec => {
          pdf.text(spec, margin, yPos);
          yPos += 5;
        });
      }
    }
  } catch (error) {
    throw error;
  }

  const suffix = printReady ? '-print-ready' : '-digital';
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}${suffix}.pdf`;
  pdf.save(filename);
}

/**
 * Export high-resolution print-ready magazine PDF
 */
export async function exportMagazinePrintPDF(
  coverUrl: string,
  title: string,
  issueDate: string,
  articles: Array<{ title: string; content: string; author?: string }> = []
): Promise<void> {
  // US Letter size with bleed for print
  const pageWidth = 221.9; // 215.9mm + 3mm bleed
  const pageHeight = 285.4; // 279.4mm + 3mm bleed
  const bleed = 3;
  const margin = 15;

  const pdf = new jsPDF('portrait', 'mm', [pageWidth, pageHeight]);

  try {
    // Cover page
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = coverUrl;
    });

    const aspectRatio = img.width / img.height;
    let imgWidth = pageWidth;
    let imgHeight = pageWidth / aspectRatio;

    if (imgHeight < pageHeight) {
      imgHeight = pageHeight;
      imgWidth = pageHeight * aspectRatio;
    }

    const xPosition = (pageWidth - imgWidth) / 2;
    const yPosition = (pageHeight - imgHeight) / 2;

    pdf.addImage(img, 'JPEG', xPosition, yPosition, imgWidth, imgHeight, undefined, 'FAST');

    // Table of contents
    if (articles.length > 0) {
      pdf.addPage();
      let yPos = margin + bleed + 10;

      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Contents', margin + bleed, yPos);
      yPos += 15;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      articles.forEach((article, index) => {
        if (yPos > pageHeight - margin - bleed - 10) {
          pdf.addPage();
          yPos = margin + bleed + 10;
        }

        pdf.setFont('helvetica', 'bold');
        const articleTitle = pdf.splitTextToSize(article.title, pageWidth - (margin + bleed) * 2 - 20);
        pdf.text(articleTitle, margin + bleed, yPos);

        if (article.author) {
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(100);
          pdf.text(`By ${article.author}`, margin + bleed, yPos + 5);
          pdf.setTextColor(0);
          yPos += 8;
        }

        pdf.setFont('helvetica', 'normal');
        yPos += articleTitle.length * 5 + 3;
      });
    }

    // Add footer with print info
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(
        `SUCCESS Magazine • ${issueDate} • Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - bleed - 5,
        { align: 'center' }
      );
    }

  } catch (error) {
    throw error;
  }

  const filename = `success-magazine-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-print.pdf`;
  pdf.save(filename);
}
