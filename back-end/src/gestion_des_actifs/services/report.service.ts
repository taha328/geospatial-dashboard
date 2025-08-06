import { Injectable } from '@nestjs/common';
import { Maintenance } from '../entities/maintenance.entity';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ReportService {
  // Define a consistent color palette for reports
  private colors = {
    primary: '#2c3e50',     // Dark blue
    secondary: '#34495e',   // Darker blue
    accent: '#3498db',      // Blue
    success: '#27ae60',     // Green
    warning: '#f39c12',     // Orange
    danger: '#e74c3c',      // Red
    light: '#f8f9fa',       // Very light gray
    border: '#dee2e6',      // Light border
    text: '#2c3e50',        // Dark text
    lightText: '#6c757d',   // Medium gray
    white: '#ffffff',
  };

  private readonly pageMargin = 40;
  private readonly lineHeight = 14;
  private readonly sectionSpacing = 8;

  async generateMaintenanceReport(maintenance: Maintenance): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ 
        margin: this.pageMargin,
        size: 'A4',
        info: {
          Title: `Rapport de Maintenance - ${maintenance.titre}`,
          Author: 'Geospatial Dashboard',
          Subject: `Maintenance ID: ${maintenance.id}`,
          Keywords: 'maintenance, geospatial, actif',
        }
      });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      // Create the report content
      this.createStandardReport(doc, maintenance);

      doc.end();
    });
  }

  async generateProfessionalMaintenanceReport(maintenance: Maintenance): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ 
        margin: this.pageMargin,
        size: 'A4',
        info: {
          Title: `Rapport Professionnel de Maintenance - ${maintenance.titre}`,
          Author: 'Geospatial Dashboard',
          Subject: `Maintenance ID: ${maintenance.id}`,
          Keywords: 'maintenance, geospatial, rapport professionnel, actif',
        }
      });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      // Create the professional report
      this.createProfessionalReport(doc, maintenance);

      doc.end();
    });
  }

  private createStandardReport(doc: PDFKit.PDFDocument, maintenance: Maintenance): void {
    this.createHeader(doc, 'RAPPORT DE MAINTENANCE', maintenance);
    
    // Main content sections
    this.addMaintenanceDetails(doc, maintenance);
    this.addTimelineSection(doc, maintenance);
    this.addFinancialSection(doc, maintenance);
    this.addInterventionSection(doc, maintenance);
    
    this.addFooter(doc, maintenance);
  }

  private createProfessionalReport(doc: PDFKit.PDFDocument, maintenance: Maintenance): void {
    this.createCoverPage(doc, maintenance);
    doc.addPage();
    
    this.createTableOfContents(doc);
    doc.addPage();
    
    this.createExecutiveSummary(doc, maintenance);
    this.addDetailedAnalysis(doc, maintenance);
    this.addRecommendations(doc, maintenance);
    
    this.addProfessionalFooter(doc, maintenance);
  }

  private createHeader(doc: PDFKit.PDFDocument, title: string, maintenance: Maintenance): void {
    const headerHeight = 80;
    
    // Header background with gradient effect
    doc
      .rect(0, 0, doc.page.width, headerHeight)
      .fill(this.colors.primary);
    
    // Company logo area (placeholder)
    doc
      .rect(this.pageMargin, 15, 50, 50)
      .lineWidth(2)
      .fillAndStroke(this.colors.white, this.colors.accent);
    
    // Add logo text
    doc
      .fillColor(this.colors.accent)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('GEO', this.pageMargin + 15, 35, { width: 20, align: 'center' });
    
    // Main title
    doc
      .fillColor(this.colors.white)
      .fontSize(22)
      .font('Helvetica-Bold')
      .text(title, this.pageMargin + 80, 25);
    
    // Subtitle with maintenance info
    doc
      .fillColor(this.colors.white)
      .fontSize(11)
      .font('Helvetica')
      .text(`Référence: M-${maintenance.id} | ${this.formatDate(new Date())}`, 
             this.pageMargin + 80, 50);
    
    // Accent line
    doc
      .rect(0, headerHeight, doc.page.width, 3)
      .fill(this.colors.accent);
    
    doc.y = headerHeight + 20;
  }

  private createCoverPage(doc: PDFKit.PDFDocument, maintenance: Maintenance): void {
    // Background
    doc
      .rect(0, 0, doc.page.width, doc.page.height)
      .fill(this.colors.light);
    
    // Main header
    doc
      .rect(0, 0, doc.page.width, 120)
      .fill(this.colors.primary);
    
    // Logo and company name
    doc
      .rect(this.pageMargin, 25, 60, 60)
      .lineWidth(3)
      .fillAndStroke(this.colors.white, this.colors.accent);
    
    doc
      .fillColor(this.colors.accent)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('GEOSPATIAL\nDASHBOARD', this.pageMargin + 5, 40, { 
        width: 50, 
        align: 'center',
        lineGap: 2
      });
    
    // Main title
    doc
      .fillColor(this.colors.white)
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('RAPPORT DE MAINTENANCE', this.pageMargin + 120, 35);
    
    doc
      .fontSize(14)
      .font('Helvetica')
      .text('RAPPORT PROFESSIONNEL', this.pageMargin + 120, 70);
    
    // Content box
    const boxY = 180;
    const boxHeight = 350;
    
    doc
      .roundedRect(this.pageMargin, boxY, doc.page.width - (2 * this.pageMargin), boxHeight, 10)
      .fill(this.colors.white)
      .stroke(this.colors.border);
    
    // Maintenance title
    doc
      .fillColor(this.colors.primary)
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(maintenance.titre, this.pageMargin + 30, boxY + 40, {
        width: doc.page.width - (2 * this.pageMargin) - 60,
        align: 'center'
      });
    
    // Status badge
    this.createStatusBadge(doc, maintenance.statut, boxY + 100);
    
    // Key information
    const infoY = boxY + 160;
    this.addCoverInfo(doc, 'Type de Maintenance:', maintenance.typeMaintenance || 'Standard', infoY);
    this.addCoverInfo(doc, 'Période d\'intervention:', 
      `${this.formatDateShort(maintenance.dateDebut)} - ${this.formatDateShort(maintenance.dateFin)}`, 
      infoY + 25);
    
    if (maintenance.actif) {
      this.addCoverInfo(doc, 'Actif concerné:', maintenance.actif.nom, infoY + 50);
      this.addCoverInfo(doc, 'Code actif:', maintenance.actif.code, infoY + 75);
    }
    
    // Footer
    doc
      .rect(0, doc.page.height - 60, doc.page.width, 60)
      .fill(this.colors.primary);
    
    doc
      .fillColor(this.colors.white)
      .fontSize(12)
      .font('Helvetica')
      .text(`Généré le ${this.formatDate(new Date())}`, 0, doc.page.height - 30, {
        width: doc.page.width,
        align: 'center'
      });
  }

  private createStatusBadge(doc: PDFKit.PDFDocument, status: string, y: number): void {
    const statusText = this.formatStatus(status);
    const statusColor = this.getStatusColor(status);
    const badgeWidth = 200;
    const badgeHeight = 35;
    const badgeX = (doc.page.width - badgeWidth) / 2;
    
    doc
      .roundedRect(badgeX, y, badgeWidth, badgeHeight, 18)
      .fill(statusColor);
    
    doc
      .fillColor(this.colors.white)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(statusText, badgeX, y + 8, {
        width: badgeWidth,
        align: 'center'
      });
  }

  private addCoverInfo(doc: PDFKit.PDFDocument, label: string, value: string, y: number): void {
    doc
      .fillColor(this.colors.lightText)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(label, this.pageMargin + 50, y);
    
    doc
      .fillColor(this.colors.text)
      .fontSize(11)
      .font('Helvetica')
      .text(value, this.pageMargin + 180, y);
  }

  private createTableOfContents(doc: PDFKit.PDFDocument): void {
    this.addSectionTitle(doc, 'TABLE DES MATIÈRES');
    
    const contents = [
      { title: '1. Résumé Exécutif', page: 3 },
      { title: '2. Détails de la Maintenance', page: 3 },
      { title: '3. Analyse Comparative', page: 4 },
      { title: '4. Analyse Financière', page: 4 },
      { title: '5. Rapport d\'Intervention', page: 5 },
      { title: '6. Recommandations', page: 5 },
    ];
    
    contents.forEach((item, index) => {
      const y = doc.y + (index * 20);
      
      doc
        .fillColor(this.colors.text)
        .fontSize(12)
        .font('Helvetica')
        .text(item.title, this.pageMargin, y);
      
      // Dotted line
      const dotY = y + 6;
      for (let x = this.pageMargin + 200; x < doc.page.width - 80; x += 8) {
        doc
          .fillColor(this.colors.lightText)
          .circle(x, dotY, 0.5)
          .fill();
      }
      
      doc
        .fillColor(this.colors.text)
        .text(item.page.toString(), doc.page.width - 80, y, { align: 'right', width: 40 });
    });
  }

  private createExecutiveSummary(doc: PDFKit.PDFDocument, maintenance: Maintenance): void {
    this.addSectionTitle(doc, 'RÉSUMÉ EXÉCUTIF');
    
    // Key metrics cards
    this.createMetricCards(doc, maintenance);
    
    // Summary text
    doc.y += this.sectionSpacing;
    this.addParagraph(doc, 
      `Cette maintenance ${maintenance.typeMaintenance?.toLowerCase() || 'standard'} a été réalisée ` +
      `sur l'actif ${maintenance.actif?.nom || 'N/A'} avec un statut final de "${this.formatStatus(maintenance.statut)}". ` +
      `L'intervention s'est déroulée du ${this.formatDateShort(maintenance.dateDebut)} au ${this.formatDateShort(maintenance.dateFin)}.`
    );
  }

  private createMetricCards(doc: PDFKit.PDFDocument, maintenance: Maintenance): void {
    const cardWidth = 120;
    const cardHeight = 80;
    const cardSpacing = 15;
    const startX = this.pageMargin;
    
    const metrics = [
      {
        title: 'Coût Estimé',
        value: `${(maintenance.coutEstime || 0).toLocaleString('fr-FR')} MAD`,
        color: this.colors.primary
      },
      {
        title: 'Coût Réel',
        value: `${(maintenance.coutReel || 0).toLocaleString('fr-FR')} MAD`,
        color: this.colors.accent
      },
      {
        title: 'Variance',
        value: this.calculateVarianceText(maintenance.coutEstime || 0, maintenance.coutReel || 0),
        color: (maintenance.coutReel || 0) > (maintenance.coutEstime || 0) ? this.colors.danger : this.colors.success
      },
      {
        title: 'Statut',
        value: this.formatStatus(maintenance.statut),
        color: this.getStatusColor(maintenance.statut)
      }
    ];
    
    metrics.forEach((metric, index) => {
      const x = startX + (index * (cardWidth + cardSpacing));
      const y = doc.y;
      
      // Card background
      doc
        .roundedRect(x, y, cardWidth, cardHeight, 8)
        .fill(this.colors.light)
        .stroke(this.colors.border);
      
      // Header
      doc
        .rect(x, y, cardWidth, 25)
        .fill(metric.color);
      
      // Title
      doc
        .fillColor(this.colors.white)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(metric.title, x + 8, y + 7, { width: cardWidth - 16, align: 'center' });
      
      // Value
      doc
        .fillColor(metric.color)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(metric.value, x + 8, y + 40, { 
          width: cardWidth - 16, 
          align: 'center',
          lineGap: 2
        });
    });
    
    doc.y += cardHeight + this.sectionSpacing;
  }

  private addDetailedAnalysis(doc: PDFKit.PDFDocument, maintenance: Maintenance): void {
    this.checkPageSpace(doc, 100);
    this.addSectionTitle(doc, 'ANALYSE DÉTAILLÉE');
    
    // Timeline comparison
    this.addSubsectionTitle(doc, 'Comparaison Temporelle');
    this.createTimelineComparison(doc, maintenance);
    
    // Financial analysis
    this.addSubsectionTitle(doc, 'Analyse Financière');
    this.createFinancialAnalysis(doc, maintenance);
  }

  private createTimelineComparison(doc: PDFKit.PDFDocument, maintenance: Maintenance): void {
    const tableY = doc.y;
    const tableWidth = doc.page.width - (2 * this.pageMargin);
    const colWidth = tableWidth / 3;
    const rowHeight = 30;
    
    // Table headers
    const headers = ['Étape', 'Planifié', 'Réalisé'];
    headers.forEach((header, index) => {
      const x = this.pageMargin + (index * colWidth);
      
      doc
        .rect(x, tableY, colWidth, rowHeight)
        .fill(this.colors.primary)
        .stroke(this.colors.white);
      
      doc
        .fillColor(this.colors.white)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(header, x + 10, tableY + 8, { width: colWidth - 20, align: 'center' });
    });
    
    // Table rows
    const rows = [
      ['Date de début', this.formatDateShort(maintenance.datePrevue), this.formatDateShort(maintenance.dateDebut)],
      ['Date de fin', this.formatDateShort(maintenance.datePrevue), this.formatDateShort(maintenance.dateFin)]
    ];
    
    rows.forEach((row, rowIndex) => {
      const y = tableY + rowHeight + (rowIndex * rowHeight);
      
      row.forEach((cell, colIndex) => {
        const x = this.pageMargin + (colIndex * colWidth);
        
        doc
          .rect(x, y, colWidth, rowHeight)
          .fill(rowIndex % 2 === 0 ? this.colors.white : this.colors.light)
          .stroke(this.colors.border);
        
        doc
          .fillColor(this.colors.text)
          .fontSize(10)
          .font(colIndex === 0 ? 'Helvetica-Bold' : 'Helvetica')
          .text(cell, x + 10, y + 8, { width: colWidth - 20, align: 'center' });
      });
    });
    
    doc.y = tableY + rowHeight + (rows.length * rowHeight) + this.sectionSpacing;
  }

  private createFinancialAnalysis(doc: PDFKit.PDFDocument, maintenance: Maintenance): void {
    const estimated = maintenance.coutEstime || 0;
    const actual = maintenance.coutReel || 0;
    const variance = actual - estimated;
    const variancePercent = estimated > 0 ? (variance / estimated) * 100 : 0;
    
    // Financial summary box
    const boxY = doc.y;
    const boxHeight = 120;
    const boxWidth = doc.page.width - (2 * this.pageMargin);
    
    doc
      .roundedRect(this.pageMargin, boxY, boxWidth, boxHeight, 8)
      .fill(this.colors.light)
      .stroke(this.colors.border);
    
    // Title
    doc
      .fillColor(this.colors.primary)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Analyse Budgétaire', this.pageMargin + 15, boxY + 15);
    
    // Content
    let contentY = boxY + 40;
    
    this.addKeyValuePair(doc, 'Coût estimé:', `${estimated.toLocaleString('fr-FR')} MAD`, contentY);
    contentY += 20;
    
    this.addKeyValuePair(doc, 'Coût réel:', `${actual.toLocaleString('fr-FR')} MAD`, contentY);
    contentY += 20;
    
    const varianceColor = variance >= 0 ? this.colors.danger : this.colors.success;
    const varianceText = `${variance >= 0 ? '+' : ''}${variance.toLocaleString('fr-FR')} MAD (${variancePercent.toFixed(1)}%)`;
    
    doc
      .fillColor(this.colors.text)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Écart budgétaire:', this.pageMargin + 15, contentY);
    
    doc
      .fillColor(varianceColor)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(varianceText, this.pageMargin + 150, contentY);
    
    doc.y = boxY + boxHeight + this.sectionSpacing;
  }

  private addRecommendations(doc: PDFKit.PDFDocument, maintenance: Maintenance): void {
    this.checkPageSpace(doc, 100);
    this.addSectionTitle(doc, 'RECOMMANDATIONS');
    
    const recommendations = this.generateRecommendations(maintenance);
    
    recommendations.forEach((recommendation, index) => {
      this.addBulletPoint(doc, recommendation, index + 1);
    });
  }

  private generateRecommendations(maintenance: Maintenance): string[] {
    const recommendations: string[] = [];
    const estimated = maintenance.coutEstime || 0;
    const actual = maintenance.coutReel || 0;
    const variance = actual - estimated;
    
    // Budget-based recommendations
    if (variance > estimated * 0.1) {
      recommendations.push('Réviser les estimations budgétaires pour les futures maintenances similaires');
      recommendations.push('Analyser les causes du dépassement budgétaire pour améliorer la planification');
    } else if (variance < -estimated * 0.1) {
      recommendations.push('Optimiser les ressources allouées pour ce type de maintenance');
    }
    
    // Status-based recommendations
    if (maintenance.statut === 'terminee') {
      recommendations.push('Planifier la prochaine maintenance préventive selon le calendrier établi');
    } else {
      recommendations.push('Assurer le suivi régulier de l\'avancement de la maintenance');
    }
    
    // Asset-specific recommendations
    if (maintenance.actif) {
      recommendations.push(`Mettre à jour l'historique de maintenance de l'actif ${maintenance.actif.nom}`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Maintenir les bonnes pratiques actuelles de gestion de maintenance');
    }
    
    return recommendations;
  }

  // Utility methods for consistent formatting

  private addSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    this.checkPageSpace(doc, 60);
    
    doc
      .fillColor(this.colors.primary)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(title, this.pageMargin, doc.y);
    
    // Underline
    doc
      .moveTo(this.pageMargin, doc.y + 5)
      .lineTo(doc.page.width - this.pageMargin, doc.y + 5)
      .strokeColor(this.colors.accent)
      .lineWidth(2)
      .stroke();
    
    doc.y += 20;
  }

  private addSubsectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    this.checkPageSpace(doc, 40);
    
    doc
      .fillColor(this.colors.secondary)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(title, this.pageMargin, doc.y);
    
    doc.y += this.lineHeight;
  }

  private addParagraph(doc: PDFKit.PDFDocument, text: string): void {
    this.checkPageSpace(doc, 60);
    
    doc
      .fillColor(this.colors.text)
      .fontSize(10)
      .font('Helvetica')
      .text(text, this.pageMargin, doc.y, {
        width: doc.page.width - (2 * this.pageMargin),
        align: 'justify',
        lineGap: 2
      });
    
    doc.y += this.sectionSpacing;
  }

  private addKeyValuePair(doc: PDFKit.PDFDocument, key: string, value: string, y: number): void {
    doc
      .fillColor(this.colors.text)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(key, this.pageMargin + 15, y);
    
    doc
      .fillColor(this.colors.text)
      .fontSize(10)
      .font('Helvetica')
      .text(value, this.pageMargin + 150, y);
  }

  private addBulletPoint(doc: PDFKit.PDFDocument, text: string, number: number): void {
    this.checkPageSpace(doc, 30);
    
    doc
      .fillColor(this.colors.accent)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(`${number}.`, this.pageMargin, doc.y);
    
    doc
      .fillColor(this.colors.text)
      .fontSize(10)
      .font('Helvetica')
      .text(text, this.pageMargin + 20, doc.y, {
        width: doc.page.width - (2 * this.pageMargin) - 20,
        lineGap: 2
      });
    
    doc.y += this.sectionSpacing;
  }

  private checkPageSpace(doc: PDFKit.PDFDocument, requiredSpace: number): void {
    if (doc.y + requiredSpace > doc.page.height - 100) {
      doc.addPage();
      doc.y = this.pageMargin;
    }
  }

  // Legacy methods for standard report (simplified)
  private addMaintenanceDetails(doc: PDFKit.PDFDocument, maintenance: Maintenance): void {
    this.addSectionTitle(doc, 'DÉTAILS DE LA MAINTENANCE');
    
    this.addDetailRow(doc, 'Titre:', maintenance.titre);
    this.addDetailRow(doc, 'Description:', maintenance.description);
    this.addDetailRow(doc, 'Type:', maintenance.typeMaintenance);
    this.addDetailRow(doc, 'Statut:', this.formatStatus(maintenance.statut));
    
    if (maintenance.actif) {
      this.addDetailRow(doc, 'Actif:', maintenance.actif.nom);
      this.addDetailRow(doc, 'Code Actif:', maintenance.actif.code);
    }
  }

  private addTimelineSection(doc: PDFKit.PDFDocument, maintenance: Maintenance): void {
    this.addSectionTitle(doc, 'CHRONOLOGIE');
    
    this.addDetailRow(doc, 'Date prévue:', this.formatDate(maintenance.datePrevue));
    this.addDetailRow(doc, 'Date de début:', this.formatDate(maintenance.dateDebut));
    this.addDetailRow(doc, 'Date de fin:', this.formatDate(maintenance.dateFin));
  }

  private addFinancialSection(doc: PDFKit.PDFDocument, maintenance: Maintenance): void {
    this.addSectionTitle(doc, 'INFORMATIONS FINANCIÈRES');
    
    this.addDetailRow(doc, 'Coût estimé:', `${(maintenance.coutEstime || 0).toLocaleString('fr-FR')} MAD`);
    this.addDetailRow(doc, 'Coût réel:', `${(maintenance.coutReel || 0).toLocaleString('fr-FR')} MAD`);
  }

  private addInterventionSection(doc: PDFKit.PDFDocument, maintenance: Maintenance): void {
    this.addSectionTitle(doc, 'DÉTAILS DE L\'INTERVENTION');
    
    this.addDetailRow(doc, 'Technicien responsable:', maintenance.technicienResponsable);
    this.addDetailRow(doc, 'Entreprise externe:', maintenance.entrepriseExterne || 'N/A');
    
    if (maintenance.rapportIntervention) {
      this.addSubsectionTitle(doc, 'Rapport d\'intervention:');
      this.addParagraph(doc, maintenance.rapportIntervention);
    }
    
    if (maintenance.piecesRemplacees) {
      this.addDetailRow(doc, 'Pièces remplacées:', maintenance.piecesRemplacees);
    }
  }

  private addDetailRow(doc: PDFKit.PDFDocument, label: string, value: string | undefined | null): void {
    if (!value) return;
    
    this.checkPageSpace(doc, 25);
    
    doc
      .fillColor(this.colors.secondary)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(label, this.pageMargin, doc.y);
    
    doc
      .fillColor(this.colors.text)
      .fontSize(10)
      .font('Helvetica')
      .text(value, this.pageMargin + 120, doc.y);
    
    doc.y += this.lineHeight;
  }

  // Footer methods
  private addFooter(doc: PDFKit.PDFDocument, maintenance: Maintenance): void {
    const pageRange = doc.bufferedPageRange();
    
    for (let i = 0; i < pageRange.count; i++) {
      doc.switchToPage(pageRange.start + i);
      
      doc
        .rect(0, doc.page.height - 50, doc.page.width, 50)
        .fill(this.colors.light);
      
      doc
        .moveTo(this.pageMargin, doc.page.height - 50)
        .lineTo(doc.page.width - this.pageMargin, doc.page.height - 50)
        .strokeColor(this.colors.border)
        .stroke();
      
      doc
        .fillColor(this.colors.text)
        .fontSize(9)
        .font('Helvetica')
        .text(
          `Rapport M-${maintenance.id} | Page ${i + 1} de ${pageRange.count}`,
          this.pageMargin,
          doc.page.height - 30,
          { align: 'center', width: doc.page.width - (2 * this.pageMargin) }
        );
    }
  }

  private addProfessionalFooter(doc: PDFKit.PDFDocument, maintenance: Maintenance): void {
    const pageRange = doc.bufferedPageRange();
    
    for (let i = 0; i < pageRange.count; i++) {
      doc.switchToPage(pageRange.start + i);
      
      // Skip cover page
      if (i === 0) continue;
      
      doc
        .rect(0, doc.page.height - 60, doc.page.width, 60)
        .fill(this.colors.primary);
      
      doc
        .fillColor(this.colors.white)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('GEOSPATIAL DASHBOARD', this.pageMargin, doc.page.height - 40);
      
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(`Rapport M-${maintenance.id}`, this.pageMargin, doc.page.height - 25);
      
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(`Page ${i} de ${pageRange.count - 1}`, doc.page.width - 100, doc.page.height - 40, {
          align: 'right',
          width: 80
        });
      
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(`Généré le ${this.formatDateShort(new Date())}`, doc.page.width - 100, doc.page.height - 25, {
          align: 'right',
          width: 80
        });
    }
  }

  // Helper methods
  private calculateVarianceText(estimated: number, actual: number): string {
    const variance = actual - estimated;
    const symbol = variance >= 0 ? '+' : '';
    return `${symbol}${variance.toLocaleString('fr-FR')} MAD`;
  }

  private formatStatus(status: string): string {
    if (!status) return 'Non défini';
    
    const statusMap: { [key: string]: string } = {
      'planifiee': 'Planifiée',
      'en_cours': 'En Cours',
      'terminee': 'Terminée',
      'annulee': 'Annulée',
      'suspendue': 'Suspendue'
    };
    
    return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
  }

  private getStatusColor(status: string): string {
    if (!status) return this.colors.lightText;
    
    const colorMap: { [key: string]: string } = {
      'planifiee': this.colors.warning,
      'en_cours': this.colors.accent,
      'terminee': this.colors.success,
      'annulee': this.colors.danger,
      'suspendue': this.colors.lightText
    };
    
    return colorMap[status] || this.colors.primary;
  }

  private formatDate(date: Date | string | undefined | null): string {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return 'N/A';
    
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatDateShort(date: Date | string | undefined | null): string {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return 'N/A';
    
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}