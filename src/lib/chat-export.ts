// src/lib/chat-export.ts
// Chat export utilities: Markdown and PDF

import type { Message, ChatContext } from '@/types/chat.types';
import { BRAND, AI_ASSISTANT_NAME } from '@/config/branding';

/**
 * Export conversation as Markdown file
 */
export function exportToMarkdown(messages: Message[], context: ChatContext): void {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  let md = `# Conversation ${AI_ASSISTANT_NAME}\n\n`;
  md += `**Date** : ${date}\n`;
  md += `**Capsule** : ${context.currentCapsule.title}\n`;
  md += `**Niveau** : ${context.userLevel}\n`;
  md += `**Concepts** : ${context.currentCapsule.concepts.join(', ')}\n\n`;
  md += `---\n\n`;

  for (const msg of messages) {
    if (msg.role === 'system') {
      md += `> *${msg.content.replace(/\n/g, '\n> ')}*\n\n`;
    } else if (msg.role === 'user') {
      md += `### Vous\n\n${msg.content}\n\n`;
    } else {
      const step = msg.methodStep ? ` [${msg.methodStep}]` : '';
      md += `### ${AI_ASSISTANT_NAME}${step}\n\n${msg.content}\n\n`;
      if (msg.reasoning) {
        md += `<details><summary>Raisonnement</summary>\n\n${msg.reasoning}\n\n</details>\n\n`;
      }
    }
  }

  md += `---\n\n*Exporté depuis ${AI_ASSISTANT_NAME} - Formation Prompt Engineering*\n`;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(blob, `genia-chat-${formatDateForFilename()}.md`);
}

/**
 * Export conversation as PDF file using jsPDF
 */
export async function exportToPdf(messages: Message[], context: ChatContext): Promise<void> {
  // Dynamic import to avoid SSR issues
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const addPageIfNeeded = (height: number) => {
    if (y + height > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Conversation ${AI_ASSISTANT_NAME}`, margin, y);
  y += 10;

  // Metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);

  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Date : ${date}`, margin, y);
  y += 5;
  doc.text(`Capsule : ${context.currentCapsule.title}`, margin, y);
  y += 5;
  doc.text(`Niveau : ${context.userLevel}`, margin, y);
  y += 8;

  // Separator
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Messages
  for (const msg of messages) {
    if (msg.role === 'system') continue;

    const isUser = msg.role === 'user';
    const label = isUser ? 'Vous' : `${AI_ASSISTANT_NAME}${msg.methodStep ? ` [${msg.methodStep}]` : ''}`;

    // Label
    addPageIfNeeded(15);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isUser ? 37 : 99, isUser ? 99 : 102, isUser ? 235 : 241);
    doc.text(label, margin, y);
    y += 5;

    // Content - strip markdown formatting for PDF
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);

    const cleanContent = stripMarkdown(msg.content);
    const lines = doc.splitTextToSize(cleanContent, maxWidth);

    for (const line of lines) {
      addPageIfNeeded(5);
      doc.text(line, margin, y);
      y += 5;
    }
    y += 5;
  }

  // Footer
  addPageIfNeeded(15);
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Exporte depuis ${AI_ASSISTANT_NAME} - Formation Prompt Engineering`, margin, doc.internal.pageSize.getHeight() - 10);

  doc.save(`genia-chat-${formatDateForFilename()}.pdf`);
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/`{1,3}(.*?)`{1,3}/gs, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s/gm, '- ')
    .replace(/^\s*\d+\.\s/gm, '')
    .trim();
}

function formatDateForFilename(): string {
  return new Date().toISOString().split('T')[0];
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
