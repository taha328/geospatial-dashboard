import { Module } from '@nestjs/common';
import { CarteIntegrationService } from '../services/carte-integration.service';
import { CarteIntegrationController } from '../controllers/carte-integration.controller';
import { GestionDesActifsModule } from '../gestion_des_actifs/gestion_des_actifs.module';

@Module({
  imports: [GestionDesActifsModule],
  controllers: [CarteIntegrationController],
  providers: [CarteIntegrationService],
  exports: [CarteIntegrationService],
})
export class CarteIntegrationModule {}
