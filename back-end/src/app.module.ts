import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'qawsed?',
      database: process.env.DB_NAME || 'db',
      autoLoadEntities: true,
      // Never auto-sync in production
      synchronize: process.env.NODE_ENV === 'production' ? false : true,
      // Run migrations only when explicitly enabled
      migrationsRun: process.env.RUN_MIGRATIONS === 'true',
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      // For Cloud SQL via Unix domain socket (App Engine Standard), SSL not required
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      logging: true,
    }),
    PointModule,
    ZonesModule,
    NetworksModule,
    UserModule,
    GestionDesActifsModule,
    SeedModule,
    CarteIntegrationModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
