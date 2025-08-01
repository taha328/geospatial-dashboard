import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Portefeuille } from './portefeuille.entity';
import { GroupeActif } from './groupe-actif.entity';

@Entity('familles_actifs')
export class FamilleActif {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  nom: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ length: 100 })
  code: string;

  @Column({ type: 'enum', enum: ['ouvrages_amarrage', 'ouvrages_accostage', 'equipements_manutention', 'infrastructures_support'], default: 'ouvrages_amarrage' })
  type: string;

  @Column({ type: 'enum', enum: ['actif', 'inactif', 'maintenance'], default: 'actif' })
  statut: string;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  portefeuilleId: number;

  @CreateDateColumn()
  dateCreation: Date;

  @UpdateDateColumn()
  dateMiseAJour: Date;

  @ManyToOne(() => Portefeuille, portefeuille => portefeuille.famillesActifs)
  @JoinColumn({ name: 'portefeuilleId' })
  portefeuille: Portefeuille;

  @OneToMany(() => GroupeActif, groupeActif => groupeActif.familleActif)
  groupesActifs: GroupeActif[];
}
