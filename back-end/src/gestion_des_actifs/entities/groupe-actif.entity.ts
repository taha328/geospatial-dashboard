import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { FamilleActif } from './famille-actif.entity';
import { Actif } from './actif.entity';

@Entity('groupes_actifs')
export class GroupeActif {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  nom: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ length: 100 })
  code: string;

@Column({
  type: 'enum',
  enum: [
    'bollards',
    'ducs_albe',
    'defenses',
    'grues_portiques',
    'grues_mobiles',
    'chariots_elevateurs',
    'reach_stackers',
    'eclairage',
    'signalisation',
    'systemes_securite',
    'alimentations_electriques',
    'vehicules_service',
    'remorques_specialisees',
    'navettes'
  ],
  default: 'bollards'
})
type: string;

  @Column({ type: 'enum', enum: ['actif', 'inactif', 'maintenance'], default: 'actif' })
  statut: string;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  familleActifId: number;

  @CreateDateColumn()
  dateCreation: Date;

  @UpdateDateColumn()
  dateMiseAJour: Date;

  @ManyToOne(() => FamilleActif, familleActif => familleActif.groupesActifs)
  @JoinColumn({ name: 'familleActifId' })
  familleActif: FamilleActif;

  @OneToMany(() => Actif, actif => actif.groupeActif)
  actifs: Actif[];
}
