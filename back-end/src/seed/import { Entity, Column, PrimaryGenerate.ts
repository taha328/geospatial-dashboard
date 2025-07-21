import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { FamilleActif } from './famille-actif.entity';

@Entity('portefeuilles')
export class Portefeuille {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'actif' })
  statut: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @OneToMany(() => FamilleActif, famille => famille.portefeuille)
  familles: FamilleActif[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}