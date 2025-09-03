import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { TypeInspection } from './type-inspection.entity';
import { GroupeActif } from './groupe-actif.entity';

@Entity('types_inspection_groupe')
export class TypeInspectionGroupe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'numero_groupe' })
  numeroGroupe: number;

  @Column({ name: 'numero_inspection' })
  numeroInspection: number;

  @Column({ length: 255, name: 'type_inspection' })
  typeInspectionNom: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['actif', 'inactif'], default: 'actif' })
  statut: string;

  @CreateDateColumn({ name: 'datecreation' })
  dateCreation: Date;

  @UpdateDateColumn({ name: 'datemiseajour' })
  dateMiseAJour: Date;

  @ManyToOne(() => TypeInspection, typeInspection => typeInspection.typeInspectionGroupes)
  @JoinColumn({ name: 'numero_inspection', referencedColumnName: 'numeroInspection' })
  typeInspection: TypeInspection;

  @ManyToOne(() => GroupeActif, groupeActif => groupeActif.id)
  @JoinColumn({ name: 'numero_groupe', referencedColumnName: 'id' })
  groupeActif: GroupeActif;
}
