import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TypeInspectionGroupe } from './type-inspection-groupe.entity';

@Entity('types_inspection')
export class TypeInspection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
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

  @OneToMany(() => TypeInspectionGroupe, (typeInspectionGroupe: TypeInspectionGroupe) => typeInspectionGroupe.typeInspection)
  typeInspectionGroupes: TypeInspectionGroupe[];
}
