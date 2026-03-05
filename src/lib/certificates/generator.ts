import jsPDF from 'jspdf';
import { BRAND } from '@/config/branding';

/**
 * Certificate data structure for PDF generation
 */
export interface CertificateData {
  studentName: string;
  moduleTitle: string;
  completionDate: Date;
  score: number;
  qrCodeDataUrl: string;
  certificateType: 'module' | 'master';
  verificationCode?: string;
}

/**
 * Generates a professional PDF certificate with GENIA branding
 *
 * @param data - Certificate data including student info, module details, and QR code
 * @returns jsPDF instance ready for download or preview
 *
 * @example
 * ```ts
 * const qrCode = await generateQRCode('https://genia.com/certificates/verify/abc123');
 * const pdf = generateCertificatePDF({
 *   studentName: 'John Doe',
 *   moduleTitle: 'Introduction to Prompt Engineering',
 *   completionDate: new Date(),
 *   score: 95,
 *   qrCodeDataUrl: qrCode,
 *   certificateType: 'module',
 *   verificationCode: 'XXXX-XXXX-XXXX-XXXX'
 * });
 * pdf.save('certificate.pdf');
 * ```
 */
export function generateCertificatePDF(data: CertificateData): jsPDF {
  const {
    studentName,
    moduleTitle,
    completionDate,
    score,
    qrCodeDataUrl,
    certificateType,
    verificationCode
  } = data;

  // Create PDF in landscape A4 format (297mm x 210mm)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // GENIA Brand Colors (matching platform theme)
  const colors = {
    primary: '#6366f1', // Indigo - primary brand color
    secondary: '#8b5cf6', // Purple - secondary accent
    dark: '#1e293b', // Slate dark - text
    gold: '#f59e0b', // Amber - excellence accent
    light: '#f8fafc', // Very light background
    text: '#334155' // Slate - body text
  };

  // Background - Light gradient effect (simulated with rectangles)
  pdf.setFillColor(248, 250, 252); // Very light background
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative border
  pdf.setDrawColor(99, 102, 241); // Primary indigo
  pdf.setLineWidth(1);
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S');

  // Inner decorative border
  pdf.setDrawColor(139, 92, 246); // Secondary purple
  pdf.setLineWidth(0.3);
  pdf.rect(12, 12, pageWidth - 24, pageHeight - 24, 'S');

  // Header section with gradient effect (simulated)
  // Top accent bar
  pdf.setFillColor(99, 102, 241); // Primary indigo
  pdf.rect(15, 15, pageWidth - 30, 8, 'F');

  // GENIA Logo/Brand (text-based for now)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(99, 102, 241); // Primary indigo
  pdf.text(BRAND.name, pageWidth / 2, 35, { align: 'center' });

  // Subtitle
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(100, 116, 139); // Slate gray
  pdf.text('AI-Powered Learning Platform', pageWidth / 2, 42, { align: 'center' });

  // Certificate Type Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(30, 41, 59); // Dark slate
  const certificateTitle = certificateType === 'master'
    ? 'MASTER CERTIFICATE OF COMPLETION'
    : 'CERTIFICATE OF COMPLETION';
  pdf.text(certificateTitle, pageWidth / 2, 55, { align: 'center' });

  // Decorative divider line
  pdf.setDrawColor(245, 158, 11); // Gold
  pdf.setLineWidth(0.5);
  pdf.line(pageWidth / 2 - 60, 58, pageWidth / 2 + 60, 58);

  // "This is to certify that" text
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(51, 65, 85); // Text color
  pdf.text('This is to certify that', pageWidth / 2, 68, { align: 'center' });

  // Student Name (emphasized)
  pdf.setFont('times', 'bolditalic');
  pdf.setFontSize(26);
  pdf.setTextColor(99, 102, 241); // Primary indigo
  pdf.text(studentName, pageWidth / 2, 80, { align: 'center' });

  // Decorative underline for name
  const nameWidth = pdf.getTextWidth(studentName);
  pdf.setDrawColor(139, 92, 246); // Secondary purple
  pdf.setLineWidth(0.3);
  pdf.line(
    pageWidth / 2 - nameWidth / 2,
    82,
    pageWidth / 2 + nameWidth / 2,
    82
  );

  // "has successfully completed" text
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(51, 65, 85);
  pdf.text('has successfully completed', pageWidth / 2, 92, { align: 'center' });

  // Module Title (emphasized)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(30, 41, 59); // Dark slate

  // Handle long module titles with text wrapping
  const maxLineWidth = pageWidth - 80;
  const titleLines = pdf.splitTextToSize(moduleTitle, maxLineWidth);
  const titleStartY = 103;
  titleLines.forEach((line: string, index: number) => {
    pdf.text(line, pageWidth / 2, titleStartY + (index * 8), { align: 'center' });
  });

  // Details section
  const detailsY = titleStartY + (titleLines.length * 8) + 12;

  // Score and Date in two columns
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(51, 65, 85);

  // Left column - Date
  const leftColX = pageWidth / 2 - 50;
  pdf.text('Completion Date:', leftColX, detailsY, { align: 'left' });
  pdf.setFont('helvetica', 'bold');
  const formattedDate = completionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  pdf.text(formattedDate, leftColX, detailsY + 6, { align: 'left' });

  // Right column - Score
  const rightColX = pageWidth / 2 + 10;
  pdf.setFont('helvetica', 'normal');
  pdf.text('Achievement Score:', rightColX, detailsY, { align: 'left' });
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(245, 158, 11); // Gold for score
  pdf.setFontSize(16);
  pdf.text(`${score}%`, rightColX, detailsY + 7, { align: 'left' });

  // QR Code section
  const qrY = detailsY + 20;
  const qrSize = 25; // 25mm QR code
  const qrX = pageWidth - 45;

  // QR Code label
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Verify Certificate:', qrX + qrSize / 2, qrY - 3, { align: 'center' });

  // Add QR Code image
  try {
    pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch (error) {
    throw new Error(
      `Failed to add QR code to certificate: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Verification code below QR
  if (verificationCode) {
    pdf.setFontSize(7);
    pdf.setFont('courier', 'normal');
    pdf.setTextColor(51, 65, 85);
    pdf.text(verificationCode, qrX + qrSize / 2, qrY + qrSize + 4, { align: 'center' });
  }

  // Footer section
  const footerY = pageHeight - 25;

  // Signature line placeholder (left side)
  const signatureX = 50;
  pdf.setLineWidth(0.3);
  pdf.setDrawColor(100, 116, 139);
  pdf.line(signatureX - 15, footerY, signatureX + 15, footerY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Platform Administrator', signatureX, footerY + 5, { align: 'center' });

  // Issue date (right side)
  const issueDateX = pageWidth - 50;
  pdf.line(issueDateX - 15, footerY, issueDateX + 15, footerY);
  pdf.text('Date of Issue', issueDateX, footerY + 5, { align: 'center' });

  // Bottom branding
  pdf.setFontSize(8);
  pdf.setTextColor(139, 92, 246); // Purple
  pdf.text(
    'This certificate validates skills in AI-powered prompt engineering',
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center' }
  );

  // Website
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`www.${BRAND.email.domain}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  return pdf;
}

/**
 * Helper function to download a generated certificate PDF
 *
 * @param pdf - The jsPDF instance to download
 * @param filename - Optional custom filename (defaults to certificate-{timestamp}.pdf)
 *
 * @example
 * ```ts
 * const pdf = generateCertificatePDF(certificateData);
 * downloadCertificate(pdf, 'my-certificate.pdf');
 * ```
 */
export function downloadCertificate(pdf: jsPDF, filename?: string): void {
  const defaultFilename = `certificate-${Date.now()}.pdf`;
  pdf.save(filename || defaultFilename);
}

/**
 * Helper function to get the PDF as a blob for upload/sharing
 *
 * @param pdf - The jsPDF instance to convert
 * @returns Blob object containing the PDF data
 *
 * @example
 * ```ts
 * const pdf = generateCertificatePDF(certificateData);
 * const blob = getCertificateBlob(pdf);
 * // Upload blob to storage or use for sharing
 * ```
 */
export function getCertificateBlob(pdf: jsPDF): Blob {
  return pdf.output('blob');
}
