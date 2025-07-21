import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { FamilleActif } from './famille-actif.entity';

@Entity('portefeuilles')
@Unique(['code']) // Ensure unique codes
@Unique(['nom']) // Ensure unique names if needed
export class Portefeuille {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true }) // Add unique constraint
  code: string;

  @Column({ length: 255 })
  nom: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['actif', 'inactif', 'en_cours'], default: 'actif' })
  statut: string;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  longitude: number;

  @CreateDateColumn()
  dateCreation: Date;

  @UpdateDateColumn()
  dateMiseAJour: Date;

  @OneToMany(() => FamilleActif, familleActif => familleActif.portefeuille)
  famillesActifs: FamilleActif[];
}
