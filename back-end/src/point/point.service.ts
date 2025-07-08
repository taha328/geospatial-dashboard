import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Point } from './point.entity';

@Injectable()
export class PointService {
  constructor(
    @InjectRepository(Point)
    private pointRepository: Repository<Point>,
  ) {}

  findAll(): Promise<Point[]> {
    return this.pointRepository.find();
  }

  findOne(id: number): Promise<Point | null> {
    return this.pointRepository.findOneBy({ id });
  }

  create(data: Partial<Point>): Promise<Point> {
    const point = this.pointRepository.create(data);
    return this.pointRepository.save(point);
  }

  async update(id: number, data: Partial<Point>): Promise<Point | null> {
    await this.pointRepository.update(id, data);
    return this.pointRepository.findOneBy({ id });
  }

  async delete(id: number): Promise<void> {
    await this.pointRepository.delete(id);
  }
}
