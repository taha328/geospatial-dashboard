import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Portefeuille } from './entities/portefeuille.entity';
import { FamilleActif } from './entities/famille-actif.entity';
import { GroupeActif } from './entities/groupe-actif.entity';
import { Actif } from './entities/actif.entity';
import { Anomalie } from './entities/anomalie.entity';
import { Maintenance } from './entities/maintenance.entity';

// Services
import { PortefeuilleService } from './services/portefeuille.service';
import { FamilleActifService } from './services/famille-actif.service';
import { GroupeActifService } from './services/groupe-actif.service';
import { ActifService } from './services/actif.service';
import { AnomalieService } from './services/anomalie.service';
import { MaintenanceService } from './services/maintenance.service';
import { KPIService } from './services/kpi.service';
import { WorkflowService } from './services/workflow.service';
import { ReportService } from './services/report.service';

// Controllers
import { PortefeuilleController } from './controllers/portefeuille.controller';
import { FamilleActifController } from './controllers/famille-actif.controller';
import { GroupeActifController } from './controllers/groupe-actif.controller';
import { ActifController } from './controllers/actif.controller';
import { AnomalieController } from './controllers/anomalie.controller';
import { MaintenanceController } from './controllers/maintenance.controller';
import { KPIController } from './controllers/kpi.controller';
import { WorkflowController } from './controllers/workflow.controller';
import { ReportController } from './controllers/report.controller';

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
  controllers: [
    PortefeuilleController,
    FamilleActifController,
    GroupeActifController,
    ActifController,
    AnomalieController,
    MaintenanceController,
    KPIController,
    WorkflowController,
    ReportController
  ],
  providers: [
    PortefeuilleService,
    FamilleActifService,
    GroupeActifService,
    ActifService,
    AnomalieService,
    MaintenanceService,
    KPIService,
    WorkflowService,
    ReportService
  ],
  exports: [
    PortefeuilleService,
    FamilleActifService,
    GroupeActifService,
    ActifService,
    AnomalieService,
    MaintenanceService,
    KPIService,
    WorkflowService,
    ReportService,
    TypeOrmModule
  ]
})
export class GestionDesActifsModule {}
