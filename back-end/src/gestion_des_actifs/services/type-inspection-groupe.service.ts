import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeInspectionGroupe } from '../entities/type-inspection-groupe.entity';

@Injectable()
export class TypeInspectionGroupeService {
  constructor(
    @InjectRepository(TypeInspectionGroupe)
    private typeInspectionGroupeRepository: Repository<TypeInspectionGroupe>,
  ) {}

  async findAll(): Promise<TypeInspectionGroupe[]> {
    return this.typeInspectionGroupeRepository.find({
      relations: ['typeInspection', 'groupeActif']
    });
  }

  async findOne(id: number): Promise<TypeInspectionGroupe> {
    const typeInspectionGroupe = await this.typeInspectionGroupeRepository.findOne({
      where: { id },
      relations: ['typeInspection', 'groupeActif']
    });

    if (!typeInspectionGroupe) {
      throw new NotFoundException(`Type inspection groupe avec l'ID ${id} non trouvé`);
    }

    return typeInspectionGroupe;
  }

  async findByGroupe(numeroGroupe: number): Promise<TypeInspectionGroupe[]> {
    return this.typeInspectionGroupeRepository.find({
      where: { numeroGroupe: numeroGroupe },
      relations: ['typeInspection', 'groupeActif']
    });
  }

  async findByInspection(numeroInspection: number): Promise<TypeInspectionGroupe[]> {
    return this.typeInspectionGroupeRepository.find({
      where: { numeroInspection: numeroInspection },
      relations: ['typeInspection', 'groupeActif']
    });
  }

  async create(createTypeInspectionGroupeDto: Partial<TypeInspectionGroupe>): Promise<TypeInspectionGroupe> {
    const typeInspectionGroupe = this.typeInspectionGroupeRepository.create(createTypeInspectionGroupeDto);
    return this.typeInspectionGroupeRepository.save(typeInspectionGroupe);
  }

  async update(id: number, updateTypeInspectionGroupeDto: Partial<TypeInspectionGroupe>): Promise<TypeInspectionGroupe> {
    await this.typeInspectionGroupeRepository.update(id, updateTypeInspectionGroupeDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.typeInspectionGroupeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Type inspection groupe avec l'ID ${id} non trouvé`);
    }
  }

  async getStatistics() {
    const total = await this.typeInspectionGroupeRepository.count();
    const active = await this.typeInspectionGroupeRepository.count({
      where: { statut: 'actif' }
    });

    // Get count by inspection type
    const byInspectionType = await this.typeInspectionGroupeRepository
      .createQueryBuilder('tig')
      .select('tig.type_inspection', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('tig.type_inspection')
      .getRawMany();

    return {
      total,
      active,
      inactive: total - active,
      byInspectionType
    };
  }
}
