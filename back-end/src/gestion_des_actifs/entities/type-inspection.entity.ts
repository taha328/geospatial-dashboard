import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TypeInspectionGroupe } from './type-inspection-groupe.entity';
import { Inspection } from './inspection.entity';

@Entity('types_inspection')
export class TypeInspection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'numero_inspection' })
  numeroInspection: number;

  @Column({ length: 255, name: 'type_inspection' })
  typeInspection: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['actif', 'inactif'], default: 'actif' })
  statut: string;

  @CreateDateColumn({ name: 'datecreation' })
  dateCreation: Date;

  @UpdateDateColumn({ name: 'datemiseajour' })
  dateMiseAJour: Date;

  @OneToMany(() => TypeInspectionGroupe, (typeInspectionGroupe: TypeInspectionGroupe) => typeInspectionGroupe.typeInspection)
  typeInspectionGroupes: TypeInspectionGroupe[];

  @OneToMany(() => Inspection, (inspection: Inspection) => inspection.typeInspection)
  inspections: Inspection[];
}
