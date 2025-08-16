import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { GroupeActif } from './groupe-actif.entity';
import { Anomalie } from './anomalie.entity';
import { Maintenance } from './maintenance.entity';

@Entity('actifs')
export class Actif {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  nom: string;

  @Column({ length: 100, nullable: true })
  type: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ length: 100, unique: true })
  code: string;


  @Column({ type: 'enum', enum: ['operationnel', 'hors_service', 'maintenance', 'alerte'], default: 'operationnel' })
  statutOperationnel: string;

  @Column({ type: 'enum', enum: ['bon', 'moyen', 'mauvais', 'critique'], default: 'bon' })
  etatGeneral: string;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Geometry',
    srid: 26191, // Merchich / Nord Maroc SRID
    nullable: true 
  })
  geometry: any; // PostGIS geometry for polygon/linestring actifs

  @Column({ type: 'date', nullable: true })
  dateMiseEnService: Date;

  @Column({ type: 'date', nullable: true })
  dateFinGarantie: Date;

  @Column({ length: 255, nullable: true })
  fournisseur: string;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  valeurAcquisition: number;

  @Column('json', { nullable: true })
  specifications: any;

  @Column({ nullable: true })
  groupeActifId: number;

  @CreateDateColumn()
  dateCreation: Date;

  @UpdateDateColumn()
  dateMiseAJour: Date;

  @ManyToOne(() => GroupeActif, groupeActif => groupeActif.actifs)
  @JoinColumn({ name: 'groupeActifId' })
  groupeActif: GroupeActif;

  @OneToMany(() => Anomalie, (anomalie: Anomalie) => anomalie.actif)
  anomalies: Anomalie[];

  @OneToMany(() => Maintenance, (maintenance: Maintenance) => maintenance.actif)
  maintenances: Maintenance[];
}
