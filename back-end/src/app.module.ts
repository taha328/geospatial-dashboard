import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointModule } from './point/point.module';
import { ZonesModule } from './zones/zones.module';
import { NetworksModule } from './networks/networks.module';
import { UserModule } from './user/user.module';


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
    }),
    PointModule,
    ZonesModule,
    NetworksModule,
    UserModule,

  ],
})
export class AppModule {}
