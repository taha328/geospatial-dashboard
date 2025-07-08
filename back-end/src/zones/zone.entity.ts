import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Zone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: string; // 'polygon', 'circle', 'rectangle', etc.

  @Column('text')
  geometry: string; // GeoJSON string

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  color: string;

  @Column({ default: 1 })
  opacity: number;
}