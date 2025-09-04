import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Actif } from './actif.entity';
import { TypeInspection } from './type-inspection.entity';
import { Anomalie } from './anomalie.entity';

@Entity('inspections')
export class Inspection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  titre: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'date' })
  datePrevue: Date;

  @Column({ type: 'date', nullable: true })
  dateRealisation: Date;

  @Column({ type: 'enum', enum: ['planifiee', 'en_cours', 'terminee', 'annulee', 'reportee'], default: 'planifiee' })
  statut: string;

  @Column({ type: 'enum', enum: ['bon', 'moyen', 'mauvais', 'critique'], nullable: true })
  resultatGeneral: string;

  @Column('text', { nullable: true })
  observations: string;

  @Column('text', { nullable: true })
  recommandations: string;

  @Column({ length: 255, nullable: true })
  inspecteurResponsable: string;

  @Column({ length: 255, nullable: true })
  organismeInspection: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  coutInspection: number;

  @Column('json', { nullable: true })
  photosRapport: any;

  @Column('json', { nullable: true })
  documentsAnnexes: any;

  @Column('json', { nullable: true })
  mesuresRelevees: any; // Pour stocker les données techniques (dimensions, etc.)

  @Column({ type: 'enum', enum: ['conforme', 'non_conforme', 'avec_reserves'], nullable: true })
  conformite: string;

  // Column names match actual database schema
  @Column({ nullable: true, name: 'actifId' })
  actifId: number;

  // Column names match actual database schema
  @Column({ nullable: true, name: 'typeInspectionId' })
  typeInspectionId: number;

  @CreateDateColumn({ name: 'dateCreation' })
  dateCreation: Date;

  @UpdateDateColumn({ name: 'datemiseajour' })
  dateMiseAJour: Date;

  // JoinColumn names match actual database schema
  @ManyToOne(() => Actif, actif => actif.inspections)
  @JoinColumn({ name: 'actifId' })
  actif: Actif;

  // JoinColumn names match actual database schema
  @ManyToOne(() => TypeInspection, typeInspection => typeInspection.inspections)
  @JoinColumn({ name: 'typeInspectionId' })
  typeInspection: TypeInspection;

  @OneToMany(() => Anomalie, anomalie => anomalie.inspection)
  anomaliesDetectees: Anomalie[];
}