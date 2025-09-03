import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Actif } from './actif.entity';
import { Anomalie } from './anomalie.entity';

@Entity('maintenances')
export class Maintenance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  titre: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['preventive', 'corrective', 'urgente'], default: 'preventive' })
  typeMaintenance: string;

  @Column({ type: 'enum', enum: ['planifiee', 'en_cours', 'terminee', 'annulee'], default: 'planifiee' })
  statut: string;

  @Column({ type: 'date' })
  datePrevue: Date;

  @Column({ type: 'date', nullable: true })
  dateDebut: Date;

  @Column({ type: 'date', nullable: true })
  dateFin: Date;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  coutEstime: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  coutReel: number;

  @Column({ length: 255, nullable: true })
  technicienResponsable: string;

  @Column({ length: 255, nullable: true })
  entrepriseExterne: string;

  @Column('text', { nullable: true })
  rapportIntervention: string;

  @Column('json', { nullable: true })
  piecesRemplacees: any;

  @Column('json', { nullable: true })
  documentsAnnexes: any;

  @Column({ nullable: true, name: 'actifId' })
  actifId: number;

  // Relationship with anomalie for corrective maintenance
  @Column({ nullable: true, name: 'anomalieId' })
  anomalieId?: number;

  @CreateDateColumn({ name: 'dateCreation' })
  dateCreation: Date;

  @UpdateDateColumn({ name: 'dateMiseAJour' })
  dateMiseAJour: Date;

  @ManyToOne(() => Actif, actif => actif.maintenances)
  @JoinColumn({ name: 'actifId' })
  actif: Actif;

  @OneToOne(() => Anomalie, anomalie => anomalie.maintenance)
  anomalie?: Anomalie;
}
