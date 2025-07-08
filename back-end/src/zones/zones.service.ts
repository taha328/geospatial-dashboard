import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from './zone.entity';

@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(Zone)
    private zoneRepository: Repository<Zone>,
  ) {}

  findAll(): Promise<Zone[]> {
    return this.zoneRepository.find();
  }

  findOne(id: number): Promise<Zone | null> {
    return this.zoneRepository.findOneBy({ id });
  }
async create(data: Partial<Zone>): Promise<Zone> {
  try {
    const zone = this.zoneRepository.create(data);
    return await this.zoneRepository.save(zone);
  } catch (error) {
    console.error('Error saving zone:', error);
    throw error;
  }
}

  async update(id: number, data: Partial<Zone>): Promise<Zone | null> {
    await this.zoneRepository.update(id, data);
    return this.zoneRepository.findOneBy({ id });
  }

  async delete(id: number): Promise<void> {
    await this.zoneRepository.delete(id);
  }
}
