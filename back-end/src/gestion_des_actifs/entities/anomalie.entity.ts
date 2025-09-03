import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Actif } from './actif.entity';
import { Maintenance } from './maintenance.entity';
import { Inspection } from './inspection.entity';

@Entity('anomalies')
export class Anomalie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  titre: string;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: ['faible', 'moyen', 'eleve', 'critique'], default: 'moyen' })
  priorite: string;

  @Column({ type: 'enum', enum: ['nouveau', 'en_cours', 'resolu', 'ferme'], default: 'nouveau' })
  statut: string;

  @Column({ type: 'enum', enum: ['structural', 'mecanique', 'electrique', 'securite', 'autre'], default: 'autre' })
  typeAnomalie: string;

  @Column({ type: 'date', nullable: true })
  dateDetection: Date;

  @Column({ type: 'date', nullable: true })
  dateResolution: Date;

  @Column({ length: 255, nullable: true })
  rapportePar: string;

  @Column({ length: 255, nullable: true })
  assigneA: string;

  @Column('text', { nullable: true })
  actionsCorrectives: string;

  @Column('json', { nullable: true })
  photosAnnexes: any;

  // Coordonnées géographiques pour signalement direct sur carte
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true, name: 'actifId' })
  actifId: number;

  // Relationship with maintenance for corrective actions
  @Column({ nullable: true, name: 'maintenanceId' })
  maintenanceId?: number;

  // Relationship with inspection if anomaly was detected during inspection
  @Column({ nullable: true, name: 'inspectionId' })
  inspectionId?: number;

  @CreateDateColumn({ name: 'dateCreation' })
  dateCreation: Date;

  @UpdateDateColumn({ name: 'dateMiseAJour' })
  dateMiseAJour: Date;

  @ManyToOne(() => Actif, actif => actif.anomalies)
  @JoinColumn({ name: 'actifId' })
  actif: Actif;

  @OneToOne(() => Maintenance, maintenance => maintenance.anomalie)
  @JoinColumn({ name: 'maintenanceId' })
  maintenance?: Maintenance;

  @ManyToOne(() => Inspection, inspection => inspection.anomaliesDetectees)
  @JoinColumn({ name: 'inspectionId' })
  inspection?: Inspection;
}
