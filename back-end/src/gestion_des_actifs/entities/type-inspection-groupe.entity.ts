import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { TypeInspection } from './type-inspection.entity';
import { GroupeActif } from './groupe-actif.entity';

@Entity('types_inspection_groupe')
export class TypeInspectionGroupe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  numero_groupe: number;

  @Column()
  numero_inspection: number;

  @Column({ length: 255 })
  type_inspection: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['actif', 'inactif'], default: 'actif' })
  statut: string;

  @CreateDateColumn()
  dateCreation: Date;

  @UpdateDateColumn()
  dateMiseAJour: Date;

  @ManyToOne(() => TypeInspection, typeInspection => typeInspection.typeInspectionGroupes)
  @JoinColumn({ name: 'numero_inspection', referencedColumnName: 'numero_inspection' })
  typeInspection: TypeInspection;

  @ManyToOne(() => GroupeActif, groupeActif => groupeActif.id)
  @JoinColumn({ name: 'numero_groupe', referencedColumnName: 'id' })
  groupeActif: GroupeActif;
}
