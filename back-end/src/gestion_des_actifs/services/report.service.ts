import { Injectable } from '@nestjs/common';
import { Maintenance } from '../entities/maintenance.entity';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ReportService {
  async generateMaintenanceReport(maintenance: Maintenance): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      // --- Report Header ---
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('Rapport de Maintenance', { align: 'center' });
      doc.moveDown();

      // --- Maintenance Details ---
      doc.fontSize(14).font('Helvetica-Bold').text('Détails de la Maintenance');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      this.addSection(doc, 'Titre', maintenance.titre);
      this.addSection(doc, 'Description', maintenance.description);
      this.addSection(doc, 'Statut', maintenance.statut);
      this.addSection(doc, 'Type', maintenance.typeMaintenance);

      // --- Dates ---
      doc.moveDown();
      doc.fontSize(14).font('Helvetica-Bold').text('Chronologie');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      this.addSection(doc, 'Date Prévue', this.formatDate(maintenance.datePrevue));
      this.addSection(doc, 'Date de Début', this.formatDate(maintenance.dateDebut));
      this.addSection(doc, 'Date de Fin', this.formatDate(maintenance.dateFin));

      // --- Financials ---
      doc.moveDown();
      doc.fontSize(14).font('Helvetica-Bold').text('Informations Financières');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      this.addSection(doc, 'Coût Estimé', `${maintenance.coutEstime || 0} MAD`);
      this.addSection(doc, 'Coût Réel', `${maintenance.coutReel || 0} MAD`);

      // --- Intervention Details ---
      doc.moveDown();
      doc.fontSize(14).font('Helvetica-Bold').text('Détails de l\'Intervention');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      this.addSection(doc, 'Technicien Responsable', maintenance.technicienResponsable);
      this.addSection(doc, 'Rapport d\'Intervention', maintenance.rapportIntervention);

      // --- Footer ---
      doc.fontSize(10).font('Helvetica').text('Généré par le système de gestion des actifs portuaires.', 50, 750, { align: 'center', lineBreak: false });

      doc.end();
    });
  }

  async generateProfessionalMaintenanceReport(maintenance: Maintenance): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      // --- Professional Report Header ---
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Rapport Professionnel de Maintenance', { align: 'center' });
      doc.moveDown();
      
      doc
        .fontSize(12)
        .font('Helvetica')
        .text(`Généré le: ${this.formatDate(new Date())}`, { align: 'right' });
      doc.moveDown(2);

      // --- Executive Summary ---
      doc.fontSize(16).font('Helvetica-Bold').text('Résumé Exécutif');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      this.addSection(doc, 'Maintenance ID', maintenance.id?.toString());
      this.addSection(doc, 'Titre', maintenance.titre);
      this.addSection(doc, 'Statut Final', maintenance.statut);
      this.addSection(doc, 'Type d\'Intervention', maintenance.typeMaintenance);
      
      if (maintenance.actif) {
        this.addSection(doc, 'Actif Concerné', maintenance.actif.nom);
        this.addSection(doc, 'Code Actif', maintenance.actif.code);
      }

      // --- Comparison Section: Planned vs Actual ---
      doc.moveDown();
      doc.fontSize(16).font('Helvetica-Bold').text('Comparaison Prévisionnel vs Réalisé');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Dates comparison
      doc.fontSize(14).font('Helvetica-Bold').text('Dates:');
      doc.moveDown(0.5);
      
      const currentY = doc.y;
      doc.fontSize(12).font('Helvetica').text('Planifié:', 50, currentY);
      doc.text('Réalisé:', 300, currentY);
      doc.moveDown(0.5);
      
      doc.text(`Début: ${this.formatDate(maintenance.datePrevue)}`, 50, doc.y);
      doc.text(`Début: ${this.formatDate(maintenance.dateDebut)}`, 300, doc.y);
      doc.moveDown(0.5);
      
      doc.text(`Fin: ${this.formatDate(maintenance.datePrevue)}`, 50, doc.y);
      doc.text(`Fin: ${this.formatDate(maintenance.dateFin)}`, 300, doc.y);
      doc.moveDown(1);

      // Cost comparison
      doc.fontSize(14).font('Helvetica-Bold').text('Analyse Financière:');
      doc.moveDown(0.5);
      
      const estimatedCost = maintenance.coutEstime || 0;
      const actualCost = maintenance.coutReel || 0;
      const variance = actualCost - estimatedCost;
      const variancePercent = estimatedCost > 0 ? (variance / estimatedCost) * 100 : 0;

      doc.fontSize(12).font('Helvetica').text(`Coût Estimé: ${estimatedCost} MAD`, 50, doc.y);
      doc.text(`Coût Réel: ${actualCost} MAD`, 300, doc.y);
      doc.moveDown(0.5);
      
      doc.text(`Écart: ${variance > 0 ? '+' : ''}${variance} MAD (${variancePercent.toFixed(1)}%)`, 50, doc.y);
      doc.moveDown(1);

      // Duration analysis if dates available
      if (maintenance.dateDebut && maintenance.dateFin && maintenance.datePrevue) {
        const plannedDuration = 'Estimation: 1 jour'; // Could calculate from datePrevue
        const actualStart = new Date(maintenance.dateDebut);
        const actualEnd = new Date(maintenance.dateFin);
        const actualDuration = Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24));
        
        doc.fontSize(14).font('Helvetica-Bold').text('Durée d\'Intervention:');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text(`${plannedDuration}`, 50, doc.y);
        doc.text(`Réalisé: ${actualDuration} jour(s)`, 300, doc.y);
        doc.moveDown(1);
      }

      // --- Detailed Execution Report ---
      doc.moveDown();
      doc.fontSize(16).font('Helvetica-Bold').text('Rapport d\'Exécution Détaillé');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      this.addSection(doc, 'Technicien Responsable', maintenance.technicienResponsable);
      this.addSection(doc, 'Entreprise Externe', maintenance.entrepriseExterne);
      
      if (maintenance.rapportIntervention) {
        doc.fontSize(12).font('Helvetica-Bold').text('Rapport d\'Intervention:');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text(maintenance.rapportIntervention, {
          width: 500,
          align: 'justify'
        });
        doc.moveDown();
      }

      this.addSection(doc, 'Pièces Remplacées', maintenance.piecesRemplacees);

      // --- Quality Assessment ---
      doc.moveDown();
      doc.fontSize(16).font('Helvetica-Bold').text('Évaluation de la Qualité');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Performance indicators
      const costEfficiency = estimatedCost > 0 ? 
        (variance <= 0 ? 'Excellent' : variance < estimatedCost * 0.1 ? 'Bon' : 'À améliorer') : 'N/A';
      
      this.addSection(doc, 'Efficacité Budgétaire', costEfficiency);
      this.addSection(doc, 'Statut de Completion', maintenance.statut === 'terminee' ? 'Terminé avec succès' : 'En cours');

      // --- Footer ---
      doc.fontSize(10).font('Helvetica').text(
        'Ce rapport professionnel a été généré automatiquement par le système de gestion des actifs portuaires.', 
        50, 750, { align: 'center', lineBreak: false }
      );

      doc.end();
    });
  }

  private addSection(doc: PDFKit.PDFDocument, title: string, content: string | undefined | null) {
    if (content) {
      doc.fontSize(12).font('Helvetica-Bold').text(`${title}: `, { continued: true });
      doc.font('Helvetica').text(content);
      doc.moveDown(0.5);
    }
  }

  private formatDate(date: Date | undefined | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
