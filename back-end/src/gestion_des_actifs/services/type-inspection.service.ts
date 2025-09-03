import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeInspection } from '../entities/type-inspection.entity';

@Injectable()
export class TypeInspectionService {
  constructor(
    @InjectRepository(TypeInspection)
    private typeInspectionRepository: Repository<TypeInspection>,
  ) {}

  async findAll(): Promise<TypeInspection[]> {
    return this.typeInspectionRepository.find({
      relations: ['typeInspectionGroupes']
    });
  }

  async findOne(id: number): Promise<TypeInspection> {
    const typeInspection = await this.typeInspectionRepository.findOne({
      where: { id },
      relations: ['typeInspectionGroupes']
    });

    if (!typeInspection) {
      throw new NotFoundException(`Type inspection avec l'ID ${id} non trouvé`);
    }

    return typeInspection;
  }

  async findByNumeroInspection(numeroInspection: number): Promise<TypeInspection> {
    const typeInspection = await this.typeInspectionRepository.findOne({
      where: { numeroInspection: numeroInspection },
      relations: ['typeInspectionGroupes']
    });

    if (!typeInspection) {
      throw new NotFoundException(`Type inspection avec le numéro ${numeroInspection} non trouvé`);
    }

    return typeInspection;
  }

  async create(createTypeInspectionDto: Partial<TypeInspection>): Promise<TypeInspection> {
    const typeInspection = this.typeInspectionRepository.create(createTypeInspectionDto);
    return this.typeInspectionRepository.save(typeInspection);
  }

  async update(id: number, updateTypeInspectionDto: Partial<TypeInspection>): Promise<TypeInspection> {
    await this.typeInspectionRepository.update(id, updateTypeInspectionDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.typeInspectionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Type inspection avec l'ID ${id} non trouvé`);
    }
  }

  async getStatistics() {
    const total = await this.typeInspectionRepository.count();
    const active = await this.typeInspectionRepository.count({
      where: { statut: 'actif' }
    });

    return {
      total,
      active,
      inactive: total - active
    };
  }
}
