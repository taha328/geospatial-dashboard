import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Zone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: string; 
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Geometry',
    srid: 26191, // Merchich / Nord Maroc SRID
    nullable: true 
  })
  geometry: any; // PostGIS geometry

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  color: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1 })
  opacity: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}