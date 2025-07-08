import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Point } from './point.entity';
import { PointService } from './point.service';
import { PointController } from './point.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Point])],
  providers: [PointService],
  controllers: [PointController],
})
export class PointModule {}
