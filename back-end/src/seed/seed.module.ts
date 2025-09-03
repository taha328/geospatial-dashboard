import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { ActifsSeedService } from './actifs-seed.service';
import { SeedController } from './seed.controller';

// Import entities
import { Portefeuille } from '../gestion_des_actifs/entities/portefeuille.entity';
import { FamilleActif } from '../gestion_des_actifs/entities/famille-actif.entity';
import { GroupeActif } from '../gestion_des_actifs/entities/groupe-actif.entity';
import { Actif } from '../gestion_des_actifs/entities/actif.entity';
import { Anomalie } from '../gestion_des_actifs/entities/anomalie.entity';
import { Maintenance } from '../gestion_des_actifs/entities/maintenance.entity';
import { TypeInspection } from '../gestion_des_actifs/entities/type-inspection.entity';
import { TypeInspectionGroupe } from '../gestion_des_actifs/entities/type-inspection-groupe.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Portefeuille,
      FamilleActif,
      GroupeActif,
      Actif,
      Anomalie,
      Maintenance,
      TypeInspection,
      TypeInspectionGroupe
    ])
  ],
  controllers: [SeedController],
  providers: [SeedService, ActifsSeedService],
  exports: [SeedService]
})
export class SeedModule {}
