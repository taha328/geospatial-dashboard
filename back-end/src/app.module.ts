import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointModule } from './point/point.module';
import { ZonesModule } from './zones/zones.module';
import { NetworksModule } from './networks/networks.module';
import { UserModule } from './user/user.module';
import { GestionDesActifsModule } from './gestion_des_actifs/gestion_des_actifs.module';
import { SeedModule } from './seed/seed.module';
import { CarteIntegrationModule } from './modules/carte-integration.module';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'qawsed?',
      database: 'db',
      autoLoadEntities: true,
      synchronize: true,
      logging: true, // Enable SQL query logging
      migrationsRun: false,

    }),
    PointModule,
    ZonesModule,
    NetworksModule,
    UserModule,
    GestionDesActifsModule,
    SeedModule,
    CarteIntegrationModule,

  ],
})
export class AppModule {}
