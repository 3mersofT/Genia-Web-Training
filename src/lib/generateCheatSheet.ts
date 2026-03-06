import jsPDF from 'jspdf';

export function generateRCTFCheatSheet(): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Header
  doc.setFillColor(102, 126, 234);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('RCTF - Aide-Memoire', 105, 18, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Framework de Prompt Engineering | GENIA Web Training', 105, 28, { align: 'center' });

  let y = 55;
  doc.setTextColor(0, 0, 0);

  // Section R
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(15, y, 180, 45, 3, 3, 'F');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('R - Role', 20, y + 10);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text("Definir QUI est l'IA dans le contexte de votre demande.", 20, y + 20);
  doc.setFont('helvetica', 'italic');
  doc.text("Exemple : \"Agis en tant qu'expert en marketing digital avec 10 ans d'experience.\"", 20, y + 28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Questions cles : Quel expert ? Quel niveau ? Quel domaine ?', 20, y + 38);

  y += 55;

  // Section C
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(15, y, 180, 45, 3, 3, 'F');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text('C - Contexte', 20, y + 10);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text("Fournir les informations de fond necessaires a la comprehension.", 20, y + 20);
  doc.setFont('helvetica', 'italic');
  doc.text("Exemple : \"Je lance une startup SaaS B2B ciblant les PME francaises du secteur retail.\"", 20, y + 28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text('Questions cles : Quel probleme ? Quelle situation ? Quelles contraintes ?', 20, y + 38);

  y += 55;

  // Section T
  doc.setFillColor(254, 249, 195);
  doc.roundedRect(15, y, 180, 45, 3, 3, 'F');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(202, 138, 4);
  doc.text('T - Tache', 20, y + 10);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text("Definir precisement CE QUE l'IA doit faire.", 20, y + 20);
  doc.setFont('helvetica', 'italic');
  doc.text("Exemple : \"Redige 5 accroches publicitaires de 50 mots max pour une campagne LinkedIn.\"", 20, y + 28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(202, 138, 4);
  doc.text('Questions cles : Quelle action ? Quel livrable ? Quelle quantite ?', 20, y + 38);

  y += 55;

  // Section F
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(15, y, 180, 45, 3, 3, 'F');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(147, 51, 234);
  doc.text('F - Format', 20, y + 10);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text("Specifier COMMENT la reponse doit etre structuree.", 20, y + 20);
  doc.setFont('helvetica', 'italic');
  doc.text("Exemple : \"Presente sous forme de tableau avec colonnes : Accroche | Ton | CTA\"", 20, y + 28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(147, 51, 234);
  doc.text('Questions cles : Quelle structure ? Quelle longueur ? Quel ton ?', 20, y + 38);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  doc.text('GENIA Web Training - Prompt Engineering Academy - genia-web-training.vercel.app', 105, 290, { align: 'center' });

  return doc;
}
