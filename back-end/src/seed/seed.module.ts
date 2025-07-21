import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { ActifsSeedService } from './actifs-seed.service';

// Import entities
import { Portefeuille } from '../gestion_des_actifs/entities/portefeuille.entity';
import { FamilleActif } from '../gestion_des_actifs/entities/famille-actif.entity';
import { GroupeActif } from '../gestion_des_actifs/entities/groupe-actif.entity';
import { Actif } from '../gestion_des_actifs/entities/actif.entity';
import { Anomalie } from '../gestion_des_actifs/entities/anomalie.entity';
import { Maintenance } from '../gestion_des_actifs/entities/maintenance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Portefeuille,
      FamilleActif,
      GroupeActif,
      Actif,
      Anomalie,
      Maintenance
    ])
  ],
  providers: [SeedService, ActifsSeedService],
  exports: [SeedService]
})
export class SeedModule {}
